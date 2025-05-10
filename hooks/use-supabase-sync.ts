"use client"

import { useState, useEffect, useCallback } from "react"
import { getSupabase } from "@/lib/supabase"
import type { FileType, FolderType } from "@/types/file-system"
import type { SupabaseFile, SupabaseFolder, SyncState } from "@/types/supabase"
import { useAuth } from "./use-auth"

export function useSupabaseSync(
  fileSystem: { folders: FolderType[]; files: FileType[] },
  setFileSystem: (value: { folders: FolderType[]; files: FileType[] }) => void,
) {
  const [syncState, setSyncState] = useState<SyncState>({
    status: "idle",
    lastSynced: null,
    error: null,
  })
  const { user } = useAuth()
  const supabase = getSupabase()

  // Функция для загрузки данных из Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (!user) return null

    try {
      // Получаем папки
      const { data: folders, error: foldersError } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (foldersError) throw foldersError

      // Получаем файлы
      const { data: files, error: filesError } = await supabase
        .from("files")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (filesError) throw filesError

      return { folders, files }
    } catch (error) {
      console.error("Error fetching data from Supabase:", error)
      return null
    }
  }, [supabase, user])

  // Функция для преобразования данных из Supabase в локальный формат
  const convertToLocalFormat = useCallback((supabaseData: { folders: SupabaseFolder[]; files: SupabaseFile[] }) => {
    if (!supabaseData) return null

    // Создаем карту соответствия UUID -> local_id для папок
    const folderIdMap = new Map<string, string>()
    supabaseData.folders.forEach((folder) => {
      if (folder.local_id) {
        folderIdMap.set(folder.id, folder.local_id)
      }
    })

    // Преобразуем папки
    const folders: FolderType[] = supabaseData.folders.map((folder) => ({
      id: folder.local_id || folder.id,
      name: folder.name,
      isOpen: folder.is_open,
      parentId: folder.parent_id ? folderIdMap.get(folder.parent_id) || folder.parent_id : null,
    }))

    // Преобразуем файлы
    const files: FileType[] = supabaseData.files.map((file) => ({
      id: file.local_id || file.id,
      name: file.name,
      content: file.content,
      parentId: file.parent_id ? folderIdMap.get(file.parent_id) || file.parent_id : null,
    }))

    return { folders, files }
  }, [])

  // Функция для преобразования локальных данных в формат Supabase
  const convertToSupabaseFormat = useCallback(
    (localData: { folders: FolderType[]; files: FileType[] }, userId: string) => {
      if (!localData) return null

      // Создаем карту соответствия local_id -> UUID для папок
      const folderIdMap = new Map<string, string>()

      // Преобразуем папки
      const folders: Partial<SupabaseFolder>[] = localData.folders.map((folder) => {
        // Генерируем UUID для новых папок
        const folderId = crypto.randomUUID()
        folderIdMap.set(folder.id, folderId)

        return {
          id: folderId,
          name: folder.name,
          is_open: folder.isOpen,
          parent_id: folder.parentId, // Временно сохраняем локальный ID родителя
          user_id: userId,
          local_id: folder.id,
          updated_at: new Date().toISOString(),
        }
      })

      // Обновляем parent_id для папок, используя UUID
      folders.forEach((folder) => {
        if (folder.parent_id) {
          folder.parent_id = folderIdMap.get(folder.parent_id as string) || null
        }
      })

      // Преобразуем файлы
      const files: Partial<SupabaseFile>[] = localData.files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        content: file.content,
        parent_id: file.parentId ? folderIdMap.get(file.parentId) || null : null,
        user_id: userId,
        local_id: file.id,
        updated_at: new Date().toISOString(),
      }))

      return { folders, files }
    },
    [],
  )

  // Функция для синхронизации данных с Supabase
  const syncWithSupabase = useCallback(
    async (force = false) => {
      if (!user) return

      try {
        setSyncState((prev) => ({ ...prev, status: "syncing", error: null }))

        // Получаем данные из Supabase
        const supabaseData = await fetchFromSupabase()

        // Если данных нет в Supabase или принудительная синхронизация, загружаем локальные данные
        if (!supabaseData || supabaseData.folders.length === 0 || force) {
          // Преобразуем локальные данные в формат Supabase
          const dataToUpload = convertToSupabaseFormat(fileSystem, user.id)
          if (!dataToUpload) throw new Error("Failed to convert local data")

          // Удаляем существующие данные
          if (supabaseData && supabaseData.folders.length > 0) {
            const { error: deleteError } = await supabase.from("folders").delete().eq("user_id", user.id)
            if (deleteError) throw deleteError
          }

          // Загружаем папки
          const { error: foldersError } = await supabase.from("folders").insert(dataToUpload.folders)
          if (foldersError) throw foldersError

          // Загружаем файлы
          const { error: filesError } = await supabase.from("files").insert(dataToUpload.files)
          if (filesError) throw filesError

          // Обновляем статус синхронизации
          const now = new Date()
          setSyncState({
            status: "success",
            lastSynced: now,
            error: null,
          })

          // Обновляем статус синхронизации в базе данных
          await supabase.from("sync_status").upsert({
            user_id: user.id,
            last_sync: now.toISOString(),
            sync_version: 1,
          })
        } else {
          // Преобразуем данные из Supabase в локальный формат
          const localData = convertToLocalFormat(supabaseData)
          if (!localData) throw new Error("Failed to convert Supabase data")

          // Обновляем локальное хранилище
          setFileSystem(localData)

          // Обновляем статус синхронизации
          const now = new Date()
          setSyncState({
            status: "success",
            lastSynced: now,
            error: null,
          })
        }
      } catch (error: any) {
        console.error("Error syncing with Supabase:", error)
        setSyncState({
          status: "error",
          lastSynced: syncState.lastSynced,
          error: error.message,
        })
      }
    },
    [
      user,
      fileSystem,
      setFileSystem,
      fetchFromSupabase,
      convertToLocalFormat,
      convertToSupabaseFormat,
      supabase,
      syncState.lastSynced,
    ],
  )

  // Синхронизируем данные при изменении пользователя
  useEffect(() => {
    if (user) {
      syncWithSupabase()
    }
  }, [user, syncWithSupabase])

  return {
    syncState,
    syncWithSupabase,
  }
}

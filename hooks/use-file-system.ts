"use client"

import { useState, useEffect, useCallback } from "react"
import type { FileSystemType, FileType, FolderType } from "@/types/file-system"
import {
  getFileSystemFromLocalStorage,
  createFileInLocalStorage,
  updateFileInLocalStorage,
  deleteFileInLocalStorage,
  createFolderInLocalStorage,
  updateFolderInLocalStorage,
  deleteFolderInLocalStorage,
} from "@/lib/local-storage"

export function useFileSystem() {
  const [fileSystem, setFileSystem] = useState<FileSystemType>({
    folders: [],
    files: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useLocalStorage, setUseLocalStorage] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [lastErrorTime, setLastErrorTime] = useState<Date | null>(null)

  // Улучшаем функцию loadFileSystem для более надежной обработки ошибок
  const loadFileSystem = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Пробуем загрузить из API
      try {
        // Добавляем таймаут для запроса, чтобы избежать долгого ожидания
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // Увеличиваем таймаут до 8 секунд

        const response = await fetch("/api/file-system", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
          },
          signal: controller.signal,
        }).catch((err) => {
          if (err.name === "AbortError") {
            throw new Error("Запрос превысил время ожидания")
          }
          throw err
        })

        clearTimeout(timeoutId)

        // Проверяем статус ответа перед проверкой типа контента
        if (!response.ok) {
          // Для ошибок 5xx (серверные ошибки) сразу переключаемся на localStorage
          if (response.status >= 500) {
            // Пытаемся получить текст ошибки из ответа
            let errorText = ""
            try {
              const errorData = await response.json()
              errorText = errorData.error || ""
            } catch (e) {
              // Если не удалось получить JSON, пробуем получить текст
              errorText = await response.text()
            }

            const errorMessage = `Ошибка сервера: ${response.status} ${response.statusText}${errorText ? ": " + errorText : ""}. Переключение на локальное хранилище.`
            console.error(errorMessage)

            // Сохраняем информацию об ошибке
            setLastError(errorMessage)
            setLastErrorTime(new Date())

            throw new Error(errorMessage)
          }

          const errorText = await response.text()
          console.error(`Ошибка сервера: ${response.status} ${response.statusText}`, errorText)
          throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`)
        }

        // Проверяем тип контента перед парсингом JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Сервер вернул не JSON:", text)
          throw new Error(`Сервер вернул не JSON: ${text.substring(0, 100)}...`)
        }

        const data = await response.json()

        if (data.success) {
          setFileSystem(data.fileSystem)
          setUseLocalStorage(false)
          return
        } else {
          // Если сервер явно указал использовать локальное хранилище
          if (data.useLocalStorage) {
            throw new Error(data.error || "Сервер рекомендует использовать локальное хранилище")
          }
          throw new Error(data.error || "Не удалось загрузить файловую систему")
        }
      } catch (apiError) {
        console.error("Ошибка при загрузке из API, переключаемся на localStorage:", apiError)

        // Записываем ошибку для отображения пользователю
        setError(apiError instanceof Error ? apiError.message : "Ошибка при загрузке из API")

        // Если API недоступен, используем localStorage
        const localData = getFileSystemFromLocalStorage()
        setFileSystem(localData)
        setUseLocalStorage(true)
      }
    } catch (error) {
      console.error("Ошибка при загрузке файловой системы:", error)
      setError(error instanceof Error ? error.message : "Ошибка при загрузке файловой системы")

      // В случае ошибки, пробуем загрузить из localStorage
      try {
        const localData = getFileSystemFromLocalStorage()
        setFileSystem(localData)
        setUseLocalStorage(true)
      } catch (localError) {
        console.error("Ошибка при загрузке из localStorage:", localError)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Создание нового файла
  const createFile = useCallback(
    async (name: string, parentId: string, content = "") => {
      try {
        if (useLocalStorage) {
          // Используем localStorage
          const result = createFileInLocalStorage(fileSystem, name, parentId, content)
          setFileSystem(result.fileSystem)
          return { success: true, file: result.file }
        }

        // Используем API
        const response = await fetch("/api/files", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, parentId, content }),
        })

        // Проверяем статус ответа
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Ошибка сервера при создании файла: ${response.status}`, errorText)
          throw new Error(`Ошибка сервера: ${response.status}`)
        }

        // Проверяем тип контента перед парсингом JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Сервер вернул не JSON при создании файла:", text)

          // Переключаемся на localStorage
          setUseLocalStorage(true)
          const result = createFileInLocalStorage(fileSystem, name, parentId, content)
          setFileSystem(result.fileSystem)
          return { success: true, file: result.file }
        }

        const data = await response.json()

        if (data.success) {
          setFileSystem((prev) => ({
            ...prev,
            files: [...prev.files, data.file],
          }))
          return { success: true, file: data.file }
        } else {
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error("Ошибка при создании файла:", error)

        // В случае ошибки, используем localStorage
        setUseLocalStorage(true)
        const result = createFileInLocalStorage(fileSystem, name, parentId, content)
        setFileSystem(result.fileSystem)
        return { success: true, file: result.file }
      }
    },
    [fileSystem, useLocalStorage],
  )

  // Обновление файла
  const updateFile = useCallback(
    async (id: string, updates: Partial<FileType>) => {
      try {
        if (useLocalStorage) {
          // Используем localStorage
          const result = updateFileInLocalStorage(fileSystem, id, updates)
          setFileSystem(result.fileSystem)
          return { success: true, file: result.file }
        }

        // Используем API
        const response = await fetch(`/api/files/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        })

        // Проверяем статус ответа
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Ошибка сервера при обновлении файла: ${response.status}`, errorText)
          throw new Error(`Ошибка сервера: ${response.status}`)
        }

        // Проверяем тип контента
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Сервер вернул не JSON при обновлении файла:", text)

          // Переключаемся на localStorage
          setUseLocalStorage(true)
          const result = updateFileInLocalStorage(fileSystem, id, updates)
          setFileSystem(result.fileSystem)
          return { success: true, file: result.file }
        }

        const data = await response.json()

        if (data.success) {
          setFileSystem((prev) => ({
            ...prev,
            files: prev.files.map((file) => (file.id === id ? { ...file, ...data.file } : file)),
          }))
          return { success: true, file: data.file }
        } else {
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error("Ошибка при обновлении файла:", error)

        // В случае ошибки, используем localStorage
        setUseLocalStorage(true)
        const result = updateFileInLocalStorage(fileSystem, id, updates)
        setFileSystem(result.fileSystem)
        return { success: true, file: result.file }
      }
    },
    [fileSystem, useLocalStorage],
  )

  // Удаление файла
  const deleteFile = useCallback(
    async (id: string) => {
      try {
        if (useLocalStorage) {
          // Используем localStorage
          const result = deleteFileInLocalStorage(fileSystem, id)
          setFileSystem(result.fileSystem)
          return { success: true }
        }

        // Используем API
        const response = await fetch(`/api/files/${id}`, {
          method: "DELETE",
        })

        // Проверяем статус ответа
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Ошибка сервера при удалении файла: ${response.status}`, errorText)
          throw new Error(`Ошибка сервера: ${response.status}`)
        }

        // Проверяем тип контента
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Сервер вернул не JSON при удалении файла:", text)

          // Переключаемся на localStorage
          setUseLocalStorage(true)
          const result = deleteFileInLocalStorage(fileSystem, id)
          setFileSystem(result.fileSystem)
          return { success: true }
        }

        const data = await response.json()

        if (data.success) {
          setFileSystem((prev) => ({
            ...prev,
            files: prev.files.filter((file) => file.id !== id),
          }))
          return { success: true }
        } else {
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error("Ошибка при удалении файла:", error)

        // В случае ошибки, используем localStorage
        setUseLocalStorage(true)
        const result = deleteFileInLocalStorage(fileSystem, id)
        setFileSystem(result.fileSystem)
        return { success: true }
      }
    },
    [fileSystem, useLocalStorage],
  )

  // Создание новой папки
  const createFolder = useCallback(
    async (name: string, parentId: string | null) => {
      try {
        if (useLocalStorage) {
          // Используем localStorage
          const result = createFolderInLocalStorage(fileSystem, name, parentId)
          setFileSystem(result.fileSystem)
          return { success: true, folder: result.folder }
        }

        // Используем API
        const response = await fetch("/api/folders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, parentId }),
        })

        // Проверяем статус ответа
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Ошибка сервера при создании папки: ${response.status}`, errorText)
          throw new Error(`Ошибка сервера: ${response.status}`)
        }

        // Проверяем тип контента
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Сервер вернул не JSON при создании папки:", text)

          // Переключаемся на localStorage
          setUseLocalStorage(true)
          const result = createFolderInLocalStorage(fileSystem, name, parentId)
          setFileSystem(result.fileSystem)
          return { success: true, folder: result.folder }
        }

        const data = await response.json()

        if (data.success) {
          setFileSystem((prev) => ({
            ...prev,
            folders: [...prev.folders, data.folder],
          }))
          return { success: true, folder: data.folder }
        } else {
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error("Ошибка при создании папки:", error)

        // В случае ошибки, используем localStorage
        setUseLocalStorage(true)
        const result = createFolderInLocalStorage(fileSystem, name, parentId)
        setFileSystem(result.fileSystem)
        return { success: true, folder: result.folder }
      }
    },
    [fileSystem, useLocalStorage],
  )

  // Обновление папки
  const updateFolder = useCallback(
    async (id: string, updates: Partial<FolderType>) => {
      try {
        if (useLocalStorage) {
          // Используем localStorage
          const result = updateFolderInLocalStorage(fileSystem, id, updates)
          setFileSystem(result.fileSystem)
          return { success: true, folder: result.folder }
        }

        // Используем API
        const response = await fetch(`/api/folders/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        })

        // Проверяем статус ответа
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Ошибка сервера при обновлении папки: ${response.status}`, errorText)
          throw new Error(`Ошибка сервера: ${response.status}`)
        }

        // Проверяем тип контента
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Сервер вернул не JSON при обновлении папки:", text)

          // Переключаемся на localStorage
          setUseLocalStorage(true)
          const result = updateFolderInLocalStorage(fileSystem, id, updates)
          setFileSystem(result.fileSystem)
          return { success: true, folder: result.folder }
        }

        const data = await response.json()

        if (data.success) {
          setFileSystem((prev) => ({
            ...prev,
            folders: prev.folders.map((folder) => (folder.id === id ? { ...folder, ...data.folder } : folder)),
          }))
          return { success: true, folder: data.folder }
        } else {
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error("Ошибка при обновлении папки:", error)

        // В случае ошибки, используем localStorage
        setUseLocalStorage(true)
        const result = updateFolderInLocalStorage(fileSystem, id, updates)
        setFileSystem(result.fileSystem)
        return { success: true, folder: result.folder }
      }
    },
    [fileSystem, useLocalStorage],
  )

  // Удаление папки
  const deleteFolder = useCallback(
    async (id: string) => {
      try {
        if (useLocalStorage) {
          // Используем localStorage
          const result = deleteFolderInLocalStorage(fileSystem, id)
          setFileSystem(result.fileSystem)
          return { success: true }
        }

        // Используем API
        const response = await fetch(`/api/folders/${id}`, {
          method: "DELETE",
        })

        // Проверяем статус ответа
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Ошибка сервера при удалении папки: ${response.status}`, errorText)
          throw new Error(`Ошибка сервера: ${response.status}`)
        }

        // Проверяем тип контента
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Сервер вернул не JSON при удалении папки:", text)

          // Переключаемся на localStorage
          setUseLocalStorage(true)
          const result = deleteFolderInLocalStorage(fileSystem, id)
          setFileSystem(result.fileSystem)
          return { success: true }
        }

        const data = await response.json()

        if (data.success) {
          setFileSystem((prev) => ({
            ...prev,
            folders: prev.folders.filter((folder) => folder.id !== id),
          }))
          return { success: true }
        } else {
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error("Ошибка при удалении папки:", error)

        // В случае ошибки, используем localStorage
        setUseLocalStorage(true)
        const result = deleteFolderInLocalStorage(fileSystem, id)
        setFileSystem(result.fileSystem)
        return { success: true }
      }
    },
    [fileSystem, useLocalStorage],
  )

  // Переключение состояния открытия папки
  const toggleFolderOpen = useCallback(
    async (id: string) => {
      const folder = fileSystem.folders.find((f) => f.id === id)
      if (!folder) return { success: false, error: "Папка не найдена" }

      return await updateFolder(id, { isOpen: !folder.isOpen })
    },
    [fileSystem.folders, updateFolder],
  )

  // Принудительное переключение на локальное хранилище
  const switchToLocalStorage = useCallback(() => {
    setUseLocalStorage(true)
    const localData = getFileSystemFromLocalStorage()
    setFileSystem(localData)
  }, [])

  // Функция для проверки состояния подключения к базе данных
  const checkDatabaseConnection = useCallback(async () => {
    if (useLocalStorage) return { success: false, message: "Используется локальное хранилище" }

    try {
      const response = await fetch("/api/init-db", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        return {
          success: false,
          message: `Ошибка сервера: ${response.status} ${response.statusText}`,
        }
      }

      const data = await response.json()
      return {
        success: data.success,
        message: data.success ? "Подключение к базе данных успешно" : data.error,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Ошибка при проверке подключения",
      }
    }
  }, [useLocalStorage])

  // Функция для синхронизации данных между локальным хранилищем и базой данных
  const syncWithDatabase = useCallback(async () => {
    if (!useLocalStorage) return { success: false, message: "Уже используется база данных" }

    try {
      // Проверяем подключение к базе данных
      const connectionCheck = await checkDatabaseConnection()
      if (!connectionCheck.success) {
        return { success: false, message: `Невозможно синхронизировать: ${connectionCheck.message}` }
      }

      // Здесь должна быть логика синхронизации данных
      // Это сложная операция, которая требует отдельной реализации
      // Пока просто возвращаем заглушку
      return { success: false, message: "Функция синхронизации не реализована" }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Ошибка при синхронизации",
      }
    }
  }, [useLocalStorage, checkDatabaseConnection])

  // Загружаем файловую систему при монтировании компонента
  useEffect(() => {
    loadFileSystem()
  }, [loadFileSystem])

  return {
    fileSystem,
    loading,
    error,
    useLocalStorage,
    lastError,
    lastErrorTime,
    loadFileSystem,
    createFile,
    updateFile,
    deleteFile,
    createFolder,
    updateFolder,
    deleteFolder,
    toggleFolderOpen,
    switchToLocalStorage,
    checkDatabaseConnection,
    syncWithDatabase,
  }
}

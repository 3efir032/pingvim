import type { FileSystemType, FileType, FolderType } from "@/types/file-system"

// Ключи для localStorage
const FILE_SYSTEM_KEY = "pycharm-file-system"

// Получение файловой системы из localStorage
export function getFileSystemFromLocalStorage(): FileSystemType {
  if (typeof window === "undefined") {
    return { folders: [], files: [] }
  }

  try {
    const storedData = localStorage.getItem(FILE_SYSTEM_KEY)
    if (storedData) {
      return JSON.parse(storedData)
    }
  } catch (error) {
    console.error("Ошибка при чтении из localStorage:", error)
  }

  // Возвращаем пустую файловую систему с корневой папкой
  return {
    folders: [{ id: "1", name: "Notes", isOpen: true, parentId: null }],
    files: [
      {
        id: "1",
        name: "welcome.txt",
        content: "# Welcome to PingVim\n\nStart typing your notes here...",
        parentId: "1",
      },
    ],
  }
}

// Сохранение файловой системы в localStorage
export function saveFileSystemToLocalStorage(fileSystem: FileSystemType): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(FILE_SYSTEM_KEY, JSON.stringify(fileSystem))
  } catch (error) {
    console.error("Ошибка при записи в localStorage:", error)
  }
}

// Создание нового файла в localStorage
export function createFileInLocalStorage(
  fileSystem: FileSystemType,
  name: string,
  parentId: string,
  content = "",
): { fileSystem: FileSystemType; file: FileType } {
  const newFile: FileType = {
    id: Date.now().toString(),
    name,
    content,
    parentId,
  }

  const updatedFileSystem = {
    ...fileSystem,
    files: [...fileSystem.files, newFile],
  }

  saveFileSystemToLocalStorage(updatedFileSystem)
  return { fileSystem: updatedFileSystem, file: newFile }
}

// Обновление файла в localStorage
export function updateFileInLocalStorage(
  fileSystem: FileSystemType,
  id: string,
  updates: Partial<FileType>,
): { fileSystem: FileSystemType; file: FileType } {
  const updatedFiles = fileSystem.files.map((file) => (file.id === id ? { ...file, ...updates } : file))

  const updatedFileSystem = {
    ...fileSystem,
    files: updatedFiles,
  }

  saveFileSystemToLocalStorage(updatedFileSystem)
  return { fileSystem: updatedFileSystem, file: updatedFiles.find((f) => f.id === id) as FileType }
}

// Удаление файла из localStorage
export function deleteFileInLocalStorage(fileSystem: FileSystemType, id: string): { fileSystem: FileSystemType } {
  const updatedFileSystem = {
    ...fileSystem,
    files: fileSystem.files.filter((file) => file.id !== id),
  }

  saveFileSystemToLocalStorage(updatedFileSystem)
  return { fileSystem: updatedFileSystem }
}

// Создание новой папки в localStorage
export function createFolderInLocalStorage(
  fileSystem: FileSystemType,
  name: string,
  parentId: string | null,
): { fileSystem: FileSystemType; folder: FolderType } {
  const newFolder: FolderType = {
    id: Date.now().toString(),
    name,
    isOpen: false,
    parentId,
  }

  const updatedFileSystem = {
    ...fileSystem,
    folders: [...fileSystem.folders, newFolder],
  }

  saveFileSystemToLocalStorage(updatedFileSystem)
  return { fileSystem: updatedFileSystem, folder: newFolder }
}

// Обновление папки в localStorage
export function updateFolderInLocalStorage(
  fileSystem: FileSystemType,
  id: string,
  updates: Partial<FolderType>,
): { fileSystem: FileSystemType; folder: FolderType } {
  const updatedFolders = fileSystem.folders.map((folder) => (folder.id === id ? { ...folder, ...updates } : folder))

  const updatedFileSystem = {
    ...fileSystem,
    folders: updatedFolders,
  }

  saveFileSystemToLocalStorage(updatedFileSystem)
  return { fileSystem: updatedFileSystem, folder: updatedFolders.find((f) => f.id === id) as FolderType }
}

// Удаление папки из localStorage
export function deleteFolderInLocalStorage(fileSystem: FileSystemType, id: string): { fileSystem: FileSystemType } {
  // Находим все подпапки рекурсивно
  const foldersToDelete = [id]
  const filesToDelete: string[] = []

  // Находим все подпапки
  let i = 0
  while (i < foldersToDelete.length) {
    const folderId = foldersToDelete[i]
    const childFolders = fileSystem.folders.filter((f) => f.parentId === folderId)
    foldersToDelete.push(...childFolders.map((f) => f.id))
    i++
  }

  // Находим все файлы в удаляемых папках
  for (const folderId of foldersToDelete) {
    const folderFiles = fileSystem.files.filter((f) => f.parentId === folderId)
    filesToDelete.push(...folderFiles.map((f) => f.id))
  }

  const updatedFileSystem = {
    folders: fileSystem.folders.filter((folder) => !foldersToDelete.includes(folder.id)),
    files: fileSystem.files.filter((file) => !filesToDelete.includes(file.id)),
  }

  saveFileSystemToLocalStorage(updatedFileSystem)
  return { fileSystem: updatedFileSystem }
}

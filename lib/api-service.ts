// API service for interacting with the server
import type { FileType, FolderType } from "@/types/file-system"

// Base URL for API requests
const API_BASE_URL = "/api"

// Helper function for making API requests
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || "An error occurred while fetching the data.")
  }

  return response.json()
}

// Folders API
export const foldersAPI = {
  getAll: async (): Promise<FolderType[]> => {
    const folders = await fetchAPI("/folders")
    return folders.map((folder: any) => ({
      id: folder.id.toString(),
      name: folder.name,
      isOpen: folder.is_open === 1,
      parentId: folder.parent_id ? folder.parent_id.toString() : null,
    }))
  },

  create: async (folder: Omit<FolderType, "id">): Promise<FolderType> => {
    const newFolder = await fetchAPI("/folders", {
      method: "POST",
      body: JSON.stringify(folder),
    })
    return newFolder
  },

  update: async (folder: FolderType): Promise<FolderType> => {
    const updatedFolder = await fetchAPI(`/folders/${folder.id}`, {
      method: "PUT",
      body: JSON.stringify(folder),
    })
    return updatedFolder
  },

  delete: async (id: string): Promise<void> => {
    await fetchAPI(`/folders/${id}`, {
      method: "DELETE",
    })
  },
}

// Files API
export const filesAPI = {
  getAll: async (): Promise<FileType[]> => {
    const files = await fetchAPI("/files")
    return files.map((file: any) => ({
      id: file.id.toString(),
      name: file.name,
      content: file.content,
      parentId: file.parent_id ? file.parent_id.toString() : null,
    }))
  },

  create: async (file: Omit<FileType, "id">): Promise<FileType> => {
    const newFile = await fetchAPI("/files", {
      method: "POST",
      body: JSON.stringify(file),
    })
    return newFile
  },

  update: async (file: FileType): Promise<FileType> => {
    const updatedFile = await fetchAPI(`/files/${file.id}`, {
      method: "PUT",
      body: JSON.stringify(file),
    })
    return updatedFile
  },

  delete: async (id: string): Promise<void> => {
    await fetchAPI(`/files/${id}`, {
      method: "DELETE",
    })
  },
}

// Combined API for file system
export const fileSystemAPI = {
  // Load the entire file system
  loadFileSystem: async () => {
    const [folders, files] = await Promise.all([foldersAPI.getAll(), filesAPI.getAll()])
    return { folders, files }
  },
}

export interface FileType {
  id: string
  name: string
  content: string
  parentId: string | null
  createdAt?: string
  updatedAt?: string
}

export interface FolderType {
  id: string
  name: string
  isOpen: boolean
  parentId: string | null
  createdAt?: string
  updatedAt?: string
}

export interface OpenFileType {
  id: string
  isPrimary: boolean
}

export interface FileSystemType {
  folders: FolderType[]
  files: FileType[]
}

export interface ApiResponse<T> {
  success: boolean
  error?: string
  data?: T
}

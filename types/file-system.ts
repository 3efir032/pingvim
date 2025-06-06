export interface FileType {
  id: string
  name: string
  content: string
  parentId: string | null
}

export interface FolderType {
  id: string
  name: string
  isOpen: boolean
  parentId: string | null
}

export interface OpenFileType {
  id: string
  isPrimary: boolean
}

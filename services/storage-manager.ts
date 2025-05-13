"use client"

import { dbService } from "./database-service"
import type { FileType, FolderType } from "@/types/file-system"

export type StorageType = "local" | "database"

export interface FileSystem {
  folders: FolderType[]
  files: FileType[]
}

export class StorageManager {
  private storageType: StorageType = "local"
  private initialized = false

  constructor() {
    // Don't try to access localStorage during construction
    // We'll initialize later when needed
  }

  // Initialize from localStorage (only called client-side)
  private initialize() {
    if (this.initialized) return

    if (typeof window !== "undefined") {
      // Load preferred storage type from localStorage
      const savedType = localStorage.getItem("pycharm-storage-type")
      if (savedType === "database" || savedType === "local") {
        this.storageType = savedType
      }
      this.initialized = true
    }
  }

  getStorageType(): StorageType {
    this.initialize()
    return this.storageType
  }

  setStorageType(type: StorageType): void {
    this.initialize()
    this.storageType = type
    if (typeof window !== "undefined") {
      localStorage.setItem("pycharm-storage-type", type)
    }
  }

  isDatabaseAvailable(): boolean {
    return dbService.isEnabled()
  }

  async loadData(): Promise<FileSystem> {
    this.initialize()
    if (this.storageType === "database" && this.isDatabaseAvailable()) {
      try {
        const folders = await dbService.getFolders()
        const files = await dbService.getFiles()
        return { folders, files }
      } catch (error) {
        console.error("Failed to load data from database:", error)
        // Fall back to local storage
        return this.loadFromLocalStorage()
      }
    } else {
      return this.loadFromLocalStorage()
    }
  }

  private loadFromLocalStorage(): FileSystem {
    if (typeof window === "undefined") {
      // Return default empty structure when running on server
      return {
        folders: [{ id: "1", name: "Notes", isOpen: true, parentId: null }],
        files: [],
      }
    }

    try {
      const data = localStorage.getItem("pycharm-file-system")
      if (data) {
        return JSON.parse(data)
      }
    } catch (error) {
      console.error("Failed to load data from local storage:", error)
    }

    // Return default empty structure
    return {
      folders: [{ id: "1", name: "Notes", isOpen: true, parentId: null }],
      files: [],
    }
  }

  async saveData(data: FileSystem): Promise<void> {
    this.initialize()
    // Always save to local storage as a backup
    if (typeof window !== "undefined") {
      localStorage.setItem("pycharm-file-system", JSON.stringify(data))
    }

    // If database is selected and available, save there too
    if (this.storageType === "database" && this.isDatabaseAvailable()) {
      try {
        // Process folders
        for (const folder of data.folders) {
          await dbService.saveFolder(folder)
        }

        // Process files
        for (const file of data.files) {
          await dbService.saveFile(file)
        }
      } catch (error) {
        console.error("Failed to save data to database:", error)
        throw error
      }
    }
  }

  async deleteFolder(id: string): Promise<void> {
    if (this.storageType === "database" && this.isDatabaseAvailable()) {
      try {
        await dbService.deleteFolder(id)
      } catch (error) {
        console.error("Failed to delete folder from database:", error)
        throw error
      }
    }
    // Local storage deletion is handled by the component that calls this method
  }

  async deleteFile(id: string): Promise<void> {
    if (this.storageType === "database" && this.isDatabaseAvailable()) {
      try {
        await dbService.deleteFile(id)
      } catch (error) {
        console.error("Failed to delete file from database:", error)
        throw error
      }
    }
    // Local storage deletion is handled by the component that calls this method
  }

  async migrateToDatabase(): Promise<boolean> {
    if (!this.isDatabaseAvailable()) {
      return false
    }

    try {
      const localData = this.loadFromLocalStorage()

      // Save all folders
      for (const folder of localData.folders) {
        await dbService.saveFolder(folder)
      }

      // Save all files
      for (const file of localData.files) {
        await dbService.saveFile(file)
      }

      return true
    } catch (error) {
      console.error("Failed to migrate data to database:", error)
      return false
    }
  }

  async migrateToLocal(): Promise<boolean> {
    if (!this.isDatabaseAvailable()) {
      return false
    }

    try {
      const folders = await dbService.getFolders()
      const files = await dbService.getFiles()

      const data: FileSystem = { folders, files }
      if (typeof window !== "undefined") {
        localStorage.setItem("pycharm-file-system", JSON.stringify(data))
      }

      return true
    } catch (error) {
      console.error("Failed to migrate data to local storage:", error)
      return false
    }
  }
}

// Create a singleton instance
export const storageManager = new StorageManager()

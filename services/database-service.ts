"use client"

import type { FileType, FolderType } from "@/types/file-system"

export interface DbConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  enabled: boolean
}

export class DatabaseService {
  private config: DbConfig | null = null
  private initialized = false

  constructor() {
    // Don't try to access localStorage during construction
    // We'll initialize later when needed
  }

  // Initialize config from localStorage (only called client-side)
  private initialize() {
    if (this.initialized) return

    if (typeof window !== "undefined") {
      // Load config from localStorage if available
      const savedConfig = localStorage.getItem("pycharm-db-config")
      if (savedConfig) {
        try {
          this.config = JSON.parse(savedConfig)
        } catch (error) {
          console.error("Failed to parse database config:", error)
        }
      }
      this.initialized = true
    }
  }

  async testConnection(config: DbConfig): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch("/api/db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "testConnection",
          data: config,
        }),
      })

      return await response.json()
    } catch (error) {
      console.error("Connection test failed:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  saveConfig(config: DbConfig) {
    this.initialize()
    this.config = config
    if (typeof window !== "undefined") {
      localStorage.setItem("pycharm-db-config", JSON.stringify(config))
    }
  }

  getConfig(): DbConfig | null {
    this.initialize()
    return this.config
  }

  isEnabled(): boolean {
    this.initialize()
    return !!this.config?.enabled
  }

  async getFolders(): Promise<FolderType[]> {
    this.initialize()
    if (!this.config) {
      throw new Error("Database configuration not set")
    }

    try {
      const response = await fetch("/api/db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getFolders",
          data: this.config,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch folders")
      }

      return result.folders
    } catch (error) {
      console.error("Failed to fetch folders:", error)
      throw error
    }
  }

  async getFiles(): Promise<FileType[]> {
    this.initialize()
    if (!this.config) {
      throw new Error("Database configuration not set")
    }

    try {
      const response = await fetch("/api/db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getFiles",
          data: this.config,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch files")
      }

      return result.files
    } catch (error) {
      console.error("Failed to fetch files:", error)
      throw error
    }
  }

  async saveFolder(folder: FolderType): Promise<string> {
    this.initialize()
    if (!this.config) {
      throw new Error("Database configuration not set")
    }

    try {
      const response = await fetch("/api/db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "saveFolder",
          data: {
            config: this.config,
            folder,
          },
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Failed to save folder")
      }

      return result.id
    } catch (error) {
      console.error("Failed to save folder:", error)
      throw error
    }
  }

  async saveFile(file: FileType): Promise<string> {
    this.initialize()
    if (!this.config) {
      throw new Error("Database configuration not set")
    }

    try {
      const response = await fetch("/api/db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "saveFile",
          data: {
            config: this.config,
            file,
          },
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Failed to save file")
      }

      return result.id
    } catch (error) {
      console.error("Failed to save file:", error)
      throw error
    }
  }

  async deleteFolder(id: string): Promise<void> {
    this.initialize()
    if (!this.config) {
      throw new Error("Database configuration not set")
    }

    try {
      const response = await fetch("/api/db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "deleteFolder",
          data: {
            config: this.config,
            id,
          },
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Failed to delete folder")
      }
    } catch (error) {
      console.error("Failed to delete folder:", error)
      throw error
    }
  }

  async deleteFile(id: string): Promise<void> {
    this.initialize()
    if (!this.config) {
      throw new Error("Database configuration not set")
    }

    try {
      const response = await fetch("/api/db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "deleteFile",
          data: {
            config: this.config,
            id,
          },
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Failed to delete file")
      }
    } catch (error) {
      console.error("Failed to delete file:", error)
      throw error
    }
  }
}

// Create a singleton instance
export const dbService = new DatabaseService()

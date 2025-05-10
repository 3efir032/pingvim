"use client"

import type { FileType, FolderType } from "@/types/file-system"

// Database connection status
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"

// Database connection configuration
export interface DbConfig {
  host: string
  port: string
  user: string
  password: string
  database: string
}

// Default connection configuration
export const defaultDbConfig: DbConfig = {
  host: "91.203.233.176",
  port: "3306",
  user: "Steam_bot",
  password: "ghz!zgw6qkt1cqb6AWP",
  database: "steam_db",
}

class DbService {
  private status: ConnectionStatus = "disconnected"
  private errorMessage = ""
  private statusListeners: ((status: ConnectionStatus, error?: string) => void)[] = []

  // Add a listener for connection status changes
  public addStatusListener(listener: (status: ConnectionStatus, error?: string) => void) {
    this.statusListeners.push(listener)
    // Immediately notify the new listener of the current status
    listener(this.status, this.errorMessage)
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener)
    }
  }

  // Update status and notify all listeners
  private updateStatus(status: ConnectionStatus, error?: string) {
    this.status = status
    this.errorMessage = error || ""
    this.statusListeners.forEach((listener) => listener(this.status, this.errorMessage))
  }

  // Connect to the database
  public async connect(config: DbConfig): Promise<boolean> {
    try {
      this.updateStatus("connecting")

      // Make API call to connect to the database
      const response = await fetch("/api/db/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (!response.ok) {
        this.updateStatus("error", data.error || "Failed to connect to database")
        return false
      }

      this.updateStatus("connected")
      return true
    } catch (error) {
      this.updateStatus("error", error instanceof Error ? error.message : "Unknown error")
      return false
    }
  }

  // Disconnect from the database
  public async disconnect(): Promise<boolean> {
    try {
      // Make API call to disconnect from the database
      const response = await fetch("/api/db/disconnect", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        this.updateStatus("error", data.error || "Failed to disconnect from database")
        return false
      }

      this.updateStatus("disconnected")
      return true
    } catch (error) {
      this.updateStatus("error", error instanceof Error ? error.message : "Unknown error")
      return false
    }
  }

  // Check connection status
  public async checkStatus(): Promise<ConnectionStatus> {
    try {
      const response = await fetch("/api/db/status")

      if (!response.ok) {
        const data = await response.json()
        this.updateStatus("error", data.error || "Failed to check database status")
        return "error"
      }

      const data = await response.json()
      this.updateStatus(data.status)
      return data.status
    } catch (error) {
      this.updateStatus("error", error instanceof Error ? error.message : "Unknown error")
      return "error"
    }
  }

  // Save file system to database
  public async saveFileSystem(fileSystem: { folders: FolderType[]; files: FileType[] }): Promise<boolean> {
    try {
      if (this.status !== "connected") {
        return false
      }

      const response = await fetch("/api/db/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fileSystem),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error("Failed to save to database:", data.error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error saving to database:", error)
      return false
    }
  }

  // Load file system from database
  public async loadFileSystem(): Promise<{ folders: FolderType[]; files: FileType[] } | null> {
    try {
      if (this.status !== "connected") {
        return null
      }

      const response = await fetch("/api/db/load")

      if (!response.ok) {
        const data = await response.json()
        console.error("Failed to load from database:", data.error)
        return null
      }

      const data = await response.json()
      return data.fileSystem
    } catch (error) {
      console.error("Error loading from database:", error)
      return null
    }
  }

  // Get current status
  public getStatus(): { status: ConnectionStatus; error: string } {
    return { status: this.status, error: this.errorMessage }
  }
}

// Create a singleton instance
const dbService = new DbService()
export default dbService

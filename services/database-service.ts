"use client"

import mysql from "mysql2/promise"
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
  private pool: mysql.Pool | null = null

  constructor() {
    // Load config from localStorage if available
    const savedConfig = localStorage.getItem("pycharm-db-config")
    if (savedConfig) {
      try {
        this.config = JSON.parse(savedConfig)
        if (this.config?.enabled) {
          this.initPool()
        }
      } catch (error) {
        console.error("Failed to parse database config:", error)
      }
    }
  }

  private initPool() {
    if (!this.config) return

    try {
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      })
    } catch (error) {
      console.error("Failed to create connection pool:", error)
    }
  }

  async testConnection(config: DbConfig): Promise<{ success: boolean; message: string }> {
    try {
      const tempPool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0,
      })

      const connection = await tempPool.getConnection()
      connection.release()
      await tempPool.end()

      return { success: true, message: "Connection successful!" }
    } catch (error) {
      console.error("Connection test failed:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  saveConfig(config: DbConfig) {
    this.config = config
    localStorage.setItem("pycharm-db-config", JSON.stringify(config))

    if (this.pool) {
      this.pool.end().catch((err) => console.error("Error closing pool:", err))
      this.pool = null
    }

    if (config.enabled) {
      this.initPool()
    }
  }

  getConfig(): DbConfig | null {
    return this.config
  }

  isEnabled(): boolean {
    return !!this.config?.enabled && !!this.pool
  }

  async getFolders(): Promise<FolderType[]> {
    if (!this.pool) {
      throw new Error("Database connection not initialized")
    }

    try {
      const [rows] = await this.pool.query<mysql.RowDataPacket[]>("SELECT id, name, is_open, parent_id FROM pingvim")

      return rows.map((row) => ({
        id: row.id.toString(),
        name: row.name,
        isOpen: !!row.is_open,
        parentId: row.parent_id ? row.parent_id.toString() : null,
      }))
    } catch (error) {
      console.error("Failed to fetch folders:", error)
      throw error
    }
  }

  async getFiles(): Promise<FileType[]> {
    if (!this.pool) {
      throw new Error("Database connection not initialized")
    }

    try {
      const [rows] = await this.pool.query<mysql.RowDataPacket[]>("SELECT id, name, content, parent_id FROM files")

      return rows.map((row) => ({
        id: row.id.toString(),
        name: row.name,
        content: row.content || "",
        parentId: row.parent_id ? row.parent_id.toString() : null,
      }))
    } catch (error) {
      console.error("Failed to fetch files:", error)
      throw error
    }
  }

  async saveFolder(folder: FolderType): Promise<string> {
    if (!this.pool) {
      throw new Error("Database connection not initialized")
    }

    try {
      if (folder.id && !folder.id.startsWith("temp_")) {
        // Update existing folder
        await this.pool.query(
          "UPDATE pingvim SET name = ?, is_open = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [folder.name, folder.isOpen ? 1 : 0, folder.parentId, folder.id],
        )
        return folder.id
      } else {
        // Create new folder
        const [result] = await this.pool.query<mysql.ResultSetHeader>(
          "INSERT INTO pingvim (name, is_open, parent_id, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
          [folder.name, folder.isOpen ? 1 : 0, folder.parentId],
        )
        return result.insertId.toString()
      }
    } catch (error) {
      console.error("Failed to save folder:", error)
      throw error
    }
  }

  async saveFile(file: FileType): Promise<string> {
    if (!this.pool) {
      throw new Error("Database connection not initialized")
    }

    try {
      if (file.id && !file.id.startsWith("temp_")) {
        // Update existing file
        await this.pool.query("UPDATE files SET name = ?, content = ?, parent_id = ? WHERE id = ?", [
          file.name,
          file.content,
          file.parentId,
          file.id,
        ])
        return file.id
      } else {
        // Create new file
        const [result] = await this.pool.query<mysql.ResultSetHeader>(
          "INSERT INTO files (name, content, parent_id) VALUES (?, ?, ?)",
          [file.name, file.content, file.parentId],
        )
        return result.insertId.toString()
      }
    } catch (error) {
      console.error("Failed to save file:", error)
      throw error
    }
  }

  async deleteFolder(id: string): Promise<void> {
    if (!this.pool) {
      throw new Error("Database connection not initialized")
    }

    try {
      await this.pool.query("DELETE FROM pingvim WHERE id = ?", [id])
    } catch (error) {
      console.error("Failed to delete folder:", error)
      throw error
    }
  }

  async deleteFile(id: string): Promise<void> {
    if (!this.pool) {
      throw new Error("Database connection not initialized")
    }

    try {
      await this.pool.query("DELETE FROM files WHERE id = ?", [id])
    } catch (error) {
      console.error("Failed to delete file:", error)
      throw error
    }
  }
}

// Create a singleton instance
export const dbService = new DatabaseService()

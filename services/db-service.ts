"use client"

import type { FileType, FolderType } from "@/types/file-system"

// Статус подключения к базе данных
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"

// Конфигурация подключения к базе данных
export interface DbConfig {
  host: string
  port: string
  user: string
  password: string
  database: string
}

// Конфигурация по умолчанию
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

  // Добавить слушателя изменений статуса
  public addStatusListener(listener: (status: ConnectionStatus, error?: string) => void) {
    this.statusListeners.push(listener)
    // Сразу уведомляем нового слушателя о текущем статусе
    listener(this.status, this.errorMessage)
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener)
    }
  }

  // Обновить статус и уведомить всех слушателей
  private updateStatus(status: ConnectionStatus, error?: string) {
    this.status = status
    this.errorMessage = error || ""
    this.statusListeners.forEach((listener) => listener(this.status, this.errorMessage))
  }

  // Подключиться к базе данных
  public async connect(config: DbConfig): Promise<boolean> {
    try {
      this.updateStatus("connecting")

      // Делаем API-запрос для подключения к базе данных
      const response = await fetch("/api/db/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (!response.ok) {
        this.updateStatus("error", data.error || "Не удалось подключиться к базе данных")
        return false
      }

      this.updateStatus("connected")
      return true
    } catch (error) {
      this.updateStatus("error", error instanceof Error ? error.message : "Неизвестная ошибка")
      return false
    }
  }

  // Отключиться от базы данных
  public async disconnect(): Promise<boolean> {
    try {
      // Делаем API-запрос для отключения от базы данных
      const response = await fetch("/api/db/disconnect", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        this.updateStatus("error", data.error || "Не удалось отключиться от базы данных")
        return false
      }

      this.updateStatus("disconnected")
      return true
    } catch (error) {
      this.updateStatus("error", error instanceof Error ? error.message : "Неизвестная ошибка")
      return false
    }
  }

  // Проверить статус подключения
  public async checkStatus(): Promise<ConnectionStatus> {
    try {
      const response = await fetch("/api/db/status")

      if (!response.ok) {
        const data = await response.json()
        this.updateStatus("error", data.error || "Не удалось проверить статус базы данных")
        return "error"
      }

      const data = await response.json()
      this.updateStatus(data.status)
      return data.status
    } catch (error) {
      this.updateStatus("error", error instanceof Error ? error.message : "Неизвестная ошибка")
      return "error"
    }
  }

  // Сохранить файловую систему в базу данных
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
        console.error("Не удалось сохранить в базу данных:", data.error)
        return false
      }

      return true
    } catch (error) {
      console.error("Ошибка сохранения в базу данных:", error)
      return false
    }
  }

  // Загрузить файловую систему из базы данных
  public async loadFileSystem(): Promise<{ folders: FolderType[]; files: FileType[] } | null> {
    try {
      if (this.status !== "connected") {
        return null
      }

      const response = await fetch("/api/db/load")

      if (!response.ok) {
        const data = await response.json()
        console.error("Не удалось загрузить из базы данных:", data.error)
        return null
      }

      const data = await response.json()
      return data.fileSystem
    } catch (error) {
      console.error("Ошибка загрузки из базы данных:", error)
      return null
    }
  }

  // Получить текущий статус
  public getStatus(): { status: ConnectionStatus; error: string } {
    return { status: this.status, error: this.errorMessage }
  }
}

// Создаем синглтон
const dbService = new DbService()
export default dbService

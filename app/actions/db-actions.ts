"use server"

import {
  initDb,
  testDbConnection,
  closeDb,
  isDbConnected,
  getFileSystemFromDb,
  syncLocalDataWithDb,
} from "@/lib/mock-db"
import type { DbConfig } from "@/lib/mock-db"
import type { FileType, FolderType } from "@/types/file-system"

// Действие для подключения к базе данных
export async function connectToDatabase(config: DbConfig) {
  try {
    // Инициализируем соединение с базой данных
    const connectionResult = await initDb(config)
    return connectionResult
  } catch (error) {
    console.error("Ошибка подключения к базе данных:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка подключения к базе данных",
    }
  }
}

// Действие для проверки соединения с базой данных
export async function testDatabaseConnection(config: DbConfig) {
  return await testDbConnection(config)
}

// Действие для отключения от базы данных
export async function disconnectFromDatabase() {
  try {
    await closeDb()
    return { success: true, message: "Соединение с базой данных закрыто" }
  } catch (error) {
    console.error("Ошибка отключения от базы данных:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка отключения от базы данных",
    }
  }
}

// Действие для проверки, подключена ли база данных
export async function checkDatabaseConnection() {
  return { connected: isDbConnected() }
}

// Действие для получения файловой системы из базы данных
export async function fetchFileSystemFromDb() {
  try {
    if (!isDbConnected()) {
      return { success: false, message: "База данных не подключена", data: null }
    }

    const fileSystem = await getFileSystemFromDb()
    return { success: true, message: "Данные успешно получены", data: fileSystem }
  } catch (error) {
    console.error("Ошибка получения данных из базы данных:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка получения данных",
      data: null,
    }
  }
}

// Действие для синхронизации локальных данных с базой данных
export async function syncDataWithDatabase(fileSystem: { folders: FolderType[]; files: FileType[] }) {
  try {
    if (!isDbConnected()) {
      return { success: false, message: "База данных не подключена" }
    }

    await syncLocalDataWithDb(fileSystem)
    return { success: true, message: "Данные успешно синхронизированы с базой данных" }
  } catch (error) {
    console.error("Ошибка синхронизации данных с базой данных:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка синхронизации данных",
    }
  }
}

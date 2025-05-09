import type { FileType, FolderType } from "@/types/file-system"

// Имитация хранилища данных
let mockDbStorage: {
  folders: FolderType[]
  files: FileType[]
} | null = null

// Имитация состояния подключения
let isConnected = false

// Функция для имитации подключения к базе данных
export async function connectToDbMock(config: any): Promise<{ success: boolean; message: string }> {
  try {
    // Имитируем задержку сетевого запроса
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Проверяем минимальные требования к конфигурации
    if (!config.host || !config.database || !config.user) {
      return { success: false, message: "Неверные параметры подключения" }
    }

    // Имитируем успешное подключение
    isConnected = true

    // Инициализируем хранилище, если оно еще не создано
    if (!mockDbStorage) {
      mockDbStorage = { folders: [], files: [] }
    }

    return { success: true, message: "Соединение с базой данных установлено (имитация)" }
  } catch (error) {
    console.error("Ошибка подключения к базе данных:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка подключения к базе данных",
    }
  }
}

// Функция для проверки соединения с базой данных
export async function testDbConnectionMock(config: any): Promise<{ success: boolean; message: string }> {
  try {
    // Имитируем задержку сетевого запроса
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Проверяем минимальные требования к конфигурации
    if (!config.host || !config.database || !config.user) {
      return { success: false, message: "Неверные параметры подключения" }
    }

    return { success: true, message: "Соединение с базой данных успешно (имитация)" }
  } catch (error) {
    console.error("Ошибка проверки соединения:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка проверки соединения",
    }
  }
}

// Функция для закрытия соединения с базой данных
export async function disconnectFromDbMock(): Promise<{ success: boolean; message: string }> {
  // Имитируем задержку сетевого запроса
  await new Promise((resolve) => setTimeout(resolve, 300))
  isConnected = false
  return { success: true, message: "Соединение с базой данных закрыто (имитация)" }
}

// Функция для проверки, подключена ли база данных
export function isDbConnectedMock(): boolean {
  return isConnected
}

// Функция для получения всей файловой системы из базы данных
export async function getFileSystemFromDbMock(): Promise<{ folders: FolderType[]; files: FileType[] } | null> {
  if (!isConnected || !mockDbStorage) {
    return null
  }

  // Имитируем задержку сетевого запроса
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    folders: [...mockDbStorage.folders],
    files: [...mockDbStorage.files],
  }
}

// Функция для синхронизации локальных данных с базой данных
export async function syncLocalDataWithDbMock(fileSystem: {
  folders: FolderType[]
  files: FileType[]
}): Promise<{ success: boolean; message: string }> {
  if (!isConnected) {
    return { success: false, message: "База данных не подключена" }
  }

  // Имитируем задержку сетевого запроса
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Обновляем имитацию хранилища
  mockDbStorage = {
    folders: [...fileSystem.folders],
    files: [...fileSystem.files],
  }

  return { success: true, message: "Данные синхронизированы с базой данных (имитация)" }
}

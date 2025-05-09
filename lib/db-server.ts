import { isPreviewEnvironment } from "./environment"
import type { DbConfig } from "./db-types"
import type { FileType, FolderType } from "@/types/file-system"
import {
  connectToDbMock,
  testDbConnectionMock,
  disconnectFromDbMock,
  isDbConnectedMock,
  getFileSystemFromDbMock,
  syncLocalDataWithDbMock,
} from "./db-mock"

// Глобальная переменная для хранения пула соединений
let pool: any = null

// Функция для получения текущего пула соединений
export function getPool(): any | null {
  return pool
}

// Функция для установки соединения с базой данных
export async function connectToDb(config: DbConfig): Promise<{ success: boolean; message: string }> {
  // Используем имитацию в среде предпросмотра
  if (isPreviewEnvironment) {
    return connectToDbMock(config)
  }

  try {
    // Импортируем pg только на сервере и не в среде предпросмотра
    const { Pool } = await import("pg")

    // Закрываем предыдущее соединение, если оно существует
    if (pool) {
      await pool.end()
    }

    // Создаем новый пул соединений
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    })

    // Проверяем соединение
    const client = await pool.connect()
    client.release()

    // Создаем таблицы, если они не существуют
    await initTables()

    return {
      success: true,
      message: "Соединение с базой данных установлено",
    }
  } catch (error) {
    console.error("Ошибка подключения к базе данных:", error)

    // Закрываем пул в случае ошибки
    if (pool) {
      await pool.end()
      pool = null
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка подключения к базе данных",
    }
  }
}

// Функция для закрытия соединения с базой данных
export async function disconnectFromDb(): Promise<{ success: boolean; message: string }> {
  // Используем имитацию в среде предпросмотра
  if (isPreviewEnvironment) {
    return disconnectFromDbMock()
  }

  try {
    if (pool) {
      await pool.end()
      pool = null
    }

    return {
      success: true,
      message: "Соединение с базой данных закрыто",
    }
  } catch (error) {
    console.error("Ошибка отключения от базы данных:", error)

    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка отключения от базы данных",
    }
  }
}

// Функция для проверки соединения с базой данных
export async function testDbConnection(config: DbConfig): Promise<{ success: boolean; message: string }> {
  // Используем имитацию в среде предпросмотра
  if (isPreviewEnvironment) {
    return testDbConnectionMock(config)
  }

  let testPool: any = null

  try {
    // Импортируем pg только на сервере и не в среде предпросмотра
    const { Pool } = await import("pg")

    // Создаем временный пул соединений для тестирования
    testPool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    })

    // Проверяем соединение
    const client = await testPool.connect()
    client.release()

    return {
      success: true,
      message: "Соединение с базой данных успешно",
    }
  } catch (error) {
    console.error("Ошибка проверки соединения:", error)

    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка проверки соединения",
    }
  } finally {
    // Закрываем тестовый пул
    if (testPool) {
      await testPool.end()
    }
  }
}

// Функция для проверки, подключена ли база данных
export function isDbConnected(): boolean {
  // Используем имитацию в среде предпросмотра
  if (isPreviewEnvironment) {
    return isDbConnectedMock()
  }

  return !!pool
}

// Функция для получения файловой системы из базы данных
export async function getFileSystemFromDb(): Promise<{ folders: FolderType[]; files: FileType[] } | null> {
  // Используем имитацию в среде предпросмотра
  if (isPreviewEnvironment) {
    return getFileSystemFromDbMock()
  }

  if (!pool) return null

  const client = await pool.connect()

  try {
    // Получаем папки
    const foldersResult = await client.query(
      'SELECT id, name, is_open as "isOpen", parent_id as "parentId" FROM folders',
    )
    const folders: FolderType[] = foldersResult.rows

    // Получаем файлы
    const filesResult = await client.query('SELECT id, name, content, parent_id as "parentId" FROM files')
    const files: FileType[] = filesResult.rows

    return { folders, files }
  } catch (error) {
    console.error("Ошибка получения данных из базы данных:", error)
    return null
  } finally {
    client.release()
  }
}

// Функция для синхронизации локальных данных с базой данных
export async function syncLocalDataWithDb(fileSystem: {
  folders: FolderType[]
  files: FileType[]
}): Promise<{ success: boolean; message: string }> {
  // Используем имитацию в среде предпросмотра
  if (isPreviewEnvironment) {
    return syncLocalDataWithDbMock(fileSystem)
  }

  if (!pool) {
    return { success: false, message: "База данных не подключена" }
  }

  const client = await pool.connect()

  try {
    // Начинаем транзакцию
    await client.query("BEGIN")

    // Очищаем таблицы
    await client.query("DELETE FROM folders")
    await client.query("DELETE FROM files")

    // Вставляем папки
    for (const folder of fileSystem.folders) {
      await client.query("INSERT INTO folders (id, name, is_open, parent_id) VALUES ($1, $2, $3, $4)", [
        folder.id,
        folder.name,
        folder.isOpen,
        folder.parentId,
      ])
    }

    // Вставляем файлы
    for (const file of fileSystem.files) {
      await client.query("INSERT INTO files (id, name, content, parent_id) VALUES ($1, $2, $3, $4)", [
        file.id,
        file.name,
        file.content,
        file.parentId,
      ])
    }

    // Завершаем транзакцию
    await client.query("COMMIT")

    return { success: true, message: "Данные успешно синхронизированы с базой данных" }
  } catch (error) {
    // Откатываем транзакцию в случае ошибки
    await client.query("ROLLBACK")

    console.error("Ошибка синхронизации данных с базой данных:", error)

    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка синхронизации данных",
    }
  } finally {
    client.release()
  }
}

// Функция для инициализации таблиц
async function initTables() {
  if (!pool) return

  const client = await pool.connect()

  try {
    // Начинаем транзакцию
    await client.query("BEGIN")

    // Создаем таблицу для папок
    await client.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        is_open BOOLEAN NOT NULL DEFAULT false,
        parent_id TEXT
      )
    `)

    // Создаем таблицу для файлов
    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT,
        parent_id TEXT
      )
    `)

    // Завершаем транзакцию
    await client.query("COMMIT")
  } catch (error) {
    // Откатываем транзакцию в случае ошибки
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

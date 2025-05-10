import { Pool } from "pg"

// Флаг для отслеживания состояния подключения к базе данных
let isDbConnected = false

// Используем переменную окружения для подключения к базе данных
const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:ghz!zgw6qkt1cqb6AWP@91.203.233.176:5432/postgres"

// Создаем пул соединений с таймаутом
let pool: Pool | null = null

try {
  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000, // 5 секунд таймаут на подключение
    query_timeout: 10000, // 10 секунд таймаут на запрос
    max: 10, // максимальное количество клиентов в пуле
    idleTimeoutMillis: 30000, // время простоя клиента перед закрытием
  })

  // Проверяем подключение при инициализации
  pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err)
    isDbConnected = false
  })

  // Проверяем подключение
  pool
    .query("SELECT 1")
    .then(() => {
      console.log("Database connection successful")
      isDbConnected = true
    })
    .catch((err) => {
      console.error("Failed to connect to database:", err)
      isDbConnected = false
    })
} catch (error) {
  console.error("Error initializing database pool:", error)
  isDbConnected = false
  pool = null
}

// Функция для выполнения SQL-запросов с улучшенной обработкой ошибок
export async function query(text: string, params?: any[]) {
  if (!pool) {
    console.error("Database pool not initialized")
    throw new Error("Database pool not initialized")
  }

  let client
  try {
    // Добавляем таймаут для получения клиента
    const clientPromise = pool.connect()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout connecting to database")), 3000),
    )

    client = await Promise.race([clientPromise, timeoutPromise]).catch((err) => {
      console.error("Ошибка подключения к базе данных:", err)
      isDbConnected = false
      throw new Error(`Ошибка подключения к базе данных: ${err instanceof Error ? err.message : String(err)}`)
    })
  } catch (err) {
    console.error("Ошибка подключения к базе данных:", err)
    isDbConnected = false
    throw new Error(`Ошибка подключения к базе данных: ${err instanceof Error ? err.message : String(err)}`)
  }

  try {
    const start = Date.now()
    // Добавляем таймаут для выполнения запроса
    const queryPromise = client.query(text, params)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Query execution timeout")), 5000),
    )

    const res = await Promise.race([queryPromise, timeoutPromise]).catch((err) => {
      console.error("Ошибка выполнения запроса:", err)
      throw err
    })

    const duration = Date.now() - start
    console.log("Выполнен запрос", { text, duration, rows: res.rowCount })
    isDbConnected = true
    return res
  } catch (error) {
    console.error("Ошибка в запросе", { text, error })
    throw error
  } finally {
    client.release()
  }
}

// Функция для проверки соединения с базой данных
export async function testConnection() {
  try {
    if (!pool) {
      return { success: false, error: "Database pool not initialized" }
    }

    const result = await query("SELECT NOW()")
    isDbConnected = true
    return { success: true, timestamp: result.rows[0].now }
  } catch (error) {
    console.error("Ошибка подключения к базе данных:", error)
    isDbConnected = false
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Функция для проверки статуса подключения
export function isDatabaseConnected() {
  return isDbConnected
}

// Функция для повторной инициализации пула соединений
export function reinitializePool() {
  try {
    if (pool) {
      // Закрываем существующий пул
      pool.end().catch((err) => {
        console.error("Error closing pool:", err)
      })
    }

    // Создаем новый пул
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
      query_timeout: 10000,
      max: 10,
      idleTimeoutMillis: 30000,
    })

    // Проверяем подключение
    return pool
      .query("SELECT 1")
      .then(() => {
        console.log("Database connection reinitialized successfully")
        isDbConnected = true
        return { success: true }
      })
      .catch((err) => {
        console.error("Failed to reinitialize database connection:", err)
        isDbConnected = false
        return { success: false, error: err.message }
      })
  } catch (error) {
    console.error("Error reinitializing database pool:", error)
    isDbConnected = false
    pool = null
    return Promise.resolve({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

// Используем объект для хранения соединения в рамках запроса
let connectionPool: mysql.Pool | null = null

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { host, port, user, password, database } = body

    // Валидация обязательных полей
    if (!host || !port || !user || !password || !database) {
      return NextResponse.json({ error: "Отсутствуют обязательные параметры подключения" }, { status: 400 })
    }

    // Закрываем существующее соединение, если оно есть
    if (connectionPool) {
      await connectionPool.end()
      connectionPool = null
    }

    // Создаем пул соединений вместо одного соединения
    connectionPool = mysql.createPool({
      host,
      port: Number.parseInt(port),
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })

    // Проверяем соединение
    const connection = await connectionPool.getConnection()
    await connection.ping()
    connection.release()

    // Создаем таблицу pingvim, если она не существует
    await createPingvimTable(connectionPool)

    // Сохраняем информацию о соединении в глобальном объекте
    global.dbConfig = { host, port, user, password, database }
    global.dbConnected = true

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ошибка подключения к базе данных:", error)
    global.dbConnected = false
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось подключиться к базе данных" },
      { status: 500 },
    )
  }
}

async function createPingvimTable(pool: mysql.Pool) {
  const connection = await pool.getConnection()
  try {
    // Создаем таблицу pingvim для хранения данных
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pingvim (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        data LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Проверяем, есть ли запись с id='default'
    const [rows] = await connection.execute("SELECT id FROM pingvim WHERE id = ?", ["default"])
    const rowsArray = rows as any[]

    // Если записи нет, создаем ее с пустыми данными
    if (rowsArray.length === 0) {
      const emptyData = JSON.stringify({
        folders: [],
        files: [],
      })
      await connection.execute("INSERT INTO pingvim (id, name, data) VALUES (?, ?, ?)", [
        "default",
        "Default Data",
        emptyData,
      ])
    }
  } finally {
    connection.release()
  }
}

// Экспортируем функцию для получения пула соединений
export function getConnectionPool() {
  return connectionPool
}

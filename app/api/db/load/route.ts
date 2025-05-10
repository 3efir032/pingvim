import { NextResponse } from "next/server"
import { getConnectionPool } from "../connect/route"

export async function GET() {
  try {
    const connectionPool = getConnectionPool()

    if (!connectionPool || !global.dbConnected) {
      return NextResponse.json({ error: "Нет подключения к базе данных" }, { status: 400 })
    }

    const connection = await connectionPool.getConnection()
    try {
      // Получаем данные из таблицы pingvim
      const [rows] = await connection.execute("SELECT data FROM pingvim WHERE id = ?", ["default"])
      const rowsArray = rows as any[]

      if (rowsArray.length === 0) {
        return NextResponse.json({
          fileSystem: {
            folders: [],
            files: [],
          },
        })
      }

      // Парсим JSON из поля data
      const fileSystem = JSON.parse(rowsArray[0].data)

      return NextResponse.json({ fileSystem })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Ошибка загрузки из базы данных:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось загрузить данные из базы данных" },
      { status: 500 },
    )
  }
}

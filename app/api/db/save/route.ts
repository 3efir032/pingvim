import { NextResponse } from "next/server"
import { getConnectionPool } from "../connect/route"

export async function POST(request: Request) {
  try {
    const connectionPool = getConnectionPool()

    if (!connectionPool || !global.dbConnected) {
      return NextResponse.json({ error: "Нет подключения к базе данных" }, { status: 400 })
    }

    const body = await request.json()
    const fileSystemData = JSON.stringify(body)

    const connection = await connectionPool.getConnection()
    try {
      // Обновляем данные в таблице pingvim
      await connection.execute("UPDATE pingvim SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
        fileSystemData,
        "default",
      ])

      return NextResponse.json({ success: true })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Ошибка сохранения в базу данных:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось сохранить данные в базу данных" },
      { status: 500 },
    )
  }
}

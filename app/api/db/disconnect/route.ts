import { NextResponse } from "next/server"
import { getConnectionPool } from "../connect/route"

export async function POST() {
  try {
    const connectionPool = getConnectionPool()

    // Закрываем соединение, если оно существует
    if (connectionPool) {
      await connectionPool.end()
      global.dbConnected = false
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ошибка отключения от базы данных:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось отключиться от базы данных" },
      { status: 500 },
    )
  }
}

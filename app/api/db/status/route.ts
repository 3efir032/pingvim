import { NextResponse } from "next/server"
import { getConnectionPool } from "../connect/route"

export async function GET() {
  try {
    const connectionPool = getConnectionPool()

    if (!connectionPool || !global.dbConnected) {
      return NextResponse.json({ status: "disconnected" })
    }

    // Проверяем соединение
    const connection = await connectionPool.getConnection()
    await connection.ping()
    connection.release()

    return NextResponse.json({ status: "connected" })
  } catch (error) {
    console.error("Ошибка проверки статуса базы данных:", error)
    global.dbConnected = false
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Не удалось проверить статус базы данных",
    })
  }
}

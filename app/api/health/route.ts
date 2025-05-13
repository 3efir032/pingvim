import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { initializeDatabase } from "@/lib/db-init"

export async function GET() {
  try {
    // Инициализируем базу данных (создаем таблицы, если их нет)
    const initResult = await initializeDatabase()

    if (!initResult.success) {
      return NextResponse.json(
        {
          status: "error",
          database: "initialization_failed",
          error: initResult.error instanceof Error ? initResult.error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    // Проверяем подключение к базе данных
    await query("SELECT 1")

    return NextResponse.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database health check failed:", error)

    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

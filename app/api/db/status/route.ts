import { NextResponse } from "next/server"
import { isDbConnected } from "@/lib/db-server"

export async function GET() {
  try {
    // Проверяем, подключена ли база данных
    const connected = isDbConnected()

    return NextResponse.json({ connected })
  } catch (error) {
    console.error("Ошибка в API-маршруте status:", error)
    return NextResponse.json({ connected: false })
  }
}

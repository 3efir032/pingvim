import { NextResponse } from "next/server"
import { disconnectFromDb } from "@/lib/db-server"

export async function POST() {
  try {
    const result = await disconnectFromDb()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Ошибка в API-маршруте disconnect:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Неизвестная ошибка в API-маршруте disconnect",
      },
      { status: 500 },
    )
  }
}

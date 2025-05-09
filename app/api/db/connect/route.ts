import { NextResponse } from "next/server"
import { connectToDb } from "@/lib/db-server"
import type { DbConfig } from "@/lib/db-types"

export async function POST(request: Request) {
  try {
    const config: DbConfig = await request.json()
    const result = await connectToDb(config)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Ошибка в API-маршруте connect:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Неизвестная ошибка в API-маршруте connect",
      },
      { status: 500 },
    )
  }
}

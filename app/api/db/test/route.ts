import { NextResponse } from "next/server"
import { testDbConnection } from "@/lib/db-server"
import type { DbConfig } from "@/lib/db-types"

export async function POST(request: Request) {
  try {
    const config: DbConfig = await request.json()
    const result = await testDbConnection(config)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Ошибка в API-маршруте test:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Неизвестная ошибка в API-маршруте test",
      },
      { status: 500 },
    )
  }
}

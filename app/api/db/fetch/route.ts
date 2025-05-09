import { NextResponse } from "next/server"
import { getFileSystemFromDb } from "@/lib/db-server"

export async function GET() {
  try {
    const fileSystem = await getFileSystemFromDb()

    if (!fileSystem) {
      return NextResponse.json(
        {
          success: false,
          message: "База данных не подключена",
          data: null,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Данные успешно получены",
      data: fileSystem,
    })
  } catch (error) {
    console.error("Ошибка в API-маршруте fetch:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Неизвестная ошибка в API-маршруте fetch",
        data: null,
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { syncLocalDataWithDb, isDbConnected } from "@/lib/db-server"
import type { FileType, FolderType } from "@/types/file-system"

export async function POST(request: Request) {
  try {
    if (!isDbConnected()) {
      return NextResponse.json(
        {
          success: false,
          message: "База данных не подключена",
        },
        { status: 400 },
      )
    }

    const { folders, files } = (await request.json()) as {
      folders: FolderType[]
      files: FileType[]
    }

    const result = await syncLocalDataWithDb({ folders, files })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Ошибка в API-маршруте sync:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Неизвестная ошибка в API-маршруте sync",
      },
      { status: 500 },
    )
  }
}

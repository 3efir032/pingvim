import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Получение всех файлов
export async function GET() {
  try {
    const result = await query("SELECT * FROM files ORDER BY name")
    return NextResponse.json({ success: true, files: result.rows })
  } catch (error) {
    console.error("Ошибка при получении файлов:", error)
    return NextResponse.json({ success: false, error: "Не удалось получить файлы" }, { status: 500 })
  }
}

// Создание нового файла
export async function POST(request: NextRequest) {
  try {
    const { name, content, parentId } = await request.json()

    if (!name || !parentId) {
      return NextResponse.json({ success: false, error: "Имя файла и родительская папка обязательны" }, { status: 400 })
    }

    const result = await query("INSERT INTO files (name, content, parent_id) VALUES ($1, $2, $3) RETURNING *", [
      name,
      content || "",
      parentId,
    ])

    return NextResponse.json({ success: true, file: result.rows[0] })
  } catch (error) {
    console.error("Ошибка при создании файла:", error)
    return NextResponse.json({ success: false, error: "Не удалось создать файл" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Получение всех папок
export async function GET() {
  try {
    const result = await query("SELECT * FROM folders ORDER BY name")
    return NextResponse.json({ success: true, folders: result.rows })
  } catch (error) {
    console.error("Ошибка при получении папок:", error)
    return NextResponse.json({ success: false, error: "Не удалось получить папки" }, { status: 500 })
  }
}

// Создание новой папки
export async function POST(request: NextRequest) {
  try {
    const { name, parentId } = await request.json()

    if (!name) {
      return NextResponse.json({ success: false, error: "Имя папки обязательно" }, { status: 400 })
    }

    const result = await query("INSERT INTO folders (name, parent_id, is_open) VALUES ($1, $2, $3) RETURNING *", [
      name,
      parentId || null,
      false,
    ])

    return NextResponse.json({ success: true, folder: result.rows[0] })
  } catch (error) {
    console.error("Ошибка при создании папки:", error)
    return NextResponse.json({ success: false, error: "Не удалось создать папку" }, { status: 500 })
  }
}

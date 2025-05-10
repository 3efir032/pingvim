import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Получение файла по ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const result = await query("SELECT * FROM files WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Файл не найден" }, { status: 404 })
    }

    return NextResponse.json({ success: true, file: result.rows[0] })
  } catch (error) {
    console.error("Ошибка при получении файла:", error)
    return NextResponse.json({ success: false, error: "Не удалось получить файл" }, { status: 500 })
  }
}

// Обновление файла
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { name, content } = await request.json()

    const result = await query(
      "UPDATE files SET name = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
      [name, content, id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Файл не найден" }, { status: 404 })
    }

    return NextResponse.json({ success: true, file: result.rows[0] })
  } catch (error) {
    console.error("Ошибка при обновлении файла:", error)
    return NextResponse.json({ success: false, error: "Не удалось обновить файл" }, { status: 500 })
  }
}

// Удаление файла
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const result = await query("DELETE FROM files WHERE id = $1 RETURNING id", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Файл не найден" }, { status: 404 })
    }

    return NextResponse.json({ success: true, id: result.rows[0].id })
  } catch (error) {
    console.error("Ошибка при удалении файла:", error)
    return NextResponse.json({ success: false, error: "Не удалось удалить файл" }, { status: 500 })
  }
}

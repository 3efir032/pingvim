import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Получение папки по ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const result = await query("SELECT * FROM folders WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Папка не найдена" }, { status: 404 })
    }

    return NextResponse.json({ success: true, folder: result.rows[0] })
  } catch (error) {
    console.error("Ошибка при получении папки:", error)
    return NextResponse.json({ success: false, error: "Не удалось получить папку" }, { status: 500 })
  }
}

// Обновление папки
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { name, isOpen } = await request.json()

    const updateFields = []
    const updateValues = []

    if (name !== undefined) {
      updateFields.push("name = $" + (updateValues.length + 1))
      updateValues.push(name)
    }

    if (isOpen !== undefined) {
      updateFields.push("is_open = $" + (updateValues.length + 1))
      updateValues.push(isOpen)
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ success: false, error: "Нет данных для обновления" }, { status: 400 })
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP")
    updateValues.push(id)

    const result = await query(
      `UPDATE folders SET ${updateFields.join(", ")} WHERE id = $${updateValues.length} RETURNING *`,
      updateValues,
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Папка не найдена" }, { status: 404 })
    }

    return NextResponse.json({ success: true, folder: result.rows[0] })
  } catch (error) {
    console.error("Ошибка при обновлении папки:", error)
    return NextResponse.json({ success: false, error: "Не удалось обновить папку" }, { status: 500 })
  }
}

// Удаление папки
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Проверяем, не является ли папка корневой
    const rootCheck = await query("SELECT * FROM folders WHERE id = $1 AND parent_id IS NULL", [id])
    if (rootCheck.rows.length > 0) {
      return NextResponse.json({ success: false, error: "Нельзя удалить корневую папку" }, { status: 400 })
    }

    const result = await query("DELETE FROM folders WHERE id = $1 RETURNING id", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Папка не найдена" }, { status: 404 })
    }

    return NextResponse.json({ success: true, id: result.rows[0].id })
  } catch (error) {
    console.error("Ошибка при удалении папки:", error)
    return NextResponse.json({ success: false, error: "Не удалось удалить папку" }, { status: 500 })
  }
}

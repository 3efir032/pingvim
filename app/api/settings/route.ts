import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Получение всех настроек
export async function GET() {
  try {
    const result = await query("SELECT setting_key, setting_value FROM user_settings")

    // Преобразуем результат в объект
    const settings: Record<string, any> = {}
    result.rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error("Ошибка при получении настроек:", error)
    return NextResponse.json({ success: false, error: "Не удалось получить настройки" }, { status: 500 })
  }
}

// Сохранение настроек
export async function POST(request: NextRequest) {
  try {
    const { key, value } = await request.json()

    if (!key) {
      return NextResponse.json({ success: false, error: "Ключ настройки обязателен" }, { status: 400 })
    }

    // Проверяем, существует ли настройка
    const checkResult = await query("SELECT * FROM user_settings WHERE setting_key = $1", [key])

    if (checkResult.rows.length > 0) {
      // Обновляем существующую настройку
      await query(
        "UPDATE user_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $2",
        [value, key],
      )
    } else {
      // Создаем новую настройку
      await query("INSERT INTO user_settings (setting_key, setting_value) VALUES ($1, $2)", [key, value])
    }

    return NextResponse.json({ success: true, key, value })
  } catch (error) {
    console.error("Ошибка при сохранении настроек:", error)
    return NextResponse.json({ success: false, error: "Не удалось сохранить настройки" }, { status: 500 })
  }
}

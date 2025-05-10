import { NextResponse } from "next/server"
import { initDatabase, ensureRootFolder } from "@/lib/db-init"
import { testConnection, reinitializePool } from "@/lib/db"

export async function GET() {
  try {
    console.log("Начало инициализации базы данных")

    // Пробуем переинициализировать пул соединений
    console.log("Переинициализация пула соединений...")
    const reinitResult = await reinitializePool()

    if (!reinitResult.success) {
      console.error("Ошибка при переинициализации пула соединений:", reinitResult.error)
      return NextResponse.json(
        {
          success: false,
          error: `Не удалось переинициализировать пул соединений: ${reinitResult.error}`,
        },
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    // Проверяем соединение с базой данных
    console.log("Проверка соединения с базой данных...")
    const connectionTest = await testConnection()

    if (!connectionTest.success) {
      console.error("Ошибка подключения к базе данных:", connectionTest.error)
      return NextResponse.json(
        { success: false, error: `Не удалось подключиться к базе данных: ${connectionTest.error}` },
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    console.log("Подключение к базе данных успешно")

    // Инициализируем базу данных
    console.log("Инициализация структуры базы данных...")
    const initResult = await initDatabase()

    if (!initResult.success) {
      console.error("Ошибка при инициализации базы данных:", initResult.error)
      return NextResponse.json(
        { success: false, error: `Ошибка при инициализации базы данных: ${initResult.error}` },
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    console.log("Структура базы данных инициализирована успешно")

    // Проверяем и создаем корневую папку
    console.log("Проверка наличия корневой папки...")
    const rootFolderResult = await ensureRootFolder()

    if (!rootFolderResult.success) {
      console.error("Ошибка при создании корневой папки:", rootFolderResult.error)
      return NextResponse.json(
        { success: false, error: `Ошибка при создании корневой папки: ${rootFolderResult.error}` },
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    console.log("Корневая папка проверена/создана успешно")

    return NextResponse.json(
      {
        success: true,
        message: "База данных инициализирована успешно",
        timestamp: connectionTest.timestamp,
      },
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Необработанная ошибка при инициализации базы данных:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Внутренняя ошибка сервера",
      },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}

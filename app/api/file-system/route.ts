import { NextResponse } from "next/server"
import { query, isDatabaseConnected, reinitializePool } from "@/lib/db"

// Улучшаем обработку ошибок в API-маршруте
export async function GET() {
  try {
    console.log("Запрос на получение файловой системы")

    // Проверяем, подключена ли база данных
    if (!isDatabaseConnected()) {
      console.log("База данных не подключена, пробуем переподключиться")

      // Пробуем переподключиться
      const reinitResult = await reinitializePool()

      if (!reinitResult.success) {
        console.log("Переподключение не удалось, возвращаем ошибку")
        return NextResponse.json(
          {
            success: false,
            error: "База данных не подключена: " + (reinitResult.error || "неизвестная ошибка"),
            useLocalStorage: true, // Указываем клиенту использовать локальное хранилище
          },
          { status: 503, headers: { "Content-Type": "application/json" } },
        )
      }
    }

    // Проверяем подключение к базе данных с таймаутом
    try {
      console.log("Проверка подключения к базе данных...")

      // Создаем промис с таймаутом
      const queryPromise = query("SELECT 1")
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout checking database connection")), 3000),
      )

      await Promise.race([queryPromise, timeoutPromise])
      console.log("Подключение к базе данных успешно")
    } catch (error) {
      console.error("Ошибка подключения к базе данных:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Ошибка подключения к базе данных: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
          useLocalStorage: true, // Указываем клиенту использовать локальное хранилище
        },
        { status: 503, headers: { "Content-Type": "application/json" } },
      )
    }

    // Получаем все папки с обработкой ошибок и таймаутом
    console.log("Получение списка папок...")
    let foldersResult
    try {
      const foldersPromise = query(`
        SELECT 
          id, 
          name, 
          is_open as "isOpen", 
          parent_id as "parentId", 
          created_at as "createdAt", 
          updated_at as "updatedAt"
        FROM folders 
        ORDER BY name
      `)

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout fetching folders")), 5000),
      )

      foldersResult = await Promise.race([foldersPromise, timeoutPromise])
      console.log(`Получено ${foldersResult.rowCount} папок`)
    } catch (error) {
      console.error("Ошибка при получении папок:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Ошибка при получении папок: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
          useLocalStorage: true, // Указываем клиенту использовать локальное хранилище
        },
        { status: 503, headers: { "Content-Type": "application/json" } },
      )
    }

    // Получаем все файлы с обработкой ошибок и таймаутом
    console.log("Получение списка файлов...")
    let filesResult
    try {
      const filesPromise = query(`
        SELECT 
          id, 
          name, 
          content, 
          parent_id as "parentId", 
          created_at as "createdAt", 
          updated_at as "updatedAt"
        FROM files 
        ORDER BY name
      `)

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout fetching files")), 5000),
      )

      filesResult = await Promise.race([filesPromise, timeoutPromise])
      console.log(`Получено ${filesResult.rowCount} файлов`)
    } catch (error) {
      console.error("Ошибка при получении файлов:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Ошибка при получении файлов: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
          useLocalStorage: true, // Указываем клиенту использовать локальное хранилище
        },
        { status: 503, headers: { "Content-Type": "application/json" } },
      )
    }

    return NextResponse.json(
      {
        success: true,
        fileSystem: {
          folders: foldersResult.rows,
          files: filesResult.rows,
        },
      },
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Ошибка при получении файловой системы:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
        useLocalStorage: true, // Указываем клиенту использовать локальное хранилище
      },
      { status: 503, headers: { "Content-Type": "application/json" } },
    )
  }
}

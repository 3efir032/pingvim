import { query } from "./db"

// Функция для создания необходимых таблиц
export async function initDatabase() {
  try {
    // Создаем таблицу для папок
    await query(`
      CREATE TABLE IF NOT EXISTS folders (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        is_open BOOLEAN DEFAULT false,
        parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch((error) => {
      console.error("Ошибка при создании таблицы folders:", error)
      throw new Error(`Ошибка при создании таблицы folders: ${error.message}`)
    })

    // Создаем таблицу для файлов
    await query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        content TEXT,
        parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch((error) => {
      console.error("Ошибка при создании таблицы files:", error)
      throw new Error(`Ошибка при создании таблицы files: ${error.message}`)
    })

    // Создаем таблицу для настроек пользователя
    await query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(255) UNIQUE NOT NULL,
        setting_value JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch((error) => {
      console.error("Ошибка при создании таблицы user_settings:", error)
      throw new Error(`Ошибка при создании таблицы user_settings: ${error.message}`)
    })

    console.log("База данных инициализирована успешно")
    return { success: true }
  } catch (error) {
    console.error("Ошибка при инициализации базы данных:", error)
    return { success: false, error: error instanceof Error ? error.message : "Неизвестная ошибка" }
  }
}

// Функция для проверки и создания корневой папки, если она не существует
export async function ensureRootFolder() {
  try {
    // Проверяем, существует ли корневая папка
    const rootFolder = await query("SELECT * FROM folders WHERE parent_id IS NULL LIMIT 1").catch((error) => {
      console.error("Ошибка при проверке корневой папки:", error)
      throw new Error(`Ошибка при проверке корневой папки: ${error.message}`)
    })

    if (rootFolder.rows.length === 0) {
      // Создаем корневую папку, если она не существует
      await query("INSERT INTO folders (name, is_open) VALUES ($1, $2)", ["Notes", true]).catch((error) => {
        console.error("Ошибка при создании корневой папки:", error)
        throw new Error(`Ошибка при создании корневой папки: ${error.message}`)
      })
      console.log("Корневая папка создана")
    }

    return { success: true }
  } catch (error) {
    console.error("Ошибка при проверке корневой папки:", error)
    return { success: false, error: error instanceof Error ? error.message : "Неизвестная ошибка" }
  }
}

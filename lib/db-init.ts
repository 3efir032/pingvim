import { query } from "./db"

export async function initializeDatabase() {
  try {
    console.log("Checking database tables...")

    // Проверяем существование таблицы pingvim
    const pingvimTableExists = await checkTableExists("pingvim")
    if (!pingvimTableExists) {
      console.log("Creating pingvim table...")
      await createPingvimTable()
    }

    // Проверяем существование таблицы files
    const filesTableExists = await checkTableExists("files")
    if (!filesTableExists) {
      console.log("Creating files table...")
      await createFilesTable()
    }

    // Проверяем наличие корневой папки
    await ensureRootFolder()

    console.log("Database initialization completed successfully")
    return { success: true }
  } catch (error) {
    console.error("Database initialization failed:", error)
    return { success: false, error }
  }
}

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const dbName = process.env.DB_NAME || "steam_db"
    const result = await query(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = ? AND table_name = ?`,
      [dbName, tableName],
    )

    // @ts-ignore
    return result[0].count > 0
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

async function createPingvimTable() {
  await query(`
    CREATE TABLE pingvim (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      is_open TINYINT(1) DEFAULT 0,
      parent_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  // Добавляем внешний ключ после создания таблицы
  await query(`
    ALTER TABLE pingvim 
    ADD CONSTRAINT pingvim_self_fk 
    FOREIGN KEY (parent_id) REFERENCES pingvim(id) 
    ON DELETE CASCADE
  `).catch((err) => {
    // Игнорируем ошибку, если ограничение уже существует
    console.log("Note: Foreign key constraint may already exist or couldn't be added:", err.message)
  })
}

async function createFilesTable() {
  await query(`
    CREATE TABLE files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      content LONGTEXT,
      parent_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  // Добавляем внешний ключ после создания таблицы
  await query(`
    ALTER TABLE files 
    ADD CONSTRAINT files_pingvim_fk 
    FOREIGN KEY (parent_id) REFERENCES pingvim(id) 
    ON DELETE CASCADE
  `).catch((err) => {
    // Игнорируем ошибку, если ограничение уже существует
    console.log("Note: Foreign key constraint may already exist or couldn't be added:", err.message)
  })
}

async function ensureRootFolder() {
  try {
    // Проверяем, существует ли корневая папка
    const rootFolder = await query("SELECT * FROM pingvim WHERE id = 1")

    // @ts-ignore
    if (rootFolder.length === 0) {
      console.log("Creating root folder 'Notes'...")
      await query("INSERT INTO pingvim (id, name, is_open, parent_id) VALUES (1, 'Notes', 1, NULL)")
    }
  } catch (error) {
    console.error("Error ensuring root folder exists:", error)
    throw error
  }
}

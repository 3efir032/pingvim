import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import type { FileType, FolderType } from "@/types/file-system"

// Database connection configuration
let pool: mysql.Pool | null = null

// Initialize the connection pool
function getPool(config: {
  host: string
  port: number
  user: string
  password: string
  database: string
}) {
  if (!pool) {
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  }
  return pool
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case "testConnection":
        return handleTestConnection(data)
      case "getFolders":
        return handleGetFolders(data)
      case "getFiles":
        return handleGetFiles(data)
      case "saveFolder":
        return handleSaveFolder(data)
      case "saveFile":
        return handleSaveFile(data)
      case "deleteFolder":
        return handleDeleteFolder(data)
      case "deleteFile":
        return handleDeleteFile(data)
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Database API error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

async function handleTestConnection(config: any) {
  try {
    const tempPool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    })

    const connection = await tempPool.getConnection()
    connection.release()
    await tempPool.end()

    return NextResponse.json({ success: true, message: "Connection successful!" })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}

async function handleGetFolders(config: any) {
  try {
    const pool = getPool(config)
    const [rows] = await pool.query<mysql.RowDataPacket[]>("SELECT id, name, is_open, parent_id FROM pingvim")

    const folders = rows.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      isOpen: !!row.is_open,
      parentId: row.parent_id ? row.parent_id.toString() : null,
    }))

    return NextResponse.json({ success: true, folders })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}

async function handleGetFiles(config: any) {
  try {
    const pool = getPool(config)
    const [rows] = await pool.query<mysql.RowDataPacket[]>("SELECT id, name, content, parent_id FROM files")

    const files = rows.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      content: row.content || "",
      parentId: row.parent_id ? row.parent_id.toString() : null,
    }))

    return NextResponse.json({ success: true, files })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}

async function handleSaveFolder(data: { config: any; folder: FolderType }) {
  try {
    const pool = getPool(data.config)
    const folder = data.folder

    if (folder.id && !folder.id.startsWith("temp_")) {
      // Update existing folder
      await pool.query(
        "UPDATE pingvim SET name = ?, is_open = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [folder.name, folder.isOpen ? 1 : 0, folder.parentId, folder.id],
      )
      return NextResponse.json({ success: true, id: folder.id })
    } else {
      // Create new folder
      const [result] = await pool.query<mysql.ResultSetHeader>(
        "INSERT INTO pingvim (name, is_open, parent_id, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        [folder.name, folder.isOpen ? 1 : 0, folder.parentId],
      )
      return NextResponse.json({ success: true, id: result.insertId.toString() })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}

async function handleSaveFile(data: { config: any; file: FileType }) {
  try {
    const pool = getPool(data.config)
    const file = data.file

    if (file.id && !file.id.startsWith("temp_")) {
      // Update existing file
      await pool.query("UPDATE files SET name = ?, content = ?, parent_id = ? WHERE id = ?", [
        file.name,
        file.content,
        file.parentId,
        file.id,
      ])
      return NextResponse.json({ success: true, id: file.id })
    } else {
      // Create new file
      const [result] = await pool.query<mysql.ResultSetHeader>(
        "INSERT INTO files (name, content, parent_id) VALUES (?, ?, ?)",
        [file.name, file.content, file.parentId],
      )
      return NextResponse.json({ success: true, id: result.insertId.toString() })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}

async function handleDeleteFolder(data: { config: any; id: string }) {
  try {
    const pool = getPool(data.config)
    await pool.query("DELETE FROM pingvim WHERE id = ?", [data.id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}

async function handleDeleteFile(data: { config: any; id: string }) {
  try {
    const pool = getPool(data.config)
    await pool.query("DELETE FROM files WHERE id = ?", [data.id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}

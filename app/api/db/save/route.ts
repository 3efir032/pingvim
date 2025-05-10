import { NextResponse } from "next/server"
import type mysql from "mysql2/promise"

// Reference to the global connection
const connection: mysql.Connection | null = null

export async function POST(request: Request) {
  try {
    if (!connection) {
      return NextResponse.json({ error: "Not connected to database" }, { status: 400 })
    }

    const body = await request.json()
    const { folders, files } = body

    // Start a transaction
    await connection.beginTransaction()

    try {
      // Clear existing data
      await connection.execute("DELETE FROM folders")
      await connection.execute("DELETE FROM files")

      // Insert folders
      if (folders && folders.length > 0) {
        for (const folder of folders) {
          await connection.execute("INSERT INTO folders (id, name, isOpen, parentId) VALUES (?, ?, ?, ?)", [
            folder.id,
            folder.name,
            folder.isOpen,
            folder.parentId,
          ])
        }
      }

      // Insert files
      if (files && files.length > 0) {
        for (const file of files) {
          await connection.execute("INSERT INTO files (id, name, content, parentId) VALUES (?, ?, ?, ?)", [
            file.id,
            file.name,
            file.content,
            file.parentId,
          ])
        }
      }

      // Commit the transaction
      await connection.commit()

      return NextResponse.json({ success: true })
    } catch (error) {
      // Rollback on error
      await connection.rollback()
      throw error
    }
  } catch (error) {
    console.error("Database save error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save to database" },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import type mysql from "mysql2/promise"

// Reference to the global connection
const connection: mysql.Connection | null = null

export async function GET() {
  try {
    if (!connection) {
      return NextResponse.json({ error: "Not connected to database" }, { status: 400 })
    }

    // Get folders
    const [foldersResult] = await connection.execute("SELECT * FROM folders")
    const folders = foldersResult as any[]

    // Get files
    const [filesResult] = await connection.execute("SELECT * FROM files")
    const files = filesResult as any[]

    // Convert boolean values from MySQL to JavaScript
    const processedFolders = folders.map((folder) => ({
      ...folder,
      isOpen: Boolean(folder.isOpen),
      parentId: folder.parentId === null ? null : folder.parentId,
    }))

    const processedFiles = files.map((file) => ({
      ...file,
      parentId: file.parentId === null ? null : file.parentId,
    }))

    return NextResponse.json({
      fileSystem: {
        folders: processedFolders,
        files: processedFiles,
      },
    })
  } catch (error) {
    console.error("Database load error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load from database" },
      { status: 500 },
    )
  }
}

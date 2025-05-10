import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

// Store the connection in a global variable to reuse it
let connection: mysql.Connection | null = null

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { host, port, user, password, database } = body

    // Validate required fields
    if (!host || !port || !user || !password || !database) {
      return NextResponse.json({ error: "Missing required connection parameters" }, { status: 400 })
    }

    // Close existing connection if any
    if (connection) {
      await connection.end()
      connection = null
    }

    // Create a new connection
    connection = await mysql.createConnection({
      host,
      port: Number.parseInt(port),
      user,
      password,
      database,
    })

    // Test the connection
    await connection.ping()

    // Create tables if they don't exist
    await createTables(connection)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect to database" },
      { status: 500 },
    )
  }
}

async function createTables(conn: mysql.Connection) {
  // Create folders table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS folders (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      isOpen BOOLEAN NOT NULL DEFAULT FALSE,
      parentId VARCHAR(255)
    )
  `)

  // Create files table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS files (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      content TEXT,
      parentId VARCHAR(255)
    )
  `)
}

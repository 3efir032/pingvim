import { NextResponse } from "next/server"
import type mysql from "mysql2/promise"

// Reference to the global connection
let connection: mysql.Connection | null = null

export async function POST() {
  try {
    // Close the connection if it exists
    if (connection) {
      await connection.end()
      connection = null
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Database disconnection error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to disconnect from database" },
      { status: 500 },
    )
  }
}

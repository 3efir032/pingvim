import { NextResponse } from "next/server"
import type mysql from "mysql2/promise"

// Reference to the global connection
const connection: mysql.Connection | null = null

export async function GET() {
  try {
    if (!connection) {
      return NextResponse.json({ status: "disconnected" })
    }

    // Test the connection
    await connection.ping()
    return NextResponse.json({ status: "connected" })
  } catch (error) {
    console.error("Database status check error:", error)
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Failed to check database status",
    })
  }
}

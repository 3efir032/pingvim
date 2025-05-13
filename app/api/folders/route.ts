import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// Get all folders
export async function GET() {
  try {
    const folders = await query("SELECT * FROM pingvim")
    return NextResponse.json(folders)
  } catch (error) {
    console.error("Error fetching folders:", error)
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 })
  }
}

// Create a new folder
export async function POST(request: Request) {
  try {
    const { name, isOpen, parentId } = await request.json()

    const result = await query("INSERT INTO pingvim (name, is_open, parent_id) VALUES (?, ?, ?)", [
      name,
      isOpen ? 1 : 0,
      parentId || null,
    ])

    // @ts-ignore
    const insertId = result.insertId

    return NextResponse.json(
      {
        id: insertId.toString(),
        name,
        isOpen,
        parentId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating folder:", error)
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 })
  }
}

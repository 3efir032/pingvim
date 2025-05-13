import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// Get all files
export async function GET() {
  try {
    const files = await query("SELECT * FROM files")
    return NextResponse.json(files)
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
  }
}

// Create a new file
export async function POST(request: Request) {
  try {
    const { name, content, parentId } = await request.json()

    const result = await query("INSERT INTO files (name, content, parent_id) VALUES (?, ?, ?)", [
      name,
      content || "",
      parentId,
    ])

    // @ts-ignore
    const insertId = result.insertId

    return NextResponse.json(
      {
        id: insertId.toString(),
        name,
        content,
        parentId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating file:", error)
    return NextResponse.json({ error: "Failed to create file" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// Get a specific file
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const files = await query("SELECT * FROM files WHERE id = ?", [id])

    // @ts-ignore
    if (files.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // @ts-ignore
    return NextResponse.json(files[0])
  } catch (error) {
    console.error("Error fetching file:", error)
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 })
  }
}

// Update a file
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { name, content, parentId } = await request.json()

    await query("UPDATE files SET name = ?, content = ?, parent_id = ? WHERE id = ?", [name, content, parentId, id])

    return NextResponse.json({ id, name, content, parentId })
  } catch (error) {
    console.error("Error updating file:", error)
    return NextResponse.json({ error: "Failed to update file" }, { status: 500 })
  }
}

// Delete a file
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    await query("DELETE FROM files WHERE id = ?", [id])

    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}

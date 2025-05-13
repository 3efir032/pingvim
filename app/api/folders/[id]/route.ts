import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// Get a specific folder
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const folders = await query("SELECT * FROM pingvim WHERE id = ?", [id])

    // @ts-ignore
    if (folders.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // @ts-ignore
    return NextResponse.json(folders[0])
  } catch (error) {
    console.error("Error fetching folder:", error)
    return NextResponse.json({ error: "Failed to fetch folder" }, { status: 500 })
  }
}

// Update a folder
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { name, isOpen, parentId } = await request.json()

    await query("UPDATE pingvim SET name = ?, is_open = ?, parent_id = ? WHERE id = ?", [
      name,
      isOpen ? 1 : 0,
      parentId || null,
      id,
    ])

    return NextResponse.json({ id, name, isOpen, parentId })
  } catch (error) {
    console.error("Error updating folder:", error)
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 })
  }
}

// Delete a folder
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // First delete all files in this folder
    await query("DELETE FROM files WHERE parent_id = ?", [id])

    // Then delete the folder
    await query("DELETE FROM pingvim WHERE id = ?", [id])

    return NextResponse.json({ message: "Folder deleted successfully" })
  } catch (error) {
    console.error("Error deleting folder:", error)
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 })
  }
}

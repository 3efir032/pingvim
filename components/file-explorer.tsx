"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Folder, File, ChevronRight, ChevronDown, MoreVertical, SplitSquareVertical } from "lucide-react"
import type { FileType, FolderType } from "@/types/file-system"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface FileExplorerProps {
  folders: FolderType[]
  files: FileType[]
  onFileClick: (fileId: string) => void
  onCreateFile: (name: string, parentId: string) => void
  onCreateFolder: (name: string, parentId: string) => void
  onDeleteFile: (fileId: string) => void
  onDeleteFolder: (folderId: string) => void
  toggleFolderOpen: (folderId: string) => void
  activeFileId: string | null
  onSplitView: (fileId: string) => void
}

export default function FileExplorer({
  folders,
  files,
  onFileClick,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onDeleteFolder,
  toggleFolderOpen,
  activeFileId,
  onSplitView,
}: FileExplorerProps) {
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false)
  const [newItemName, setNewItemName] = useState("")
  const [newItemType, setNewItemType] = useState<"file" | "folder">("file")
  const [currentParentId, setCurrentParentId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    type: "file" | "folder"
    id: string
  } | null>(null)

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu) {
        setContextMenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [contextMenu])

  const handleNewItem = (type: "file" | "folder", parentId: string) => {
    setNewItemType(type)
    setCurrentParentId(parentId)
    setNewItemName("")
    setNewItemDialogOpen(true)
  }

  const handleCreateItem = () => {
    if (!newItemName.trim() || !currentParentId) return

    if (newItemType === "file") {
      onCreateFile(newItemName, currentParentId)
    } else {
      onCreateFolder(newItemName, currentParentId)
    }

    setNewItemDialogOpen(false)
  }

  const handleContextMenu = (e: React.MouseEvent, type: "file" | "folder", id: string) => {
    e.preventDefault()
    e.stopPropagation()

    // Get the position of the click
    const x = e.clientX
    const y = e.clientY

    // Calculate available space
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Estimate menu dimensions
    const menuWidth = 120 // Approximate width of the menu
    const menuHeight = type === "file" ? 80 : 120 // Approximate height based on menu type

    // Adjust position if menu would go off-screen
    let adjustedX = x
    let adjustedY = y

    // Check horizontal overflow
    if (x + menuWidth > viewportWidth) {
      adjustedX = viewportWidth - menuWidth - 8 // 8px margin
    }

    // Check vertical overflow
    if (y + menuHeight > viewportHeight) {
      adjustedY = viewportHeight - menuHeight - 8 // 8px margin
    }

    setContextMenu({
      x: adjustedX,
      y: adjustedY,
      type,
      id,
    })
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  const renderFolder = (folder: FolderType) => {
    const childFolders = folders.filter((f) => f.parentId === folder.id)
    const childFiles = files.filter((f) => f.parentId === folder.id)

    return (
      <div key={folder.id} className="select-none">
        <div
          className="flex items-center py-1 px-2 hover:bg-[#4b6eaf] cursor-pointer group"
          onClick={() => toggleFolderOpen(folder.id)}
          onContextMenu={(e) => handleContextMenu(e, "folder", folder.id)}
        >
          {folder.isOpen ? (
            <ChevronDown className="h-4 w-4 mr-1 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-1 flex-shrink-0" />
          )}

          <Folder className="h-4 w-4 mr-1 text-yellow-500 flex-shrink-0" />
          <span className="text-sm truncate">{folder.name}</span>

          <div className="ml-auto hidden group-hover:flex">
            <button
              className="p-1 hover:bg-gray-600"
              onClick={(e) => {
                e.stopPropagation()
                handleContextMenu(e, "folder", folder.id)
              }}
            >
              <MoreVertical className="h-3 w-3" />
            </button>
          </div>
        </div>

        {folder.isOpen && (
          <div className="pl-4">
            {childFolders.map(renderFolder)}
            {childFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center py-1 px-2 hover:bg-[#4b6eaf] cursor-pointer group ${
                  activeFileId === file.id ? "bg-[#4b6eaf]" : ""
                }`}
                onClick={() => onFileClick(file.id)}
                onContextMenu={(e) => handleContextMenu(e, "file", file.id)}
              >
                <File className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                <span className="text-sm truncate">{file.name}</span>

                <div className="ml-auto hidden group-hover:flex items-center">
                  <button
                    className="p-1 hover:bg-gray-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSplitView(file.id)
                    }}
                    title="Open in Split View"
                  >
                    <SplitSquareVertical className="h-3 w-3" />
                  </button>
                  <button
                    className="p-1 hover:bg-gray-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleContextMenu(e, "file", file.id)
                    }}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Get root folders (those with parentId === null)
  const rootFolders = folders.filter((folder) => folder.parentId === null)

  return (
    <div className="p-2 relative" onClick={closeContextMenu}>
      {rootFolders.map(renderFolder)}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-[#3c3f41] border border-gray-700 shadow-lg z-50 rounded-none"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          {contextMenu.type === "folder" && (
            <>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-[#4b6eaf] text-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleNewItem("file", contextMenu.id)
                  closeContextMenu()
                }}
              >
                New File
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-[#4b6eaf] text-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleNewItem("folder", contextMenu.id)
                  closeContextMenu()
                }}
              >
                New Folder
              </button>
              <div className="border-t border-gray-700"></div>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-[#4b6eaf] text-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteFolder(contextMenu.id)
                  closeContextMenu()
                }}
              >
                Delete
              </button>
            </>
          )}
          {contextMenu.type === "file" && (
            <>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-[#4b6eaf] text-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onSplitView(contextMenu.id)
                  closeContextMenu()
                }}
              >
                Split Right
              </button>
              <div className="border-t border-gray-700"></div>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-[#4b6eaf] text-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteFile(contextMenu.id)
                  closeContextMenu()
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}

      <Dialog open={newItemDialogOpen} onOpenChange={setNewItemDialogOpen}>
        <DialogContent className="bg-[#3c3f41] border-gray-700 text-gray-300 p-0">
          <DialogHeader className="p-4 border-b border-gray-700">
            <DialogTitle>New {newItemType === "file" ? "File" : "Folder"}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`Enter ${newItemType} name`}
              autoFocus
              className="bg-[#2b2b2b] border-gray-700 text-gray-300"
            />
          </div>
          <DialogFooter className="p-4 border-t border-gray-700 bg-[#3c3f41]">
            <Button
              variant="outline"
              onClick={() => setNewItemDialogOpen(false)}
              className="bg-[#4b4b4b] text-gray-300 border-gray-700 hover:bg-[#5a5a5a]"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateItem} className="bg-[#4b6eaf] text-white hover:bg-[#5a7dbf]">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Folder, File, ChevronRight, ChevronDown, MoreVertical, SplitSquareVertical } from "lucide-react"
import type { FileType, FolderType } from "@/types/file-system"

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
  onRename?: (type: "file" | "folder", id: string) => void
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
  onRename,
}: FileExplorerProps) {
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
    if (type === "file") {
      onCreateFile("New File", parentId)
    } else {
      onCreateFolder("New Folder", parentId)
    }
    closeContextMenu()
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
          className="flex items-center py-1 px-2 hover:bg-[#2E436E] cursor-pointer group"
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
                className={`flex items-center py-1 px-2 hover:bg-[#2E436E] cursor-pointer group ${
                  activeFileId === file.id ? "bg-[#2E436E]" : ""
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
          onClick={(e) => e.stopPropagation()} // Предотвращаем закрытие меню при клике на него
        >
          {contextMenu.type === "folder" && (
            <>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-[#2E436E] text-sm"
                onClick={() => {
                  onCreateFile("New File", contextMenu.id)
                  closeContextMenu()
                }}
              >
                New File
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-[#2E436E] text-sm"
                onClick={() => {
                  onCreateFolder("New Folder", contextMenu.id)
                  closeContextMenu()
                }}
              >
                New Folder
              </button>
              {onRename && (
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-[#2E436E] text-sm"
                  onClick={() => {
                    onRename("folder", contextMenu.id)
                    closeContextMenu()
                  }}
                >
                  Rename
                </button>
              )}
              <div className="border-t border-gray-700"></div>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-[#2E436E] text-sm"
                onClick={() => {
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
                className="block w-full text-left px-4 py-2 hover:bg-[#2E436E] text-sm"
                onClick={() => {
                  onSplitView(contextMenu.id)
                  closeContextMenu()
                }}
              >
                Split Right
              </button>
              {onRename && (
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-[#2E436E] text-sm"
                  onClick={() => {
                    onRename("file", contextMenu.id)
                    closeContextMenu()
                  }}
                >
                  Rename
                </button>
              )}
              <div className="border-t border-gray-700"></div>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-[#2E436E] text-sm"
                onClick={() => {
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
    </div>
  )
}

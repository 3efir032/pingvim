"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, MoreVertical, Settings, Menu, Search, User, SplitSquareVertical, File } from "lucide-react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import FileExplorer from "@/components/file-explorer"
import Editor from "@/components/editor"
import StatusBar from "@/components/status-bar"
import SettingsMenu from "@/components/settings-menu"
import type { FileType, FolderType } from "@/types/file-system"

export default function Home() {
  // Track open files for left pane
  const [leftPaneFiles, setLeftPaneFiles] = useLocalStorage<string[]>("pycharm-left-pane-files", [])
  // Track open files for right pane
  const [rightPaneFiles, setRightPaneFiles] = useLocalStorage<string[]>("pycharm-right-pane-files", [])
  // Track the currently active file in left pane
  const [leftActiveFile, setLeftActiveFile] = useLocalStorage<string | null>("pycharm-left-active-file", null)
  // Track the currently active file in right pane
  const [rightActiveFile, setRightActiveFile] = useLocalStorage<string | null>("pycharm-right-active-file", null)
  // Track if we're in split view mode
  const [splitView, setSplitView] = useLocalStorage<boolean>("pycharm-split-view", false)
  // Track which tab is being dragged
  const [draggedTab, setDraggedTab] = useState<{ pane: "left" | "right"; fileId: string } | null>(null)
  // Track editor settings
  const [fontSize, setFontSize] = useLocalStorage<number>("pycharm-font-size", 14)
  // Track settings menu open state
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Reference to the settings button
  const settingsButtonRef = useRef<HTMLButtonElement>(null)

  // Track search state
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<FileType[]>([])

  const [fileSystem, setFileSystem] = useLocalStorage<{
    folders: FolderType[]
    files: FileType[]
  }>("pycharm-file-system", {
    folders: [
      { id: "1", name: "project", isOpen: true, parentId: null },
      { id: "2", name: "src", isOpen: true, parentId: "1" },
      { id: "3", name: "1", isOpen: true, parentId: "2" },
      { id: "4", name: "123", isOpen: true, parentId: "3" },
    ],
    files: [
      {
        id: "1",
        name: "notes.txt",
        content: "# Welcome to PingVim\n\nStart typing your notes here...",
        parentId: "2",
      },
      {
        id: "2",
        name: "2",
        content: "This is file 2",
        parentId: "2",
      },
      {
        id: "3",
        name: "123",
        content: "123",
        parentId: "4",
      },
      {
        id: "4",
        name: "23",
        content: "23",
        parentId: "4",
      },
    ],
  })

  // Enable split view if there are files in the right pane
  useEffect(() => {
    if (rightPaneFiles.length > 0 && !splitView) {
      setSplitView(true)
    }
  }, [rightPaneFiles, splitView, setSplitView])

  const handleFileClick = (fileId: string) => {
    const file = fileSystem.files.find((f) => f.id === fileId)
    if (!file) return

    // If split view is active, decide which pane to open the file in
    if (splitView) {
      // If the file is already open in either pane, make it active
      if (leftPaneFiles.includes(fileId)) {
        setLeftActiveFile(fileId)
        return
      }
      if (rightPaneFiles.includes(fileId)) {
        setRightActiveFile(fileId)
        return
      }

      // If right pane has no active file, open there
      if (!rightActiveFile) {
        setRightPaneFiles((prev) => [...prev, fileId])
        setRightActiveFile(fileId)
        return
      }

      // Otherwise open in left pane
      setLeftPaneFiles((prev) => [...prev, fileId])
      setLeftActiveFile(fileId)
    } else {
      // Not in split view, just open in left pane
      if (!leftPaneFiles.includes(fileId)) {
        setLeftPaneFiles((prev) => [...prev, fileId])
      }
      setLeftActiveFile(fileId)
    }
  }

  const handleSplitView = (fileId: string) => {
    // Enable split view if not already enabled
    if (!splitView) {
      setSplitView(true)
    }

    // If the file is already open in the right pane, just make it active
    if (rightPaneFiles.includes(fileId)) {
      setRightActiveFile(fileId)
      return
    }

    // If the file is open in the left pane, move it to the right pane
    if (leftPaneFiles.includes(fileId)) {
      // Remove from left pane
      setLeftPaneFiles((prev) => prev.filter((id) => id !== fileId))

      // If this was the active file in left pane, set a new active file
      if (leftActiveFile === fileId) {
        const remainingFiles = leftPaneFiles.filter((id) => id !== fileId)
        setLeftActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null)
      }
    }

    // Add to right pane
    setRightPaneFiles((prev) => [...prev, fileId])
    setRightActiveFile(fileId)
  }

  const handleCloseFile = (pane: "left" | "right", fileId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()

    if (pane === "left") {
      // Remove from left pane files
      setLeftPaneFiles((prev) => prev.filter((id) => id !== fileId))

      // If this was the active file, set a new active file
      if (leftActiveFile === fileId) {
        const remainingFiles = leftPaneFiles.filter((id) => id !== fileId)
        setLeftActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null)
      }
    } else {
      // Remove from right pane files
      setRightPaneFiles((prev) => prev.filter((id) => id !== fileId))

      // If this was the active file, set a new active file
      if (rightActiveFile === fileId) {
        const remainingFiles = rightPaneFiles.filter((id) => id !== fileId)
        setRightActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null)
      }

      // If right pane is now empty, disable split view
      if (rightPaneFiles.length <= 1 && rightPaneFiles.includes(fileId)) {
        setSplitView(false)
      }
    }
  }

  const handleFileContentChange = (fileId: string, newContent: string) => {
    setFileSystem((prev) => ({
      ...prev,
      files: prev.files.map((file) => (file.id === fileId ? { ...file, content: newContent } : file)),
    }))
  }

  const handleCreateFile = (name: string, parentId: string) => {
    const newFile = {
      id: Date.now().toString(),
      name,
      content: "",
      parentId,
    }

    setFileSystem((prev) => ({
      ...prev,
      files: [...prev.files, newFile],
    }))
  }

  const handleCreateFolder = (name: string, parentId: string) => {
    const newFolder = {
      id: Date.now().toString(),
      name,
      isOpen: false,
      parentId,
    }

    setFileSystem((prev) => ({
      ...prev,
      folders: [...prev.folders, newFolder],
    }))
  }

  const handleDeleteFile = (fileId: string) => {
    // Close the file if it's open in either pane
    if (leftPaneFiles.includes(fileId)) {
      handleCloseFile("left", fileId)
    }
    if (rightPaneFiles.includes(fileId)) {
      handleCloseFile("right", fileId)
    }

    setFileSystem((prev) => ({
      ...prev,
      files: prev.files.filter((file) => file.id !== fileId),
    }))
  }

  const handleDeleteFolder = (folderId: string) => {
    // Delete folder and all its contents recursively
    const foldersToDelete = [folderId]
    const filesToDelete: string[] = []

    // Find all subfolders
    const checkFolders = [folderId]
    while (checkFolders.length > 0) {
      const currentFolderId = checkFolders.shift()!
      const childFolders = fileSystem.folders.filter((f) => f.parentId === currentFolderId)

      childFolders.forEach((folder) => {
        foldersToDelete.push(folder.id)
        checkFolders.push(folder.id)
      })

      // Find all files in this folder
      const childFiles = fileSystem.files.filter((f) => f.parentId === currentFolderId)
      filesToDelete.push(...childFiles.map((f) => f.id))
    }

    // Close any open files that are being deleted
    filesToDelete.forEach((fileId) => {
      if (leftPaneFiles.includes(fileId)) {
        handleCloseFile("left", fileId)
      }
      if (rightPaneFiles.includes(fileId)) {
        handleCloseFile("right", fileId)
      }
    })

    setFileSystem((prev) => ({
      folders: prev.folders.filter((folder) => !foldersToDelete.includes(folder.id)),
      files: prev.files.filter((file) => !filesToDelete.includes(file.id)),
    }))
  }

  const toggleFolderOpen = (folderId: string) => {
    setFileSystem((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) => (folder.id === folderId ? { ...folder, isOpen: !folder.isOpen } : folder)),
    }))
  }

  const toggleSplitView = () => {
    setSplitView((prev) => !prev)
  }

  // Toggle settings menu
  const toggleSettingsMenu = () => {
    setSettingsOpen((prev) => !prev)
  }

  // Drag and drop handlers
  const handleDragStart = (pane: "left" | "right", fileId: string) => {
    setDraggedTab({ pane, fileId })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetPane: "left" | "right") => {
    if (!draggedTab) return

    const { pane: sourcePane, fileId } = draggedTab

    // If dropping on the same pane, do nothing
    if (sourcePane === targetPane) {
      setDraggedTab(null)
      return
    }

    // Move the tab from source pane to target pane
    if (sourcePane === "left" && targetPane === "right") {
      // Remove from left pane
      setLeftPaneFiles((prev) => prev.filter((id) => id !== fileId))

      // If this was the active file in left pane, set a new active file
      if (leftActiveFile === fileId) {
        const remainingFiles = leftPaneFiles.filter((id) => id !== fileId)
        setLeftActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null)
      }

      // Add to right pane if not already there
      if (!rightPaneFiles.includes(fileId)) {
        setRightPaneFiles((prev) => [...prev, fileId])
      }

      // Make it active in right pane
      setRightActiveFile(fileId)
    } else if (sourcePane === "right" && targetPane === "left") {
      // Remove from right pane
      setRightPaneFiles((prev) => prev.filter((id) => id !== fileId))

      // If this was the active file in right pane, set a new active file
      if (rightActiveFile === fileId) {
        const remainingFiles = rightPaneFiles.filter((id) => id !== fileId)
        setRightActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null)
      }

      // Add to left pane if not already there
      if (!leftPaneFiles.includes(fileId)) {
        setLeftPaneFiles((prev) => [...prev, fileId])
      }

      // Make it active in left pane
      setLeftActiveFile(fileId)
    }

    setDraggedTab(null)
  }

  // Get file objects for the active files
  const leftActiveFileObj = leftActiveFile ? fileSystem.files.find((file) => file.id === leftActiveFile) : null
  const rightActiveFileObj = rightActiveFile ? fileSystem.files.find((file) => file.id === rightActiveFile) : null

  // Render file tabs for a specific pane
  const renderFileTabs = (pane: "left" | "right") => {
    const files = pane === "left" ? leftPaneFiles : rightPaneFiles
    const activeFile = pane === "left" ? leftActiveFile : rightActiveFile
    const setActiveFile = pane === "left" ? setLeftActiveFile : setRightActiveFile

    return (
      <div
        className="flex items-center border-b border-gray-700 bg-[#3c3f41] overflow-x-auto h-9"
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(pane)}
      >
        {files.map((fileId) => {
          const file = fileSystem.files.find((f) => f.id === fileId)
          if (!file) return null

          const isActive = fileId === activeFile

          return (
            <div
              key={fileId}
              className={`flex items-center px-3 py-1 border-r border-gray-700 cursor-pointer ${
                isActive ? "bg-[#4e5254]" : "hover:bg-[#3f4244]"
              }`}
              onClick={() => setActiveFile(fileId)}
              draggable
              onDragStart={() => handleDragStart(pane, fileId)}
            >
              <span className="text-sm">{file.name}</span>
              <button className="ml-2 p-1 hover:bg-gray-600 rounded" onClick={(e) => handleCloseFile(pane, fileId, e)}>
                <X className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  const onFileClick = (fileId: string) => {
    handleFileClick(fileId)
  }

  const onSplitView = (fileId: string) => {
    handleSplitView(fileId)
  }

  const handleContextMenu = (event: React.MouseEvent, type: "file" | "folder", id: string) => {
    event.preventDefault()
    console.log(`Context menu for ${type} with id ${id}`)
  }

  return (
    <div className="flex flex-col h-screen bg-[#2b2b2b] text-gray-300 overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center justify-between bg-[#3c3f41] border-b border-gray-700 text-sm">
        <div className="flex items-center">
          <button className="p-2 hover:bg-gray-600">
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center px-3 py-2 hover:bg-gray-600">
            <span className="font-medium">PingVim</span>
          </div>
        </div>

        <div className="flex items-center">
          <button className="p-2 hover:bg-gray-600">
            <Search className="h-4 w-4" />
          </button>

          <button ref={settingsButtonRef} className="p-2 hover:bg-gray-600" onClick={toggleSettingsMenu}>
            <Settings className="h-4 w-4" />
          </button>

          <button className="p-2 hover:bg-gray-600">
            <User className="h-4 w-4" />
          </button>

          <button className="p-2 hover:bg-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Project explorer */}
        <div className="w-64 border-r border-gray-700 flex flex-col">
          <div className="h-9 flex items-center justify-between border-b border-gray-700 bg-[#3c3f41] px-2">
            <div className="flex items-center flex-1 mr-2">
              <Search className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search files..."
                className="bg-[#2b2b2b] text-sm border-none outline-none focus:ring-0 w-full h-6 px-2 text-gray-300"
                value={searchTerm}
                onChange={(e) => {
                  const term = e.target.value
                  setSearchTerm(term)

                  if (term.trim() === "") {
                    setSearchResults([])
                  } else {
                    // Поиск файлов по имени
                    const results = fileSystem.files.filter((file) =>
                      file.name.toLowerCase().includes(term.toLowerCase()),
                    )
                    setSearchResults(results)
                  }
                }}
              />
            </div>
            <div className="flex items-center space-x-1">
              <button className="p-1 hover:bg-gray-600 rounded">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {searchTerm.trim() !== "" ? (
              <div className="p-2">
                {searchResults.length > 0 ? (
                  searchResults.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center py-1 px-2 hover:bg-[#4b6eaf] cursor-pointer ${
                        leftActiveFile === file.id || rightActiveFile === file.id ? "bg-[#4b6eaf]" : ""
                      }`}
                      onClick={() => onFileClick(file.id)}
                    >
                      <File className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>

                      <div className="ml-auto flex items-center">
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
                            const rect = e.currentTarget.getBoundingClientRect()
                            handleContextMenu(e, "file", file.id)
                          }}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm p-2">No files found</div>
                )}
              </div>
            ) : (
              <FileExplorer
                folders={fileSystem.folders}
                files={fileSystem.files}
                onFileClick={handleFileClick}
                onCreateFile={handleCreateFile}
                onCreateFolder={handleCreateFolder}
                onDeleteFile={handleDeleteFile}
                onDeleteFolder={handleDeleteFolder}
                toggleFolderOpen={toggleFolderOpen}
                activeFileId={leftActiveFile || rightActiveFile}
                onSplitView={handleSplitView}
              />
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Split view container */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left pane */}
            <div className={`flex flex-col ${splitView ? "w-1/2 border-r border-gray-700" : "w-full"}`}>
              {/* Left pane tabs */}
              {renderFileTabs("left")}

              {/* Left pane editor */}
              <div className="flex-1 overflow-auto">
                {leftActiveFileObj ? (
                  <Editor
                    content={leftActiveFileObj.content}
                    onChange={(newContent) => handleFileContentChange(leftActiveFile, newContent)}
                    showLineNumbers={true}
                    fontSize={fontSize}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Select a file to edit</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right pane (only shown in split view) */}
            {splitView && (
              <div className="flex flex-col w-1/2">
                {/* Right pane tabs */}
                {renderFileTabs("right")}

                {/* Right pane editor */}
                <div className="flex-1 overflow-auto">
                  {rightActiveFileObj ? (
                    <Editor
                      content={rightActiveFileObj.content}
                      onChange={(newContent) => handleFileContentChange(rightActiveFile, newContent)}
                      showLineNumbers={true}
                      fontSize={fontSize}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>Select a file to edit</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Settings Menu (выпадающее меню) */}
      <SettingsMenu
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        anchorEl={settingsButtonRef.current}
      />
    </div>
  )
}

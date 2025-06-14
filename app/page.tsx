"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react"
import {
  Settings,
  Search,
  User,
  SplitSquareVertical,
  File,
  Folder,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash,
  Edit,
  X,
  Download,
  Upload,
} from "lucide-react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import AuthPage from "@/components/auth-page"
import Editor from "@/components/editor"
import StatusBar from "@/components/status-bar"
import type { FileType, FolderType } from "@/types/file-system"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeProvider, useTheme } from "@/contexts/theme-context"

// Wrap the main content with ThemeProvider
export default function Home() {
  return (
    <ThemeProvider>
      <HomeContent />
    </ThemeProvider>
  )
}

// Create a separate component for the main content
function HomeContent() {
  const { theme, toggleTheme } = useTheme()

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Password change dialog state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [disablePassword, setDisablePassword] = useState(false)

  // Check authentication on page load
  useEffect(() => {
    const auth = localStorage.getItem("pycharm-auth")
    setIsAuthenticated(auth === "true")
    setAuthChecked(true)
  }, [])

  // Add Esc key handler to lock editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAuthenticated) {
        localStorage.removeItem("pycharm-auth")
        setIsAuthenticated(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isAuthenticated])

  // Password change handler
  const handleChangePassword = () => {
    const currentPassword = localStorage.getItem("pycharm-password") || "111"

    if (oldPassword !== currentPassword) {
      setPasswordError("Неверный текущий пароль")
      return
    }

    if (disablePassword) {
      localStorage.removeItem("pycharm-password")
      setPasswordError("")
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setDisablePassword(false)
      setChangePasswordOpen(false)
      return
    }

    if (!newPassword) {
      setPasswordError("Пароль не может быть пустым")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают")
      return
    }

    localStorage.setItem("pycharm-password", newPassword)
    setPasswordError("")
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setDisablePassword(false)
    setChangePasswordOpen(false)
  }

  // File management state
  const [leftPaneFiles, setLeftPaneFiles] = useLocalStorage<string[]>("pycharm-left-pane-files", [])
  const [rightPaneFiles, setRightPaneFiles] = useLocalStorage<string[]>("pycharm-right-pane-files", [])
  const [leftActiveFile, setLeftActiveFile] = useLocalStorage<string | null>("pycharm-left-active-file", null)
  const [rightActiveFile, setRightActiveFile] = useLocalStorage<string | null>("pycharm-right-active-file", null)
  const [splitView, setSplitView] = useLocalStorage<boolean>("pycharm-split-view", false)
  const [draggedTab, setDraggedTab] = useState<{ pane: "left" | "right"; fileId: string } | null>(null)
  const [fontSize, setFontSize] = useLocalStorage<number>("pycharm-font-size", 14)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)

  // Search state
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<FileType[]>([])

  // Dialog states
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false)
  const [newItemType, setNewItemType] = useState<"file" | "folder">("file")
  const [newItemName, setNewItemName] = useState("")
  const [newItemParentId, setNewItemParentId] = useState<string | null>(null)

  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [itemToRename, setItemToRename] = useState<{
    id: string
    type: "file" | "folder"
    name: string
  } | null>(null)
  const [newName, setNewName] = useState("")

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    id: string
    type: "file" | "folder"
  } | null>(null)

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const sidebarWidthRef = useRef(256)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const isResizingRef = useRef(false)
  const minWidth = 200
  const collapsedWidth = 50

  // Split view state
  const [splitRatio, setSplitRatio] = useLocalStorage<number>("pycharm-split-ratio", 50)
  const splitRatioRef = useRef(50)
  const leftPaneRef = useRef<HTMLDivElement>(null)
  const rightPaneRef = useRef<HTMLDivElement>(null)
  const contentAreaRef = useRef<HTMLDivElement>(null)
  const isSplitResizingRef = useRef(false)
  const minSplitWidth = 20

  // File system state
  const [fileSystem, setFileSystem] = useLocalStorage<{
    folders: FolderType[]
    files: FileType[]
  }>("pycharm-file-system", {
    folders: [{ id: "1", name: "Notes", isOpen: true, parentId: null }],
    files: [],
  })

  const toolbarRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Enable split view if there are files in the right pane
  useEffect(() => {
    if (rightPaneFiles.length > 0 && !splitView) {
      setSplitView(true)
    }
  }, [rightPaneFiles, splitView, setSplitView])

  // Handle left pane files changes
  useEffect(() => {
    if (leftPaneFiles.length === 0 && rightPaneFiles.length > 0 && splitView) {
      setLeftPaneFiles([...rightPaneFiles])
      setLeftActiveFile(rightActiveFile)
      setRightPaneFiles([])
      setRightActiveFile(null)
      setSplitView(false)
    }
  }, [
    leftPaneFiles,
    rightPaneFiles,
    splitView,
    rightActiveFile,
    setLeftPaneFiles,
    setLeftActiveFile,
    setRightPaneFiles,
    setRightActiveFile,
    setSplitView,
  ])

  // Sidebar resizer setup
  useEffect(() => {
    const setupResizer = () => {
      const sidebar = sidebarRef.current
      const resizer = document.getElementById("sidebar-resizer")

      if (!sidebar || !resizer) {
        return setTimeout(setupResizer, 100)
      }

      let isResizing = false
      let startX = 0
      let startWidth = 0

      const handleMouseDown = (e: MouseEvent) => {
        if (sidebarCollapsed) return

        e.preventDefault()
        isResizing = true
        startX = e.clientX
        startWidth = sidebar.getBoundingClientRect().width
        document.body.classList.add("select-none")

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
      }

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing) return

        const newWidth = Math.max(startWidth + (e.clientX - startX), minWidth)
        sidebar.style.width = `${newWidth}px`
        sidebarWidthRef.current = newWidth
      }

      const handleMouseUp = () => {
        if (!isResizing) return

        isResizing = false
        document.body.classList.remove("select-none")
        setSidebarWidth(sidebarWidthRef.current)

        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      resizer.removeEventListener("mousedown", handleMouseDown)
      resizer.addEventListener("mousedown", handleMouseDown)

      return () => {
        resizer.removeEventListener("mousedown", handleMouseDown)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }

    const cleanup = setupResizer()

    if (sidebarRef.current) {
      sidebarRef.current.style.width = sidebarCollapsed ? `${collapsedWidth}px` : `${sidebarWidth}px`
    }

    return () => {
      if (typeof cleanup === "function") {
        cleanup()
      } else if (typeof cleanup === "number") {
        clearTimeout(cleanup)
      }
    }
  }, [sidebarCollapsed, sidebarWidth, collapsedWidth, minWidth, setSidebarWidth])

  // Split resizer initialization
  const initSplitResizer = useCallback(() => {
    const splitResizer = document.getElementById("split-resizer")
    const leftPane = leftPaneRef.current
    const rightPane = rightPaneRef.current
    const contentArea = contentAreaRef.current

    if (!splitResizer || !leftPane || !rightPane || !contentArea || !splitView) return

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      isSplitResizingRef.current = true
      document.body.classList.add("select-none")

      const startX = e.clientX
      const containerWidth = contentArea.getBoundingClientRect().width
      const startRatio = splitRatio

      const onMouseMove = (e: MouseEvent) => {
        if (!isSplitResizingRef.current) return

        const deltaX = e.clientX - startX
        const deltaRatio = (deltaX / containerWidth) * 100
        const newRatio = Math.min(Math.max(startRatio + deltaRatio, minSplitWidth), 100 - minSplitWidth)

        leftPane.style.width = `${newRatio}%`
        rightPane.style.width = `${100 - newRatio}%`
        splitRatioRef.current = newRatio

        e.preventDefault()
      }

      const onMouseUp = () => {
        isSplitResizingRef.current = false
        document.body.classList.remove("select-none")
        setSplitRatio(splitRatioRef.current)

        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }

      document.addEventListener("mousemove", onMouseMove, { passive: false })
      document.addEventListener("mouseup", onMouseUp)
    }

    splitResizer.addEventListener("mousedown", onMouseDown)

    return () => {
      splitResizer.removeEventListener("mousedown", onMouseDown)
    }
  }, [splitView, splitRatio, minSplitWidth])

  // Initialize split resizer
  useLayoutEffect(() => {
    if (splitView) {
      return initSplitResizer()
    }
  }, [initSplitResizer, splitView])

  // Sidebar toggle
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // File operations
  const handleFileClick = (fileId: string) => {
    const file = fileSystem.files.find((f) => f.id === fileId)
    if (!file) return

    if (splitView) {
      if (leftPaneFiles.includes(fileId)) {
        setLeftActiveFile(fileId)
        return
      }
      if (rightPaneFiles.includes(fileId)) {
        setRightActiveFile(fileId)
        return
      }

      if (!rightActiveFile) {
        setRightPaneFiles((prev) => [...prev, fileId])
        setRightActiveFile(fileId)
        return
      }

      setLeftPaneFiles((prev) => [...prev, fileId])
      setLeftActiveFile(fileId)
    } else {
      if (!leftPaneFiles.includes(fileId)) {
        setLeftPaneFiles((prev) => [...prev, fileId])
      }
      setLeftActiveFile(fileId)
    }
  }

  const handleSplitView = (fileId: string) => {
    if (!splitView) {
      setSplitView(true)
    }

    if (rightPaneFiles.includes(fileId)) {
      setRightActiveFile(fileId)
      return
    }

    if (leftPaneFiles.includes(fileId)) {
      setLeftPaneFiles((prev) => prev.filter((id) => id !== fileId))

      if (leftActiveFile === fileId) {
        const remainingFiles = leftPaneFiles.filter((id) => id !== fileId)
        setLeftActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null)
      }
    }

    setRightPaneFiles((prev) => [...prev, fileId])
    setRightActiveFile(fileId)
  }

  const handleCloseFile = (pane: "left" | "right", fileId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()

    if (pane === "left") {
      setLeftPaneFiles((prev) => {
        const newFiles = prev.filter((id) => id !== fileId)
        return newFiles
      })

      if (leftActiveFile === fileId) {
        const remainingFiles = leftPaneFiles.filter((id) => id !== fileId)
        setLeftActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null)
      }
    } else {
      setRightPaneFiles((prev) => {
        const newFiles = prev.filter((id) => id !== fileId)
        return newFiles
      })

      if (rightActiveFile === fileId) {
        const remainingFiles = rightPaneFiles.filter((id) => id !== fileId)
        setRightActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null)
      }

      if (rightPaneFiles.length === 1 && rightPaneFiles[0] === fileId) {
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

  // File system operations
  const openNewFileDialog = (parentId: string) => {
    setNewItemType("file")
    setNewItemName("")
    setNewItemParentId(parentId)
    setNewItemDialogOpen(true)
  }

  const openNewFolderDialog = (parentId: string) => {
    setNewItemType("folder")
    setNewItemName("")
    setNewItemParentId(parentId)
    setNewItemDialogOpen(true)
  }

  const openRenameDialog = (type: "file" | "folder", id: string) => {
    const item =
      type === "file" ? fileSystem.files.find((f) => f.id === id) : fileSystem.folders.find((f) => f.id === id)

    if (item) {
      setItemToRename({
        id,
        type,
        name: item.name,
      })
      setNewName(item.name)
      setRenameDialogOpen(true)
    }
  }

  const openDeleteDialog = (type: "file" | "folder", id: string) => {
    if (type === "folder" && id === "1") {
      alert("Корневую папку нельзя удалить")
      return
    }

    setItemToDelete({
      id,
      type,
    })
    setDeleteConfirmOpen(true)
  }

  const createNewItem = () => {
    if (!newItemName.trim() || !newItemParentId) {
      setNewItemDialogOpen(false)
      return
    }

    if (newItemType === "file") {
      const newFile = {
        id: Date.now().toString(),
        name: newItemName,
        content: "",
        parentId: newItemParentId,
      }

      setFileSystem((prev) => ({
        ...prev,
        files: [...prev.files, newFile],
      }))
    } else {
      const newFolder = {
        id: Date.now().toString(),
        name: newItemName,
        isOpen: false,
        parentId: newItemParentId,
      }

      setFileSystem((prev) => ({
        ...prev,
        folders: [...prev.folders, newFolder],
      }))
    }

    setNewItemDialogOpen(false)
  }

  const renameItem = () => {
    if (!itemToRename || !newName.trim()) {
      setRenameDialogOpen(false)
      return
    }

    if (itemToRename.type === "file") {
      setFileSystem((prev) => ({
        ...prev,
        files: prev.files.map((file) => (file.id === itemToRename.id ? { ...file, name: newName } : file)),
      }))
    } else {
      setFileSystem((prev) => ({
        ...prev,
        folders: prev.folders.map((folder) => (folder.id === itemToRename.id ? { ...folder, name: newName } : folder)),
      }))
    }

    setRenameDialogOpen(false)
    setItemToRename(null)
  }

  const deleteItem = () => {
    if (!itemToDelete) {
      setDeleteConfirmOpen(false)
      return
    }

    if (itemToDelete.type === "file") {
      if (leftPaneFiles.includes(itemToDelete.id)) {
        handleCloseFile("left", itemToDelete.id)
      }
      if (rightPaneFiles.includes(itemToDelete.id)) {
        handleCloseFile("right", itemToDelete.id)
      }

      setFileSystem((prev) => ({
        ...prev,
        files: prev.files.filter((file) => file.id !== itemToDelete.id),
      }))
    } else {
      const foldersToDelete = [itemToDelete.id]
      const filesToDelete: string[] = []

      const checkFolders = [itemToDelete.id]
      while (checkFolders.length > 0) {
        const currentFolderId = checkFolders.shift()!
        const childFolders = fileSystem.folders.filter((f) => f.parentId === currentFolderId)

        childFolders.forEach((folder) => {
          foldersToDelete.push(folder.id)
          checkFolders.push(folder.id)
        })

        const childFiles = fileSystem.files.filter((f) => f.parentId === currentFolderId)
        filesToDelete.push(...childFiles.map((f) => f.id))
      }

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

    setDeleteConfirmOpen(false)
    setItemToDelete(null)
  }

  const toggleFolderOpen = (folderId: string) => {
    setFileSystem((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) => (folder.id === folderId ? { ...folder, isOpen: !folder.isOpen } : folder)),
    }))
  }

  // Export/Import functions
  const exportData = () => {
    try {
      const exportData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: fileSystem,
      }

      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `pingvim-data-${new Date().toISOString().slice(0, 10)}.json`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Ошибка при экспорте данных:", error)
      alert("Произошла ошибка при экспорте данных")
    }
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const importedData = JSON.parse(content)

          if (importedData.data && Array.isArray(importedData.data.folders) && Array.isArray(importedData.data.files)) {
            setFileSystem(importedData.data)
            setLeftPaneFiles([])
            setRightPaneFiles([])
            setLeftActiveFile(null)
            setRightActiveFile(null)

            alert("Данные успешно импортированы")
          } else {
            throw new Error("Неверный формат данных")
          }
        } catch (parseError) {
          console.error("Ошибка при парсинге файла:", parseError)
          alert("Не удалось прочитать файл. Убедитесь, что это корректный JSON-файл с данными PingVim")
        }
      }

      reader.readAsText(file)
      event.target.value = ""
    } catch (error) {
      console.error("Ошибка при импорте данных:", error)
      alert("Произошла ошибка при импорте данных")
    }
  }

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim()) {
      const results = fileSystem.files.filter(
        (file) =>
          file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.content.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchTerm, fileSystem.files])

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

    if (sourcePane === targetPane) {
      setDraggedTab(null)
      return
    }

    if (sourcePane === "left" && targetPane === "right") {
      setLeftPaneFiles((prev) => prev.filter((id) => id !== fileId))

      if (leftActiveFile === fileId) {
        const remainingFiles = leftPaneFiles.filter((id) => id !== fileId)
        setLeftActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null)
      }

      if (!rightPaneFiles.includes(fileId)) {
        setRightPaneFiles((prev) => [...prev, fileId])
      }

      setRightActiveFile(fileId)
    } else if (sourcePane === "right" && targetPane === "left") {
      setRightPaneFiles((prev) => prev.filter((id) => id !== fileId))

      if (rightActiveFile === fileId) {
        const remainingFiles = rightPaneFiles.filter((id) => id !== fileId)
        setRightActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null)
      }

      if (!leftPaneFiles.includes(fileId)) {
        setLeftPaneFiles((prev) => [...prev, fileId])
      }
      setLeftActiveFile(fileId)
    }

    setDraggedTab(null)
  }

  // Get active file objects
  const leftActiveFileObj = leftActiveFile ? fileSystem.files.find((file) => file.id === leftActiveFile) : null
  const rightActiveFileObj = rightActiveFile ? fileSystem.files.find((file) => file.id === rightActiveFile) : null

  // Render file tabs
  const renderFileTabs = (pane: "left" | "right") => {
    const files = pane === "left" ? leftPaneFiles : rightPaneFiles
    const activeFile = pane === "left" ? leftActiveFile : rightActiveFile
    const setActiveFile = pane === "left" ? setLeftActiveFile : setRightActiveFile

    return (
      <div
        className="flex items-center bg-[#1E1F22] overflow-x-auto h-9"
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(pane)}
      >
        {pane === "left" && (
          <div className="flex-shrink-0 px-2">
            <button
              className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-gray-200"
              onClick={() => {
                if (activeFile) {
                  handleSplitView(activeFile)
                }
              }}
              title="Split View"
            >
              <SplitSquareVertical className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex items-center overflow-x-auto">
          {files.map((fileId) => {
            const file = fileSystem.files.find((f) => f.id === fileId)
            if (!file) return null

            const isActive = fileId === activeFile

            return (
              <div
                key={fileId}
                className={`flex items-center px-3 py-1 cursor-pointer h-full ${
                  isActive
                    ? "bg-[#1E1F22] border-b-4 border-b-[#2E436E]"
                    : "bg-[#1E1F22] hover:bg-[#3f4244] border-b-4 border-b-transparent"
                }`}
                style={{ fontSize: "13px" }}
                onClick={() => setActiveFile(fileId)}
                draggable
                onDragStart={() => handleDragStart(pane, fileId)}
              >
                <span className="truncate">{file.name}</span>
                <button
                  className="ml-2 p-1 hover:bg-gray-600 rounded"
                  onClick={(e) => handleCloseFile(pane, fileId, e)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render file explorer
  const renderFileExplorer = () => {
    const renderFolder = (folder: FolderType) => {
      const childFolders = fileSystem.folders.filter((f) => f.parentId === folder.id)
      const childFiles = fileSystem.files.filter((f) => f.parentId === folder.id)

      return (
        <div key={folder.id} className="select-none">
          <div className="flex items-center py-1 px-2 hover:bg-[#2E436E] cursor-pointer group">
            <div className="flex-grow flex items-center" onClick={() => toggleFolderOpen(folder.id)}>
              {folder.isOpen ? (
                <ChevronDown className="h-4 w-4 mr-1 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1 flex-shrink-0" />
              )}

              <Folder className="h-4 w-4 mr-1 text-yellow-500 flex-shrink-0" />
              <span className="text-sm truncate">{folder.name}</span>
            </div>

            <div className="ml-auto hidden group-hover:flex">
              <button
                className="p-1 hover:bg-gray-600"
                onClick={(e) => {
                  e.stopPropagation()
                  openNewFolderDialog(folder.id)
                }}
                title="New Folder"
              >
                <Folder className="h-3 w-3" />
              </button>
              <button
                className="p-1 hover:bg-gray-600"
                onClick={(e) => {
                  e.stopPropagation()
                  openNewFileDialog(folder.id)
                }}
                title="New File"
              >
                <Plus className="h-3 w-3" />
              </button>
              <button
                className="p-1 hover:bg-gray-600"
                onClick={(e) => {
                  e.stopPropagation()
                  openRenameDialog("folder", folder.id)
                }}
                title="Rename"
              >
                <Edit className="h-3 w-3" />
              </button>
              {folder.id !== "1" && (
                <button
                  className="p-1 hover:bg-gray-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    openDeleteDialog("folder", folder.id)
                  }}
                  title="Delete"
                >
                  <Trash className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {folder.isOpen && (
            <div className="pl-4">
              {childFolders.map(renderFolder)}
              {childFiles.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center py-1 px-2 hover:bg-[#2E436E] cursor-pointer group ${
                    leftActiveFile === file.id || rightActiveFile === file.id ? "bg-[#2E436E]" : ""
                  }`}
                >
                  <div className="flex-grow flex items-center" onClick={() => handleFileClick(file.id)}>
                    <File className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>

                  <div className="ml-auto hidden group-hover:flex items-center">
                    <button
                      className="p-1 hover:bg-gray-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSplitView(file.id)
                      }}
                      title="Open in Split View"
                    >
                      <SplitSquareVertical className="h-3 w-3" />
                    </button>
                    <button
                      className="p-1 hover:bg-gray-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        openRenameDialog("file", file.id)
                      }}
                      title="Rename"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      className="p-1 hover:bg-gray-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDeleteDialog("file", file.id)
                      }}
                      title="Delete"
                    >
                      <Trash className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    const rootFolders = fileSystem.folders.filter((folder) => folder.parentId === null)

    return (
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Local storage</span>
          <div className="flex space-x-1">
            <button
              className="p-1 hover:bg-gray-600 rounded"
              onClick={() => fileInputRef.current?.click()}
              title="Импорт данных"
            >
              <Upload className="h-3 w-3" />
            </button>
            <button className="p-1 hover:bg-gray-600 rounded" onClick={exportData} title="Экспорт данных">
              <Download className="h-3 w-3" />
            </button>
          </div>
        </div>
        {rootFolders.map(renderFolder)}
      </div>
    )
  }

  // Render search results
  const renderSearchResults = () => {
    return (
      <div className="p-2">
        {searchResults.length > 0 ? (
          searchResults.map((file) => (
            <div
              key={file.id}
              className={`flex items-center py-1 px-2 hover:bg-[#2E436E] cursor-pointer group ${
                leftActiveFile === file.id || rightActiveFile === file.id ? "bg-[#2E436E]" : ""
              }`}
            >
              <div className="flex-grow flex items-center" onClick={() => handleFileClick(file.id)}>
                <File className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                <span className="text-sm truncate">{file.name}</span>
              </div>

              <div className="ml-auto hidden group-hover:flex items-center">
                <button
                  className="p-1 hover:bg-gray-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSplitView(file.id)
                  }}
                  title="Open in Split View"
                >
                  <SplitSquareVertical className="h-3 w-3" />
                </button>
                <button
                  className="p-1 hover:bg-gray-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    openRenameDialog("file", file.id)
                  }}
                  title="Rename"
                >
                  <Edit className="h-3 w-3" />
                </button>
                <button
                  className="p-1 hover:bg-gray-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    openDeleteDialog("file", file.id)
                  }}
                  title="Delete"
                >
                  <Trash className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-sm p-2">No files found</div>
        )}
      </div>
    )
  }

  // If auth check is not complete, show nothing
  if (!authChecked) {
    return null
  }

  // If not authenticated, show auth page
  if (!isAuthenticated) {
    const savedPassword = localStorage.getItem("pycharm-password") || "111"
    return <AuthPage onAuth={(success) => setIsAuthenticated(success)} defaultPassword={savedPassword} />
  }

  return (
    <div
      className={`flex flex-col h-screen ${theme === "dark" ? "bg-[#2b2b2b] text-gray-300" : "bg-gray-100 text-gray-800"} overflow-hidden`}
    >
      {/* Top toolbar */}
      <div
        ref={toolbarRef}
        className={`flex items-center text-sm h-10 ${theme === "dark" ? "bg-[#1B1C1F]" : "bg-white border-b border-gray-300"}`}
      >
        <div className="flex items-center">
          <div className="flex items-center px-2 py-1">
            <div
              className="bg-yellow-500 text-black font-bold w-6 h-6 flex items-center justify-center rounded relative overflow-hidden animate-pulse hover:animate-none"
              style={{
                animation: "logoSpin 3s infinite alternate",
              }}
            >
              <style jsx>{`
                @keyframes logoSpin {
                  0% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.4);
                  }
                  50% {
                    transform: scale(1.05);
                    box-shadow: 0 0 0 5px rgba(250, 204, 21, 0);
                  }
                  100% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
                  }
                }
                
                @keyframes textRotate {
                  0% {
                    transform: rotate(-8deg);
                  }
                  50% {
                    transform: rotate(0deg);
                  }
                  100% {
                    transform: rotate(8deg);
                  }
                }
              `}</style>
              <span
                className="relative z-10"
                style={{
                  animation: "textRotate 3s ease-in-out infinite alternate",
                  display: "inline-block",
                }}
              >
                PV
              </span>
              <div
                className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-600 opacity-80"
                style={{ animation: "gradientShift 4s infinite alternate" }}
              ></div>
              <style jsx>{`
                @keyframes gradientShift {
                  0% {
                    background-position: 0% 50%;
                  }
                  50% {
                    background-position: 100% 50%;
                  }
                  100% {
                    background-position: 0% 50%;
                  }
                }
              `}</style>
            </div>
          </div>

          <div
            className={`flex items-center px-1.5 py-1 hover:bg-[#2E436E] cursor-pointer ${theme === "light" ? "text-black" : "text-white"}`}
          >
            <span className="font-medium">PingVim</span>
          </div>
        </div>

        <div className="ml-auto flex items-center">
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={importData} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-gray-600" title="Меню пользователя">
                <User className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={`${theme === "dark" ? "bg-[#1B1C1F] border-gray-700 text-gray-300" : "bg-white border-gray-300 text-gray-800"}`}
            >
              <DropdownMenuItem
                onClick={() => setChangePasswordOpen(true)}
                className={`hover:bg-[#2E436E] cursor-pointer focus:bg-[#2E436E] focus:text-gray-300 ${theme === "light" ? "text-gray-800" : "text-gray-300"}`}
              >
                Сменить пароль
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  localStorage.removeItem("pycharm-auth")
                  setIsAuthenticated(false)
                }}
                className={`hover:bg-[#2E436E] cursor-pointer focus:bg-[#2E436E] focus:text-gray-300 ${theme === "light" ? "text-gray-800" : "text-gray-300"}`}
              >
                Заблокировать редактор
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            className="p-2 hover:bg-gray-600"
            onClick={() => setSettingsOpen(!settingsOpen)}
            ref={settingsButtonRef}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Project explorer */}
        <div
          ref={sidebarRef}
          className={`flex flex-col ease-in-out ${theme === "dark" ? "bg-[#1B1C1F]" : "bg-white border-r border-gray-300"}`}
          style={{
            width: sidebarCollapsed ? `${collapsedWidth}px` : `${sidebarWidth}px`,
            minWidth: sidebarCollapsed ? `${collapsedWidth}px` : `${minWidth}px`,
          }}
        >
          <div className="h-9 flex items-center justify-between bg-transparent px-2">
            <div className={`flex items-center flex-1 mr-2 ${sidebarCollapsed ? "hidden" : ""}`}>
              <Search className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`flex-1 bg-transparent text-sm outline-none ${theme === "dark" ? "text-gray-300 placeholder-gray-500" : "text-gray-800 placeholder-gray-400"}`}
              />
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1 hover:bg-gray-600 rounded flex-shrink-0"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchTerm.trim() ? renderSearchResults() : renderFileExplorer()}
          </div>

          {/* Sidebar resizer */}
          <div
            id="sidebar-resizer"
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-500 transition-colors"
            style={{ zIndex: 10 }}
          />
        </div>

        {/* Main content area */}
        <div ref={contentAreaRef} className="flex-1 flex flex-col overflow-hidden">
          {/* File tabs and editor */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left pane */}
            <div
              ref={leftPaneRef}
              className="flex flex-col overflow-hidden"
              style={{ width: splitView ? `${splitRatio}%` : "100%" }}
            >
              {leftPaneFiles.length > 0 && renderFileTabs("left")}
              <div className="flex-1 overflow-hidden">
                {leftActiveFileObj ? (
                  <Editor
                    content={leftActiveFileObj.content}
                    onChange={(newContent) => handleFileContentChange(leftActiveFileObj.id, newContent)}
                    showLineNumbers={true}
                    fontSize={fontSize}
                  />
                ) : (
                  <div
                    className={`flex items-center justify-center h-full ${theme === "dark" ? "bg-[#1E1F22] text-gray-500" : "bg-white text-gray-400"}`}
                  >
                    <div className="text-center">
                      <File className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>No file selected</p>
                      <p className="text-sm mt-2">Open a file from the explorer to start editing</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Split resizer */}
            {splitView && (
              <div
                id="split-resizer"
                className="w-1 bg-gray-600 cursor-col-resize hover:bg-blue-500 transition-colors flex-shrink-0"
              />
            )}

            {/* Right pane */}
            {splitView && (
              <div
                ref={rightPaneRef}
                className="flex flex-col overflow-hidden"
                style={{ width: `${100 - splitRatio}%` }}
              >
                {rightPaneFiles.length > 0 && renderFileTabs("right")}
                <div className="flex-1 overflow-hidden">
                  {rightActiveFileObj ? (
                    <Editor
                      content={rightActiveFileObj.content}
                      onChange={(newContent) => handleFileContentChange(rightActiveFileObj.id, newContent)}
                      showLineNumbers={true}
                      fontSize={fontSize}
                    />
                  ) : (
                    <div
                      className={`flex items-center justify-center h-full ${theme === "dark" ? "bg-[#1E1F22] text-gray-500" : "bg-white text-gray-400"}`}
                    >
                      <div className="text-center">
                        <File className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No file selected</p>
                        <p className="text-sm mt-2">Open a file from the explorer to start editing</p>
                      </div>
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

      {/* Dialogs */}
      {newItemDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1B1C1F] border border-gray-700 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Create New {newItemType === "file" ? "File" : "Folder"}
            </h3>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`Enter ${newItemType} name`}
              className="w-full bg-[#2b2b2b] border border-gray-600 rounded px-3 py-2 text-white mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  createNewItem()
                } else if (e.key === "Escape") {
                  setNewItemDialogOpen(false)
                }
              }}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setNewItemDialogOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button onClick={createNewItem} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {renameDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1B1C1F] border border-gray-700 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Rename {itemToRename?.type === "file" ? "File" : "Folder"}
            </h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-[#2b2b2b] border border-gray-600 rounded px-3 py-2 text-white mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  renameItem()
                } else if (e.key === "Escape") {
                  setRenameDialogOpen(false)
                }
              }}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRenameDialogOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button onClick={renameItem} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1B1C1F] border border-gray-700 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-white">Confirm Delete</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button onClick={deleteItem} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {changePasswordOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1B1C1F] border border-gray-700 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-white">Сменить пароль</h3>
            {passwordError && <div className="text-red-400 text-sm mb-4">{passwordError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Текущий пароль</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-[#2b2b2b] border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
              {!disablePassword && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Новый пароль</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#2b2b2b] border border-gray-600 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Подтвердить пароль</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#2b2b2b] border border-gray-600 rounded px-3 py-2 text-white"
                    />
                  </div>
                </>
              )}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="disablePassword"
                  checked={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="disablePassword" className="text-sm text-gray-400">
                  Отключить защиту паролем
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setChangePasswordOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Отмена
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1B1C1F] border border-gray-700 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-white">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Font Size</label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-400 mt-1">{fontSize}px</div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Theme</label>
                <button
                  onClick={toggleTheme}
                  className="w-full bg-[#2b2b2b] border border-gray-600 rounded px-3 py-2 text-white text-left"
                >
                  {theme === "dark" ? "Dark" : "Light"} Theme
                </button>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

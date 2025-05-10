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
  ChevronLeft,
  ChevronRightIcon,
  X,
  Download,
  Upload,
} from "lucide-react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import Editor from "@/components/editor"
import StatusBar from "@/components/status-bar"
import AuthPage from "@/components/auth-page"
import type { FileType, FolderType } from "@/types/file-system"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function Home() {
  // Состояние авторизации
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Состояние для диалога смены пароля
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [disablePassword, setDisablePassword] = useState(false)

  // Проверяем авторизацию при загрузке страницы
  useEffect(() => {
    const auth = localStorage.getItem("pycharm-auth")
    setIsAuthenticated(auth === "true")
    setAuthChecked(true)
  }, [])

  // Добавляем обработчик нажатия клавиши Esc для блокировки редактора
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAuthenticated) {
        // Блокируем редактор при нажатии Esc
        localStorage.removeItem("pycharm-auth")
        setIsAuthenticated(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isAuthenticated])

  // Функция для смены пароля
  const handleChangePassword = () => {
    // Получаем текущий пароль из localStorage или используем дефолтный
    const currentPassword = localStorage.getItem("pycharm-password") || "111"

    // Проверяем старый пароль
    if (oldPassword !== currentPassword) {
      setPasswordError("Неверный текущий пароль")
      return
    }

    // Если выбрано отключение пароля
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

    // Сохраняем новый пароль
    localStorage.setItem("pycharm-password", newPassword)
    setPasswordError("")
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setDisablePassword(false)
    setChangePasswordOpen(false)
  }

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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(256) // 256px = 64 * 4 (w-64)
  const sidebarWidthRef = useRef(256)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const isResizingRef = useRef(false)
  const minWidth = 200
  const collapsedWidth = 50

  // Split view resizing
  const [splitRatio, setSplitRatio] = useLocalStorage<number>("pycharm-split-ratio", 50) // 50% for left pane
  const splitRatioRef = useRef(50)
  const leftPaneRef = useRef<HTMLDivElement>(null)
  const rightPaneRef = useRef<HTMLDivElement>(null)
  const contentAreaRef = useRef<HTMLDivElement>(null)
  const isSplitResizingRef = useRef(false)
  const minSplitWidth = 20 // Minimum percentage for each pane

  const [fileSystem, setFileSystem] = useLocalStorage<{
    folders: FolderType[]
    files: FileType[]
  }>("pycharm-file-system", {
    folders: [{ id: "1", name: "Notes", isOpen: true, parentId: null }],
    files: [],
  })

  // После других useRef
  const toolbarRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Enable split view if there are files in the right pane
  useEffect(() => {
    if (rightPaneFiles.length > 0 && !splitView) {
      setSplitView(true)
    }
  }, [rightPaneFiles, splitView, setSplitView])

  // Отслеживаем изменения в leftPaneFiles
  useEffect(() => {
    // Если в левой панели нет файлов, но есть файлы в правой панели и включен режим split view
    if (leftPaneFiles.length === 0 && rightPaneFiles.length > 0 && splitView) {
      // Перемещаем файлы из правой панели в левую
      setLeftPaneFiles([...rightPaneFiles])
      setLeftActiveFile(rightActiveFile)

      // Очищаем правую панель
      setRightPaneFiles([])
      setRightActiveFile(null)

      // Отключаем режим split view
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

  // Найдем и заменим функцию initResizer и соответствующий useLayoutEffect

  // Заменим функцию initResizer на следующую:
  // Удалите существующую функцию initResizer и useEffect, связанный с ней

  // Добавьте этот новый useEffect сразу после объявления всех useRef
  useEffect(() => {
    // Функция для инициализации обработчика изменения размера
    const setupResizer = () => {
      const sidebar = sidebarRef.current
      const resizer = document.getElementById("sidebar-resizer")

      if (!sidebar || !resizer) {
        // Если элементы еще не доступны, пробуем снова через небольшую задержку
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

      // Очищаем предыдущие обработчики, если они есть
      resizer.removeEventListener("mousedown", handleMouseDown)

      // Добавляем новый обработчик
      resizer.addEventListener("mousedown", handleMouseDown)

      // Возвращаем функцию очистки
      return () => {
        resizer.removeEventListener("mousedown", handleMouseDown)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }

    // Запускаем настройку обработчика
    const cleanup = setupResizer()

    // Обновляем ширину сайдбара в DOM напрямую при изменении состояния
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

      // Запоминаем начальную позицию курсора и размеры контейнера
      const startX = e.clientX
      const containerWidth = contentArea.getBoundingClientRect().width
      const startRatio = splitRatio

      const onMouseMove = (e: MouseEvent) => {
        if (!isSplitResizingRef.current) return

        // Рассчитываем новое соотношение на основе смещения курсора
        const deltaX = e.clientX - startX
        const deltaRatio = (deltaX / containerWidth) * 100
        const newRatio = Math.min(Math.max(startRatio + deltaRatio, minSplitWidth), 100 - minSplitWidth)

        // Напрямую обновляем DOM без использования React состояния
        leftPane.style.width = `${newRatio}%`
        rightPane.style.width = `${100 - newRatio}%`
        splitRatioRef.current = newRatio

        // Предотвращаем выделение текста во время перетаскивания
        e.preventDefault()
      }

      const onMouseUp = () => {
        isSplitResizingRef.current = false
        document.body.classList.remove("select-none")

        // Обновляем React состояние только после завершения перетаскивания
        setSplitRatio(splitRatioRef.current)

        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }

      // Используем { passive: false } для предотвращения задержек в обработке событий
      document.addEventListener("mousemove", onMouseMove, { passive: false })
      document.addEventListener("mouseup", onMouseUp)
    }

    splitResizer.addEventListener("mousedown", onMouseDown)

    return () => {
      splitResizer.removeEventListener("mousedown", onMouseDown)
    }
  }, [splitView, splitRatio, minSplitWidth])

  // Инициализация изменения размера

  // Инициализация изменения размера split view
  useLayoutEffect(() => {
    if (splitView) {
      return initSplitResizer()
    }
  }, [initSplitResizer, splitView])

  // Применяем градиент к боковой панели

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

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
      // Удаляем файл из левой панели
      setLeftPaneFiles((prev) => {
        const newFiles = prev.filter((id) => id !== fileId)
        return newFiles
      })

      // Если это был активный файл, устанавливаем новый активный файл
      if (leftActiveFile === fileId) {
        const remainingFiles = leftPaneFiles.filter((id) => id !== fileId)
        setLeftActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null)
      }
    } else {
      // Удаляем файл из правой панели
      setRightPaneFiles((prev) => {
        const newFiles = prev.filter((id) => id !== fileId)
        return newFiles
      })

      // Если это был активный файл, устанавливаем новый активный файл
      if (rightActiveFile === fileId) {
        const remainingFiles = rightPaneFiles.filter((id) => id !== fileId)
        setRightActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null)
      }

      // Если правая панель теперь пуста, отключаем режим split view
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

  // File operations
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
    // Запрещаем удаление корневой папки Notes (id: "1")
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
      // Close the file if it's open in either pane
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
      // Delete folder and all its contents recursively
      const foldersToDelete = [itemToDelete.id]
      const filesToDelete: string[] = []

      // Find all subfolders
      const checkFolders = [itemToDelete.id]
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

    setDeleteConfirmOpen(false)
    setItemToDelete(null)
  }

  const toggleFolderOpen = (folderId: string) => {
    setFileSystem((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) => (folder.id === folderId ? { ...folder, isOpen: !folder.isOpen } : folder)),
    }))
  }

  const exportData = () => {
    try {
      // Создаем объект с текущими данными и метаданными
      const exportData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: fileSystem,
      }

      // Преобразуем данные в JSON-строку
      const jsonString = JSON.stringify(exportData, null, 2)

      // Создаем Blob с данными
      const blob = new Blob([jsonString], { type: "application/json" })

      // Создаем URL для скачивания
      const url = URL.createObjectURL(blob)

      // Создаем временную ссылку для скачивания
      const link = document.createElement("a")
      link.href = url
      link.download = `pingvim-data-${new Date().toISOString().slice(0, 10)}.json`

      // Добавляем ссылку в DOM, кликаем по ней и удаляем
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Освобождаем URL
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

          // Проверяем структуру данных
          if (importedData.data && Array.isArray(importedData.data.folders) && Array.isArray(importedData.data.files)) {
            // Обновляем состояние fileSystem
            setFileSystem(importedData.data)

            // Сбрасываем открытые файлы, так как их ID могут не совпадать
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

      // Сбрасываем значение input, чтобы можно было загрузить тот же файл повторно
      event.target.value = ""
    } catch (error) {
      console.error("Ошибка при импорте данных:", error)
      alert("Произошла ошибка при импорте данных")
    }
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
      setLeftPaneFiles((prev) => [...prev, fileId])

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

    // Get root folders (those with parentId === null)
    const rootFolders = fileSystem.folders.filter((folder) => folder.parentId === null)

    return (
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Notes</span>
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

  // Если проверка авторизации еще не выполнена, показываем пустой экран
  if (!authChecked) {
    return null
  }

  // Если пользователь не авторизован, показываем страницу авторизации
  if (!isAuthenticated) {
    const savedPassword = localStorage.getItem("pycharm-password") || "111"
    return <AuthPage onAuth={(success) => setIsAuthenticated(success)} defaultPassword={savedPassword} />
  }

  return (
    <div className="flex flex-col h-screen bg-[#2b2b2b] text-gray-300 overflow-hidden">
      {/* Top toolbar */}
      <div ref={toolbarRef} className="flex items-center text-sm h-10 bg-[#1B1C1F]">
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

          <div className="flex items-center px-1.5 py-1 hover:bg-[#2E436E] cursor-pointer">
            <span className="font-medium text-white">PingVim</span>
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
            <DropdownMenuContent align="end" className="bg-[#1B1C1F] border-gray-700 text-gray-300">
              <DropdownMenuItem
                onClick={() => setChangePasswordOpen(true)}
                className="hover:bg-[#2E436E] cursor-pointer focus:bg-[#2E436E] focus:text-gray-300"
              >
                Сменить пароль
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  localStorage.removeItem("pycharm-auth")
                  setIsAuthenticated(false)
                }}
                className="hover:bg-[#2E436E] cursor-pointer focus:bg-[#2E436E] focus:text-gray-300"
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
          className={`flex flex-col ease-in-out bg-[#1B1C1F]`}
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
                className="bg-[#1E1F22] text-sm border-none outline-none focus:ring-0 w-full h-6 px-2 text-gray-300 rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.15)] focus:shadow-[0_0_8px_rgba(46,67,110,0.3)] transition-shadow duration-200"
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
            <div className={`flex items-center ${sidebarCollapsed ? "w-full justify-center" : "space-x-1"}`}>
              <button
                className="p-1 hover:bg-gray-600 rounded"
                onClick={toggleSidebar}
                title={sidebarCollapsed ? "Развернуть панель" : "Свернуть панель"}
              >
                {sidebarCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className={`flex-1 overflow-auto bg-transparent ${sidebarCollapsed ? "hidden" : ""}`}>
            {searchTerm.trim() !== "" ? renderSearchResults() : renderFileExplorer()}
          </div>
        </div>

        {/* Добавить элемент для изменения размера */}
        <div
          id="sidebar-resizer"
          className="cursor-col-resize hover:bg-gray-500 active:bg-gray-400 z-10"
          style={{
            position: "relative",
            width: "6px",
            margin: "0 -3px",
            background: "#1E1F22",
            opacity: sidebarCollapsed ? 0 : 0.8,
            pointerEvents: sidebarCollapsed ? "none" : "auto",
          }}
        />

        {/* Main content area */}
        <div ref={contentAreaRef} className="flex-1 flex flex-col">
          {/* Split view container */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left pane */}
            <div ref={leftPaneRef} className="flex flex-col" style={{ width: splitView ? `${splitRatio}%` : "100%" }}>
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
                  <div className="flex items-center justify-center h-full text-gray-500 bg-[#1E1F22]">
                    <p>Select a file to edit</p>
                  </div>
                )}
              </div>
            </div>

            {/* Split resizer (only shown in split view) */}
            {splitView && (
              <div
                id="split-resizer"
                className="w-[3px] cursor-col-resize hover:bg-gray-500 active:bg-gray-400 z-10"
                style={{
                  background: "#1E1F22",
                  opacity: 0.8,
                }}
              />
            )}

            {/* Right pane (only shown in split view) */}
            {splitView && (
              <div ref={rightPaneRef} className="flex flex-col" style={{ width: `${100 - splitRatio}%` }}>
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
                    <div className="flex items-center justify-center h-full text-gray-500 bg-[#1E1F22]">
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

      {/* Settings Menu */}
      {settingsOpen && (
        <div
          className="fixed z-50 bg-[#1B1C1F] border border-gray-700 p-3 rounded-md w-64"
          style={{
            top: settingsButtonRef.current ? settingsButtonRef.current.getBoundingClientRect().bottom + 5 : 0,
            right: settingsButtonRef.current
              ? window.innerWidth - settingsButtonRef.current.getBoundingClientRect().right
              : 0,
            fontSize: "13px",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Font Size: {fontSize}px</span>
              </div>
              <div className="mt-2">
                <input
                  type="range"
                  min="8"
                  max="30"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number.parseInt(e.target.value))}
                  className="w-full h-2 bg-[#2b2b2b] rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: "#2E436E",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="bg-[#1B1C1F] border-gray-700 text-gray-300 p-0">
          <DialogHeader className="p-4 border-b border-gray-700">
            <DialogTitle>Сменить пароль</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Текущий пароль</label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Введите текущий пароль"
                autoFocus
                className="bg-[#2b2b2b] border-gray-700 text-gray-300"
              />
            </div>
            <div className={disablePassword ? "opacity-50" : ""}>
              <label className="text-sm text-gray-400 mb-1 block">Новый пароль</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Введите новый пароль"
                disabled={disablePassword}
                className="bg-[#2b2b2b] border-gray-700 text-gray-300"
              />
            </div>
            <div className={disablePassword ? "opacity-50" : ""}>
              <label className="text-sm text-gray-400 mb-1 block">Подтвердите пароль</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите новый пароль"
                disabled={disablePassword}
                className="bg-[#2b2b2b] border-gray-700 text-gray-300"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="disable-password"
                checked={disablePassword}
                onChange={(e) => {
                  setDisablePassword(e.target.checked)
                  if (e.target.checked) {
                    setNewPassword("")
                    setConfirmPassword("")
                  }
                }}
                className="rounded bg-[#2b2b2b] border-gray-700 text-[#2E436E] focus:ring-[#2E436E]"
              />
              <label htmlFor="disable-password" className="text-sm text-gray-300">
                Отключить защиту паролем
              </label>
            </div>
            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
          </div>
          <DialogFooter className="p-4 border-t border-gray-700 bg-[#1B1C1F]">
            <Button
              variant="outline"
              onClick={() => {
                setChangePasswordOpen(false)
                setOldPassword("")
                setNewPassword("")
                setConfirmPassword("")
                setPasswordError("")
                setDisablePassword(false)
              }}
              className="bg-[#4b4b4b] text-gray-300 border-gray-700 hover:bg-[#5a5a5a]"
            >
              Отмена
            </Button>
            <Button onClick={handleChangePassword} className="bg-[#2E436E] text-white hover:bg-[#3A5488]">
              {disablePassword ? "Отключить пароль" : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Item Dialog */}
      <Dialog open={newItemDialogOpen} onOpenChange={setNewItemDialogOpen}>
        <DialogContent className="bg-[#1B1C1F] border-gray-700 text-gray-300 p-0">
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
          <DialogFooter className="p-4 border-t border-gray-700 bg-[#1B1C1F]">
            <Button
              variant="outline"
              onClick={() => setNewItemDialogOpen(false)}
              className="bg-[#4b4b4b] text-gray-300 border-gray-700 hover:bg-[#5a5a5a]"
            >
              Cancel
            </Button>
            <Button onClick={createNewItem} className="bg-[#2E436E] text-white hover:bg-[#3A5488]">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="bg-[#1B1C1F] border-gray-700 text-gray-300 p-0">
          <DialogHeader className="p-4 border-b border-gray-700">
            <DialogTitle>Rename {itemToRename?.type === "file" ? "File" : "Folder"}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              autoFocus
              className="bg-[#2b2b2b] border-gray-700 text-gray-300"
            />
          </div>
          <DialogFooter className="p-4 border-t border-gray-700 bg-[#1B1C1F]">
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              className="bg-[#4b4b4b] text-gray-300 border-gray-700 hover:bg-[#5a5a5a]"
            >
              Cancel
            </Button>
            <Button onClick={renameItem} className="bg-[#2E436E] text-white hover:bg-[#3A5488]">
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-[#1B1C1F] border-gray-700 text-gray-300 p-0">
          <DialogHeader className="p-4 border-b border-gray-700">
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>Are you sure you want to delete this {itemToDelete?.type}?</p>
            {itemToDelete?.type === "folder" && (
              <p className="text-red-400 mt-2">Warning: This will delete all files and folders inside.</p>
            )}
          </div>
          <DialogFooter className="p-4 border-t border-gray-700 bg-[#1B1C1F]">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="bg-[#4b4b4b] text-gray-300 border-gray-700 hover:bg-[#5a5a5a]"
            >
              Cancel
            </Button>
            <Button onClick={deleteItem} className="bg-[#ff5370] text-white hover:bg-[#ff3860]">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

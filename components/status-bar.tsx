"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { fileSystemAPI } from "@/lib/api-service"
import { Database } from "lucide-react"

export default function StatusBar() {
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string }>({
    connected: false,
    message: "Checking connection...",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const contextMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true)
        const status = await fileSystemAPI.checkConnection()
        setDbStatus(status)
      } catch (error) {
        setDbStatus({
          connected: false,
          message: error instanceof Error ? error.message : "Failed to check connection",
        })
      } finally {
        setIsLoading(false)
        setLastUpdateTime(new Date())
      }
    }

    // Проверяем подключение при загрузке компонента
    checkConnection()

    // Проверяем подключение каждые 30 секунд
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Update the handleContextMenu function to check screen boundaries
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()

    // Get viewport dimensions
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    // Estimate menu height (we'll use 150px as a safe value)
    const estimatedMenuHeight = 150

    // Calculate position
    let x = e.clientX
    let y = e.clientY

    // Check if menu would go off the bottom of the screen
    if (y + estimatedMenuHeight > viewportHeight) {
      // Position menu above the cursor
      y = y - estimatedMenuHeight
    }

    // Check if menu would go off the right of the screen
    if (x + 200 > viewportWidth) {
      x = viewportWidth - 210
    }

    setContextMenuPosition({ x, y })
    setShowContextMenu(true)
  }

  // Format the last update time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <div className="flex items-center justify-between bg-[#1B1C1F] px-2 py-1 text-xs text-gray-400">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1 cursor-context-menu" onContextMenu={handleContextMenu}>
          <Database
            className={`h-3 w-3 ${dbStatus.connected ? "text-green-500" : "text-gray-400"}`}
            style={{
              filter: dbStatus.connected ? "drop-shadow(0 0 2px rgb(34 197 94 / 0.8))" : "none",
              transition: "all 0.3s ease",
            }}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <span>Demo</span>
        <span>Version: v3.03</span>
      </div>

      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-[#1B1C1F] border border-gray-700 rounded shadow-lg p-2 z-50 text-xs"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
            minWidth: "200px",
          }}
        >
          <div className="font-bold mb-1 pb-1 border-b border-gray-700">Database Status</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={dbStatus.connected ? "text-green-500" : "text-red-500"}>
                {dbStatus.connected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Message:</span>
              <span>{dbStatus.message}</span>
            </div>
            <div className="flex justify-between">
              <span>Last checked:</span>
              <span>{formatTime(lastUpdateTime)}</span>
            </div>
            {isLoading && <div className="text-center text-yellow-500 mt-1">Checking connection...</div>}
          </div>
        </div>
      )}
    </div>
  )
}

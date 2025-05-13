"use client"

import { useEffect, useState } from "react"
import { fileSystemAPI } from "@/lib/api-service"
import { Database } from "lucide-react"

export default function StatusBar() {
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string }>({
    connected: false,
    message: "Checking connection...",
  })
  const [isLoading, setIsLoading] = useState(true)

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
      }
    }

    // Проверяем подключение при загрузке компонента
    checkConnection()

    // Проверяем подключение каждые 30 секунд
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-between bg-[#1B1C1F] px-2 py-1 text-xs text-gray-400">
      <div className="flex items-center space-x-4">
        <span>UTF-8</span>
        <span>LF</span>
        <span>PingVim</span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Database
            className={`h-3 w-3 ${dbStatus.connected ? "text-green-500" : "text-gray-400"}`}
            style={{
              filter: dbStatus.connected ? "drop-shadow(0 0 2px rgb(34 197 94 / 0.8))" : "none",
              transition: "all 0.3s ease",
            }}
          />
        </div>
        <span>Demo</span>
        <span>Version: v3.03</span>
      </div>
    </div>
  )
}

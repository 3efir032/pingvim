"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Database, Save } from "lucide-react"

export default function DbInitializer({ onUseLocalStorage }: { onUseLocalStorage: () => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [timestamp, setTimestamp] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<string | null>(null)

  const initializeDb = async () => {
    try {
      setStatus("loading")
      setMessage("Подключение к базе данных...")
      setDetailedError(null)

      const response = await fetch("/api/init-db", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      // Проверяем статус ответа
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Ошибка сервера: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`)
      }

      // Проверяем тип контента перед парсингом JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Сервер вернул не JSON:", text)
        throw new Error(`Сервер вернул не JSON: ${text.substring(0, 100)}...`)
      }

      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage("База данных успешно инициализирована")
        setTimestamp(data.timestamp)
      } else {
        setStatus("error")
        setMessage(`Ошибка: ${data.error || "Неизвестная ошибка"}`)
        setDetailedError(data.error || "Неизвестная ошибка")
      }
    } catch (error) {
      setStatus("error")
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка"
      setMessage(`Ошибка подключения к базе данных`)
      setDetailedError(errorMessage)
      console.error("Ошибка при инициализации базы данных:", error)
    }
  }

  useEffect(() => {
    // Автоматически инициализируем базу данных при загрузке компонента
    initializeDb()
  }, [])

  return (
    <div className="p-4 bg-[#1B1C1F] border border-gray-700 rounded-md">
      <div className="flex items-center mb-4">
        <Database className="h-5 w-5 mr-2 text-[#2E436E]" />
        <h2 className="text-lg font-medium">Статус базы данных</h2>
      </div>

      <div className="mb-4">
        {status === "loading" && (
          <div className="flex items-center text-yellow-400">
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
            {message}
          </div>
        )}

        {status === "success" && (
          <div className="flex items-center text-green-400">
            <CheckCircle className="h-4 w-4 mr-2" />
            {message}
            {timestamp && <span className="ml-2 text-xs text-gray-400">({new Date(timestamp).toLocaleString()})</span>}
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="flex items-center text-red-400">
              <AlertCircle className="h-4 w-4 mr-2" />
              {message}
            </div>
            {detailedError && (
              <div className="mt-2 p-2 bg-[#2b2b2b] rounded text-xs text-red-300 overflow-auto max-h-32">
                {detailedError}
              </div>
            )}
            <div className="mt-2 text-xs text-gray-400">
              Проверьте параметры подключения к базе данных и убедитесь, что сервер PostgreSQL доступен.
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <Button
          onClick={initializeDb}
          disabled={status === "loading"}
          className="bg-[#2E436E] hover:bg-[#3A5488] text-white"
        >
          {status === "loading" ? "Подключение..." : "Повторить подключение"}
        </Button>

        <Button onClick={onUseLocalStorage} className="bg-[#4b4b4b] hover:bg-[#5a5a5a] text-white">
          <Save className="h-4 w-4 mr-2" />
          Использовать локальное хранилище
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Database, Save, Settings } from "lucide-react"
import DatabaseConnectionForm from "./database-connection-form"

interface DbInitializerProps {
  onUseLocalStorage: () => void
}

export default function DbInitializer({ onUseLocalStorage }: DbInitializerProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [timestamp, setTimestamp] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<string | null>(null)
  const [showConnectionForm, setShowConnectionForm] = useState(false)
  const [connectionString, setConnectionString] = useState<string>("")

  const initializeDb = async (customConnectionString?: string) => {
    try {
      setStatus("loading")
      setMessage("Подключение к базе данных...")
      setDetailedError(null)

      // Если передана пользовательская строка подключения, сохраняем её
      if (customConnectionString) {
        // В реальном приложении здесь должна быть логика для безопасного сохранения строки подключения
        // Например, через API-запрос к серверу
        setConnectionString(customConnectionString)
      }

      const response = await fetch("/api/init-db", {
        method: "POST", // Изменено на POST для передачи строки подключения
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          connectionString: customConnectionString || undefined,
        }),
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
        setShowConnectionForm(false) // Скрываем форму при успешном подключении
      } else {
        setStatus("error")
        setMessage(`Ошибка: ${data.error || "Неизвестная ошибка"}`)
        setDetailedError(data.error || "Неизвестная ошибка")
      }

      return { success: data.success, message: data.error || "Успешное подключение" }
    } catch (error) {
      setStatus("error")
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка"
      setMessage(`Ошибка подключения к базе данных`)
      setDetailedError(errorMessage)
      console.error("Ошибка при инициализации базы данных:", error)

      return { success: false, message: errorMessage }
    }
  }

  useEffect(() => {
    // Автоматически инициализируем базу данных при загрузке компонента
    initializeDb()
  }, [])

  const handleManualConnect = async (connString: string) => {
    return await initializeDb(connString)
  }

  return (
    <div className="p-4 bg-[#1B1C1F] border border-gray-700 rounded-md">
      {!showConnectionForm ? (
        <>
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
                {timestamp && (
                  <span className="ml-2 text-xs text-gray-400">({new Date(timestamp).toLocaleString()})</span>
                )}
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
              onClick={() => initializeDb()}
              disabled={status === "loading"}
              className="bg-[#2E436E] hover:bg-[#3A5488] text-white"
            >
              {status === "loading" ? "Подключение..." : "Повторить подключение"}
            </Button>

            <Button onClick={() => setShowConnectionForm(true)} className="bg-[#4b4b4b] hover:bg-[#5a5a5a] text-white">
              <Settings className="h-4 w-4 mr-2" />
              Настроить подключение
            </Button>

            <Button onClick={onUseLocalStorage} className="bg-[#4b4b4b] hover:bg-[#5a5a5a] text-white">
              <Save className="h-4 w-4 mr-2" />
              Использовать локальное хранилище
            </Button>
          </div>
        </>
      ) : (
        <DatabaseConnectionForm
          onConnect={handleManualConnect}
          onCancel={() => setShowConnectionForm(false)}
          onUseLocalStorage={onUseLocalStorage}
          defaultConnectionString={connectionString}
        />
      )}
    </div>
  )
}

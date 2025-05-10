"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Database, Save, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ConnectionStatusProps {
  status: "connected" | "error" | "local" | "connecting"
  lastError?: string | null
  lastErrorTime?: Date | null
  onRetryConnection: () => void
  onSwitchToLocalStorage: () => void
}

export default function ConnectionStatus({
  status,
  lastError,
  lastErrorTime,
  onRetryConnection,
  onSwitchToLocalStorage,
}: ConnectionStatusProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Автоматически скрываем детали через 10 секунд
  useEffect(() => {
    if (showDetails) {
      const timer = setTimeout(() => {
        setShowDetails(false)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [showDetails])

  // Если статус "connected" или "connecting", не показываем компонент
  if (status === "connected" || status === "connecting") {
    return null
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 max-w-md">
      <Alert
        variant={status === "error" ? "destructive" : status === "local" ? "warning" : "default"}
        className="bg-[#1B1C1F] border-gray-700 text-gray-300"
      >
        <div className="flex items-start">
          {status === "error" ? (
            <AlertCircle className="h-4 w-4 mt-0.5" />
          ) : status === "local" ? (
            <Save className="h-4 w-4 mt-0.5" />
          ) : (
            <Database className="h-4 w-4 mt-0.5" />
          )}
          <div className="ml-2 flex-1">
            <AlertTitle className="mb-1">
              {status === "error"
                ? "Ошибка подключения к базе данных"
                : status === "local"
                  ? "Используется локальное хранилище"
                  : "Статус подключения"}
            </AlertTitle>
            <AlertDescription className="text-sm">
              {status === "error"
                ? "Не удалось подключиться к базе данных. Данные сохраняются локально."
                : status === "local"
                  ? "Данные сохраняются только в браузере и будут потеряны при очистке кэша."
                  : "Проверка подключения к базе данных..."}

              {lastError && showDetails && (
                <div className="mt-2 p-2 bg-[#2b2b2b] rounded text-xs text-gray-300 overflow-auto max-h-32">
                  <p className="font-semibold">Последняя ошибка:</p>
                  <p className="mt-1">{lastError}</p>
                  {lastErrorTime && (
                    <p className="mt-1 text-gray-400">
                      {lastErrorTime.toLocaleTimeString()} {lastErrorTime.toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {status === "error" && (
                  <Button
                    size="sm"
                    className="bg-[#2E436E] hover:bg-[#3A5488] text-xs h-7 px-2"
                    onClick={onRetryConnection}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Повторить подключение
                  </Button>
                )}

                {status === "error" && lastError && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 text-xs h-7 px-2"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? "Скрыть детали" : "Показать детали"}
                  </Button>
                )}

                {status === "error" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 text-xs h-7 px-2"
                    onClick={onSwitchToLocalStorage}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Использовать локальное хранилище
                  </Button>
                )}

                {status === "local" && (
                  <Button
                    size="sm"
                    className="bg-[#2E436E] hover:bg-[#3A5488] text-xs h-7 px-2"
                    onClick={onRetryConnection}
                  >
                    <Database className="h-3 w-3 mr-1" />
                    Подключиться к базе данных
                  </Button>
                )}
              </div>
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  )
}

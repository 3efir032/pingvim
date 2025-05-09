"use client"

import { useState, useEffect } from "react"
import { Database, ServerOffIcon as DatabaseOff, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DbStatusProps {
  onOpenConnectionDialog: () => void
  onStatusChange: (connected: boolean) => void
}

export default function DbStatus({ onOpenConnectionDialog, onStatusChange }: DbStatusProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      // Добавляем случайный параметр запроса для предотвращения кэширования
      const response = await fetch(`/api/db/status?_=${Date.now()}`)

      // Проверяем, что ответ успешный
      if (!response.ok) {
        console.error("Ошибка при проверке статуса:", response.status, response.statusText)
        setIsConnected(false)
        onStatusChange(false)
        setIsChecking(false)
        return
      }

      // Безопасно парсим JSON
      let result
      try {
        result = await response.json()
      } catch (parseError) {
        console.error("Ошибка парсинга JSON:", parseError)

        // Получаем текст ответа для отладки
        const responseText = await response.text()
        console.error("Текст ответа:", responseText)

        setIsConnected(false)
        onStatusChange(false)
        setIsChecking(false)
        return
      }

      setIsConnected(result.connected)
      onStatusChange(result.connected)
    } catch (error) {
      console.error("Ошибка проверки соединения с базой данных:", error)
      setIsConnected(false)
      onStatusChange(false)
    } finally {
      setIsChecking(false)
    }
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      const response = await fetch("/api/db/disconnect", {
        method: "POST",
      })

      if (!response.ok) {
        console.error("Ошибка при отключении:", response.status, response.statusText)
        setIsDisconnecting(false)
        return
      }

      setIsConnected(false)
      onStatusChange(false)
    } catch (error) {
      console.error("Ошибка отключения от базы данных:", error)
    } finally {
      setIsDisconnecting(false)
    }
  }

  useEffect(() => {
    // Добавляем небольшую задержку перед первой проверкой
    const timer = setTimeout(() => {
      checkConnection()
    }, 500)

    // Проверяем соединение каждые 30 секунд
    const interval = setInterval(checkConnection, 30000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex items-center space-x-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isConnected ? "text-green-500" : "text-gray-500"}`}
              onClick={isConnected ? handleDisconnect : onOpenConnectionDialog}
              disabled={isChecking || isDisconnecting}
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isConnected ? (
                <Database className="h-4 w-4" />
              ) : (
                <DatabaseOff className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-[#1B1C1F] text-gray-300 border-gray-700">
            {isConnected ? "Отключиться от базы данных" : "Подключиться к базе данных"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isConnected && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500"
                onClick={checkConnection}
                disabled={isChecking}
              >
                {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-[#1B1C1F] text-gray-300 border-gray-700">
              Проверить соединение
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

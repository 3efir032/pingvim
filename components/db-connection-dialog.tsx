"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import dbService, { type ConnectionStatus, type DbConfig, defaultDbConfig } from "@/services/db-service"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface DbConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnectionChange?: (connected: boolean) => void
}

export default function DbConnectionDialog({ open, onOpenChange, onConnectionChange }: DbConnectionDialogProps) {
  const [config, setConfig] = useState<DbConfig>({ ...defaultDbConfig })
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // Слушаем изменения статуса
  useEffect(() => {
    const removeListener = dbService.addStatusListener((newStatus, newError) => {
      setStatus(newStatus)
      setError(newError || "")
      if (onConnectionChange) {
        onConnectionChange(newStatus === "connected")
      }
    })

    return removeListener
  }, [onConnectionChange])

  // Проверяем статус при открытии
  useEffect(() => {
    if (open) {
      const checkStatus = async () => {
        await dbService.checkStatus()
      }
      checkStatus()
    }
  }, [open])

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      await dbService.connect(config)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      await dbService.disconnect()
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    setIsLoading(true)
    try {
      await dbService.checkStatus()
    } finally {
      setIsLoading(false)
    }
  }

  const renderStatusIcon = () => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "connecting":
        return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "disconnected":
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const renderStatusText = () => {
    switch (status) {
      case "connected":
        return "Подключено к базе данных"
      case "connecting":
        return "Подключение к базе данных..."
      case "error":
        return `Ошибка: ${error}`
      case "disconnected":
        return "Отключено от базы данных"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1B1C1F] border-gray-700 text-gray-300 p-0">
        <DialogHeader className="p-4 border-b border-gray-700">
          <DialogTitle>Подключение к базе данных</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-2 p-2 rounded bg-[#2b2b2b]">
            {renderStatusIcon()}
            <span className="text-sm">{renderStatusText()}</span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="host" className="text-sm text-gray-400 mb-1 block">
                  Хост
                </Label>
                <Input
                  id="host"
                  value={config.host}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  disabled={status === "connected" || status === "connecting"}
                  className="bg-[#2b2b2b] border-gray-700 text-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="port" className="text-sm text-gray-400 mb-1 block">
                  Порт
                </Label>
                <Input
                  id="port"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: e.target.value })}
                  disabled={status === "connected" || status === "connecting"}
                  className="bg-[#2b2b2b] border-gray-700 text-gray-300"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="database" className="text-sm text-gray-400 mb-1 block">
                База данных
              </Label>
              <Input
                id="database"
                value={config.database}
                onChange={(e) => setConfig({ ...config, database: e.target.value })}
                disabled={status === "connected" || status === "connecting"}
                className="bg-[#2b2b2b] border-gray-700 text-gray-300"
              />
            </div>

            <div>
              <Label htmlFor="user" className="text-sm text-gray-400 mb-1 block">
                Пользователь
              </Label>
              <Input
                id="user"
                value={config.user}
                onChange={(e) => setConfig({ ...config, user: e.target.value })}
                disabled={status === "connected" || status === "connecting"}
                className="bg-[#2b2b2b] border-gray-700 text-gray-300"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm text-gray-400 mb-1 block">
                Пароль
              </Label>
              <Input
                id="password"
                type="password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                disabled={status === "connected" || status === "connecting"}
                className="bg-[#2b2b2b] border-gray-700 text-gray-300"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="p-4 border-t border-gray-700 bg-[#1B1C1F]">
          <Button
            variant="outline"
            onClick={handleCheckStatus}
            disabled={isLoading}
            className="bg-[#4b4b4b] text-gray-300 border-gray-700 hover:bg-[#5a5a5a]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Проверить статус
          </Button>
          {status === "connected" ? (
            <Button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="bg-[#ff5370] text-white hover:bg-[#ff3860]"
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Отключиться
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isLoading || status === "connecting"}
              className="bg-[#2E436E] text-white hover:bg-[#3A5488]"
            >
              {isLoading || status === "connecting" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Подключиться
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

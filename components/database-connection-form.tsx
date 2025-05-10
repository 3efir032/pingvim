"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Database, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DatabaseConnectionFormProps {
  onConnect: (connectionString: string) => Promise<{ success: boolean; message: string }>
  onCancel: () => void
  onUseLocalStorage: () => void
  defaultConnectionString?: string
}

export default function DatabaseConnectionForm({
  onConnect,
  onCancel,
  onUseLocalStorage,
  defaultConnectionString = "",
}: DatabaseConnectionFormProps) {
  const [connectionMode, setConnectionMode] = useState<"string" | "params">("string")
  const [connectionString, setConnectionString] = useState(defaultConnectionString)
  const [host, setHost] = useState("localhost")
  const [port, setPort] = useState("5432")
  const [database, setDatabase] = useState("postgres")
  const [username, setUsername] = useState("postgres")
  const [password, setPassword] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Функция для построения строки подключения из параметров
  const buildConnectionString = (): string => {
    return `postgresql://${username}:${password}@${host}:${port}/${database}`
  }

  // Функция для разбора строки подключения на параметры
  const parseConnectionString = (connString: string) => {
    try {
      // Простой парсер для строки подключения PostgreSQL
      // postgresql://username:password@host:port/database
      const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
      const match = connString.match(regex)

      if (match) {
        setUsername(match[1])
        setPassword(match[2])
        setHost(match[3])
        setPort(match[4])
        setDatabase(match[5])
        return true
      }
      return false
    } catch (error) {
      console.error("Ошибка при разборе строки подключения:", error)
      return false
    }
  }

  // Обработчик переключения режима ввода
  const handleModeChange = (mode: "string" | "params") => {
    if (mode === "params" && connectionMode === "string") {
      // При переключении со строки на параметры, пробуем разобрать строку
      if (connectionString && !parseConnectionString(connectionString)) {
        setError("Не удалось разобрать строку подключения. Проверьте формат.")
        return
      }
    } else if (mode === "string" && connectionMode === "params") {
      // При переключении с параметров на строку, строим строку подключения
      setConnectionString(buildConnectionString())
    }

    setConnectionMode(mode)
    setError(null)
  }

  // Обработчик подключения
  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      setError(null)

      const connString = connectionMode === "string" ? connectionString : buildConnectionString()

      if (!connString) {
        setError("Строка подключения не может быть пустой")
        setIsConnecting(false)
        return
      }

      const result = await onConnect(connString)

      if (!result.success) {
        setError(result.message)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Произошла ошибка при подключении")
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Database className="h-5 w-5 mr-2 text-[#2E436E]" />
        <h2 className="text-lg font-medium">Настройка подключения к базе данных</h2>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex space-x-2 mb-4">
        <Button
          variant={connectionMode === "string" ? "default" : "outline"}
          onClick={() => handleModeChange("string")}
          className={connectionMode === "string" ? "bg-[#2E436E] hover:bg-[#3A5488]" : ""}
        >
          Строка подключения
        </Button>
        <Button
          variant={connectionMode === "params" ? "default" : "outline"}
          onClick={() => handleModeChange("params")}
          className={connectionMode === "params" ? "bg-[#2E436E] hover:bg-[#3A5488]" : ""}
        >
          Параметры подключения
        </Button>
      </div>

      {connectionMode === "string" ? (
        <div className="space-y-2">
          <Label htmlFor="connection-string">Строка подключения PostgreSQL</Label>
          <Input
            id="connection-string"
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
            placeholder="postgresql://username:password@host:port/database"
            className="bg-[#2b2b2b] border-gray-700 text-gray-300"
          />
          <p className="text-xs text-gray-400">Пример: postgresql://postgres:password@localhost:5432/postgres</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">Хост</Label>
              <Input
                id="host"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="localhost"
                className="bg-[#2b2b2b] border-gray-700 text-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Порт</Label>
              <Input
                id="port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="5432"
                className="bg-[#2b2b2b] border-gray-700 text-gray-300"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="database">База данных</Label>
            <Input
              id="database"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              placeholder="postgres"
              className="bg-[#2b2b2b] border-gray-700 text-gray-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Имя пользователя</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="postgres"
              className="bg-[#2b2b2b] border-gray-700 text-gray-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-[#2b2b2b] border-gray-700 text-gray-300"
            />
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <div>
          <Button variant="outline" onClick={onUseLocalStorage} className="bg-[#4b4b4b] hover:bg-[#5a5a5a] text-white">
            <Save className="h-4 w-4 mr-2" />
            Использовать локальное хранилище
          </Button>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel} className="bg-[#4b4d54] hover:bg-[#3f4244] text-gray-300">
            Отмена
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-[#2E436E] hover:bg-[#3A5488] text-white"
          >
            {isConnecting ? "Подключение..." : "Подключиться"}
          </Button>
        </div>
      </div>
    </div>
  )
}

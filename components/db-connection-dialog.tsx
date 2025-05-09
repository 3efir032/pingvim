"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import type { DbConfig } from "@/lib/db-types"

interface DbConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected: () => void
}

export default function DbConnectionDialog({ open, onOpenChange, onConnected }: DbConnectionDialogProps) {
  const [config, setConfig] = useState<DbConfig>({
    host: "localhost",
    port: 5432,
    database: "pingvim",
    user: "postgres",
    password: "postgres",
    ssl: false,
  })

  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleInputChange = (field: keyof DbConfig, value: string | number | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleTestConnection = async () => {
    setTestLoading(true)
    setTestResult(null)
    setError(null)

    try {
      const response = await fetch("/api/db/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Ошибка при тестировании соединения:", response.status, response.statusText, errorText)
        setTestResult({
          success: false,
          message: `Ошибка сервера: ${response.status} ${response.statusText}`,
        })
        setTestLoading(false)
        return
      }

      const result = await response.json()
      setTestResult(result)
    } catch (err) {
      console.error("Ошибка при проверке соединения:", err)
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Неизвестная ошибка при проверке соединения",
      })
    } finally {
      setTestLoading(false)
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/db/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Ошибка при подключении:", response.status, response.statusText, errorText)
        setError(`Ошибка сервера: ${response.status} ${response.statusText}`)
        setLoading(false)
        return
      }

      const result = await response.json()

      if (result.success) {
        // Сохраняем конфигурацию в localStorage
        localStorage.setItem("pycharm-db-config", JSON.stringify(config))
        onConnected()
        onOpenChange(false)
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error("Ошибка при подключении к базе данных:", err)
      setError(err instanceof Error ? err.message : "Неизвестная ошибка при подключении к базе данных")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1B1C1F] border-gray-700 text-gray-300 p-0">
        <DialogHeader className="p-4 border-b border-gray-700">
          <DialogTitle>Подключение к PostgreSQL</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-400 mb-1 block">Хост</Label>
              <Input
                value={config.host}
                onChange={(e) => handleInputChange("host", e.target.value)}
                placeholder="localhost"
                className="bg-[#2b2b2b] border-gray-700 text-gray-300"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-400 mb-1 block">Порт</Label>
              <Input
                type="number"
                value={config.port}
                onChange={(e) => handleInputChange("port", Number.parseInt(e.target.value) || 5432)}
                placeholder="5432"
                className="bg-[#2b2b2b] border-gray-700 text-gray-300"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-400 mb-1 block">База данных</Label>
            <Input
              value={config.database}
              onChange={(e) => handleInputChange("database", e.target.value)}
              placeholder="my_database"
              className="bg-[#2b2b2b] border-gray-700 text-gray-300"
            />
          </div>
          <div>
            <Label className="text-sm text-gray-400 mb-1 block">Пользователь</Label>
            <Input
              value={config.user}
              onChange={(e) => handleInputChange("user", e.target.value)}
              placeholder="postgres"
              className="bg-[#2b2b2b] border-gray-700 text-gray-300"
            />
          </div>
          <div>
            <Label className="text-sm text-gray-400 mb-1 block">Пароль</Label>
            <Input
              type="password"
              value={config.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="********"
              className="bg-[#2b2b2b] border-gray-700 text-gray-300"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ssl"
              checked={config.ssl}
              onCheckedChange={(checked) => handleInputChange("ssl", checked === true)}
              className="rounded bg-[#2b2b2b] border-gray-700 text-[#2E436E] focus:ring-[#2E436E]"
            />
            <Label htmlFor="ssl" className="text-sm text-gray-300">
              Использовать SSL
            </Label>
          </div>

          {testResult && (
            <div
              className={`p-2 rounded ${testResult.success ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"}`}
            >
              {testResult.message}
            </div>
          )}

          {error && <div className="p-2 rounded bg-red-900/20 text-red-400">{error}</div>}

          <div className="p-2 rounded bg-yellow-900/20 text-yellow-400">
            Примечание: В режиме предпросмотра используется имитация базы данных. В реальном приложении необходимо
            настроить серверную часть.
          </div>
        </div>
        <DialogFooter className="p-4 border-t border-gray-700 bg-[#1B1C1F]">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testLoading || loading}
            className="bg-[#4b4b4b] text-gray-300 border-gray-700 hover:bg-[#5a5a5a]"
          >
            {testLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Проверка...
              </>
            ) : (
              "Проверить соединение"
            )}
          </Button>
          <Button
            onClick={handleConnect}
            disabled={loading || testLoading}
            className="bg-[#2E436E] text-white hover:bg-[#3A5488]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Подключение...
              </>
            ) : (
              "Подключиться"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

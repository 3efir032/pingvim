"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { dbService, type DbConfig } from "@/services/database-service"
import { storageManager } from "@/services/storage-manager"
import { Loader2 } from "lucide-react"

interface DatabaseConfigProps {
  onClose: () => void
}

export default function DatabaseConfig({ onClose }: DatabaseConfigProps) {
  const [config, setConfig] = useState<DbConfig>({
    host: "",
    port: 3306,
    user: "",
    password: "",
    database: "",
    enabled: false,
  })

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)

  useEffect(() => {
    // Load existing config if available
    const savedConfig = dbService.getConfig()
    if (savedConfig) {
      setConfig(savedConfig)
    }
  }, [])

  const handleChange = (field: keyof DbConfig, value: string | number | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
    // Clear test result when config changes
    setTestResult(null)
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const result = await dbService.testConnection(config)
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = () => {
    setIsSaving(true)

    try {
      dbService.saveConfig(config)

      // If database is enabled, set storage type to database
      if (config.enabled) {
        storageManager.setStorageType("database")
      } else {
        storageManager.setStorageType("local")
      }

      onClose()
    } catch (error) {
      console.error("Failed to save database config:", error)
      alert("Failed to save database configuration")
    } finally {
      setIsSaving(false)
    }
  }

  const handleMigrateToDatabase = async () => {
    if (!config.enabled) {
      alert("Please enable database connection first")
      return
    }

    setIsMigrating(true)

    try {
      const success = await storageManager.migrateToDatabase()
      if (success) {
        alert("Data successfully migrated to database")
      } else {
        alert("Failed to migrate data to database")
      }
    } catch (error) {
      console.error("Migration error:", error)
      alert("An error occurred during migration")
    } finally {
      setIsMigrating(false)
    }
  }

  const handleMigrateToLocal = async () => {
    setIsMigrating(true)

    try {
      const success = await storageManager.migrateToLocal()
      if (success) {
        alert("Data successfully migrated to local storage")
      } else {
        alert("Failed to migrate data to local storage")
      }
    } catch (error) {
      console.error("Migration error:", error)
      alert("An error occurred during migration")
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center space-x-2">
        <Switch
          id="db-enabled"
          checked={config.enabled}
          onCheckedChange={(checked) => handleChange("enabled", checked)}
        />
        <Label htmlFor="db-enabled">Enable Database Storage</Label>
      </div>

      <div className={config.enabled ? "" : "opacity-50 pointer-events-none"}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="db-host">Host</Label>
            <Input
              id="db-host"
              value={config.host}
              onChange={(e) => handleChange("host", e.target.value)}
              placeholder="localhost"
              className="bg-[#2b2b2b] border-gray-700 text-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="db-port">Port</Label>
            <Input
              id="db-port"
              type="number"
              value={config.port}
              onChange={(e) => handleChange("port", Number.parseInt(e.target.value) || 3306)}
              placeholder="3306"
              className="bg-[#2b2b2b] border-gray-700 text-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="db-user">Username</Label>
            <Input
              id="db-user"
              value={config.user}
              onChange={(e) => handleChange("user", e.target.value)}
              placeholder="root"
              className="bg-[#2b2b2b] border-gray-700 text-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="db-password">Password</Label>
            <Input
              id="db-password"
              type="password"
              value={config.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="bg-[#2b2b2b] border-gray-700 text-gray-300"
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="db-name">Database Name</Label>
            <Input
              id="db-name"
              value={config.database}
              onChange={(e) => handleChange("database", e.target.value)}
              placeholder="pingvim"
              className="bg-[#2b2b2b] border-gray-700 text-gray-300"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <Button
            onClick={handleTestConnection}
            disabled={isTesting}
            variant="outline"
            className="bg-[#4b4b4b] text-gray-300 border-gray-700 hover:bg-[#5a5a5a]"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>

          <div className="flex space-x-2">
            <Button
              onClick={handleMigrateToLocal}
              disabled={isMigrating}
              variant="outline"
              className="bg-[#4b4b4b] text-gray-300 border-gray-700 hover:bg-[#5a5a5a]"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                "Migrate DB → Local"
              )}
            </Button>

            <Button
              onClick={handleMigrateToDatabase}
              disabled={isMigrating || !config.enabled}
              variant="outline"
              className="bg-[#4b4b4b] text-gray-300 border-gray-700 hover:bg-[#5a5a5a]"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                "Migrate Local → DB"
              )}
            </Button>
          </div>
        </div>

        {testResult && (
          <div className={`mt-4 p-3 rounded ${testResult.success ? "bg-green-900/30" : "bg-red-900/30"}`}>
            <p className={testResult.success ? "text-green-400" : "text-red-400"}>{testResult.message}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-700">
        <Button
          onClick={onClose}
          variant="outline"
          className="bg-[#4b4b4b] text-gray-300 border-gray-700 hover:bg-[#5a5a5a]"
        >
          Cancel
        </Button>

        <Button onClick={handleSave} disabled={isSaving} className="bg-[#2E436E] text-white hover:bg-[#3A5488]">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Configuration"
          )}
        </Button>
      </div>
    </div>
  )
}

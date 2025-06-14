"use client"

import { useTheme } from "@/contexts/theme-context"
import { useEffect, useState } from "react"
import { Database } from "lucide-react"

export default function StatusBar() {
  const { theme } = useTheme()

  const [showDbConfig, setShowDbConfig] = useState(false)
  const [dbConfig, setDbConfig] = useState({
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
  })

  const [dbStatus, setDbStatus] = useState({ connected: false })

  const saveDbConfig = () => {
    // Сохраняем конфигурацию в localStorage
    localStorage.setItem("db-config", JSON.stringify(dbConfig))
    setShowDbConfig(false)
    // Можно добавить логику для переподключения к БД
  }

  useEffect(() => {
    const savedConfig = localStorage.getItem("db-config")
    if (savedConfig) {
      setDbConfig(JSON.parse(savedConfig))
    }
  }, [])

  const handleDbIconClick = () => {
    setShowDbConfig(true)
  }

  return (
    <div
      className={`flex items-center justify-between ${theme === "dark" ? "bg-[#1B1C1F] text-gray-400" : "bg-[#F0F0F0] text-gray-600"} px-2 py-1 text-xs`}
    >
      <div className="flex items-center space-x-4">
        <span>UTF-8</span>
        <span>LF</span>
        <span>PingVim</span>
        <div className="flex items-center space-x-1 cursor-pointer" onClick={handleDbIconClick}>
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
        <span>Version: v2.29</span>
      </div>
      {showDbConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1B1C1F] border border-gray-700 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-white">Database Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Host</label>
                <input
                  type="text"
                  value={dbConfig.host}
                  onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                  className="w-full bg-[#2b2b2b] border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="localhost"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Port</label>
                <input
                  type="text"
                  value={dbConfig.port}
                  onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
                  className="w-full bg-[#2b2b2b] border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="5432"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Database</label>
                <input
                  type="text"
                  value={dbConfig.database}
                  onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                  className="w-full bg-[#2b2b2b] border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="pingvim"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Username</label>
                <input
                  type="text"
                  value={dbConfig.username}
                  onChange={(e) => setDbConfig({ ...dbConfig, username: e.target.value })}
                  className="w-full bg-[#2b2b2b] border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="postgres"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={dbConfig.password}
                  onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                  className="w-full bg-[#2b2b2b] border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDbConfig(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button onClick={saveDbConfig} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

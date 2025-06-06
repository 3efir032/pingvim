"use client"

import { useTheme } from "@/contexts/theme-context"

export default function StatusBar() {
  const { theme } = useTheme()

  return (
    <div
      className={`flex items-center justify-between ${theme === "dark" ? "bg-[#1B1C1F] text-gray-400" : "bg-[#F0F0F0] text-gray-600"} px-2 py-1 text-xs`}
    >
      <div className="flex items-center space-x-4">
        <span>UTF-8</span>
        <span>LF</span>
        <span>PingVim</span>
      </div>

      <div className="flex items-center space-x-4">
        <span>Demo</span>
        <span>Version: v2.29</span>
      </div>
    </div>
  )
}

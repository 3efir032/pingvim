"use client"

import type { SyncState } from "@/types/supabase"
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react"

interface SyncStatusProps {
  syncState: SyncState
  onSync: () => void
  className?: string
}

export default function SyncStatus({ syncState, onSync, className = "" }: SyncStatusProps) {
  const { status, lastSynced, error } = syncState

  const formatLastSynced = () => {
    if (!lastSynced) return "Никогда"

    // Если синхронизация была сегодня, показываем только время
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (lastSynced >= today) {
      return `Сегодня в ${lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    }

    // Если синхронизация была вчера
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (lastSynced >= yesterday) {
      return `Вчера в ${lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    }

    // Иначе показываем полную дату
    return (
      lastSynced.toLocaleDateString() + " " + lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    )
  }

  return (
    <div className={`flex items-center space-x-2 text-xs ${className}`}>
      {status === "syncing" ? (
        <>
          <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
          <span className="text-blue-400">Синхронизация...</span>
        </>
      ) : status === "error" ? (
        <>
          <AlertCircle className="h-3 w-3 text-red-500" />
          <span className="text-red-500" title={error || ""}>
            Ошибка синхронизации
          </span>
        </>
      ) : status === "success" ? (
        <>
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span className="text-gray-400">Синхронизировано: {formatLastSynced()}</span>
        </>
      ) : (
        <>
          <span className="text-gray-400">Последняя синхронизация: {formatLastSynced()}</span>
        </>
      )}

      {status !== "syncing" && (
        <button onClick={onSync} className="p-1 hover:bg-gray-700 rounded" title="Синхронизировать сейчас">
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

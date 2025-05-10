import SyncStatus from "./sync-status"
import type { SyncState } from "@/types/supabase"

interface StatusBarProps {
  syncState?: SyncState
  onSync?: () => void
  isLoggedIn?: boolean
}

export default function StatusBar({ syncState, onSync, isLoggedIn }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between bg-[#1B1C1F] px-2 py-1 text-xs text-gray-400">
      <div className="flex items-center space-x-4">
        <span>UTF-8</span>
        <span>LF</span>
        <span>PingVim</span>
      </div>

      <div className="flex items-center space-x-4">
        {isLoggedIn && syncState && onSync && <SyncStatus syncState={syncState} onSync={onSync} />}
        <span>Demo</span>
        <span>Version: v3.04</span>
      </div>
    </div>
  )
}

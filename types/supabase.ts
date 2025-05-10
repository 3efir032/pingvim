export interface SupabaseFolder {
  id: string
  name: string
  is_open: boolean
  parent_id: string | null
  user_id: string
  local_id: string
  created_at: string
  updated_at: string
}

export interface SupabaseFile {
  id: string
  name: string
  content: string
  parent_id: string | null
  user_id: string
  local_id: string
  created_at: string
  updated_at: string
}

export interface SyncStatus {
  user_id: string
  last_sync: string
  sync_version: number
}

export interface SyncState {
  status: "idle" | "syncing" | "error" | "success"
  lastSynced: Date | null
  error: string | null
}

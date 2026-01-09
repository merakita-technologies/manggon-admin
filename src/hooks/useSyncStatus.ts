'use client'

import { useState, useEffect, useRef } from 'react'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startSync = () => {
    setSyncStatus('syncing')
    
    // Simulate sync process (replace with actual sync logic)
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      setSyncStatus('synced')
      setLastSynced(new Date())
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSyncStatus('idle')
      }, 2000)
    }, 1000)
  }

  const setError = () => {
    setSyncStatus('error')
    setTimeout(() => {
      setSyncStatus('idle')
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  return { syncStatus, lastSynced, startSync, setError }
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { graphqlClient } from '@/lib/graphql'

export function useRecentNotifications(limit: number = 5) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await graphqlClient.getNotifications({
        isRead: false,
      })
      // Sort by createdAt descending and limit
      const sorted = data.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setNotifications(sorted.slice(0, limit))
    } catch (err: any) {
      console.error('Error fetching recent notifications:', err)
      setError(err.message || 'Failed to fetch notifications')
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchNotifications()

    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [fetchNotifications])

  return { notifications, isLoading, error, refresh: fetchNotifications }
}


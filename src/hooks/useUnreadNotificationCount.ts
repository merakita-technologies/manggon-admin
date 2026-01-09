import { useState, useEffect } from 'react'
import { graphqlClient } from '@/lib/graphql'

export function useUnreadNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUnreadCount = async () => {
    try {
      // Get unread notifications
      const notifications = await graphqlClient.getNotifications({
        isRead: false,
      })
      setUnreadCount(notifications.length)
    } catch (error) {
      console.error('Error fetching unread notification count:', error)
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return { unreadCount, isLoading, refresh: fetchUnreadCount }
}


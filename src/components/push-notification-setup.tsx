'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff } from 'lucide-react'
import {
  isPushNotificationSupported,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushSubscription,
  subscriptionToJSON,
} from '@/lib/push-notifications'
import { graphqlClient } from '@/lib/graphql'

interface PushNotificationSetupProps {
  userId?: string
}

export function PushNotificationSetup({ userId }: PushNotificationSetupProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    checkSupport()
    checkSubscription()
    checkPermission()
  }, [])

  const checkSupport = () => {
    const supported = isPushNotificationSupported()
    setIsSupported(supported)
  }

  const checkPermission = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }

  const checkSubscription = async () => {
    try {
      const subscription = await getPushSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const handleEnableNotifications = async () => {
    setIsLoading(true)
    try {
      // Request permission
      const newPermission = await requestNotificationPermission()
      setPermission(newPermission)

      if (newPermission !== 'granted') {
        alert('Notification permission is required for push notifications')
        setIsLoading(false)
        return
      }

      // Subscribe to push notifications
      // Note: In production, you should get VAPID public key from backend
      const subscription = await subscribeToPushNotifications()

      if (subscription) {
        setIsSubscribed(true)

        // Send subscription to backend (if endpoint exists)
        if (userId) {
          try {
            const subscriptionData = subscriptionToJSON(subscription)
            // TODO: Call backend API to save subscription
            // await graphqlClient.savePushSubscription({
            //   userId,
            //   subscription: subscriptionData,
            // })
            console.log('Push subscription saved:', subscriptionData)
          } catch (error) {
            console.error('Error saving subscription to backend:', error)
          }
        }
      } else {
        alert('Failed to subscribe to push notifications')
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error)
      alert('Error enabling push notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    setIsLoading(true)
    try {
      const result = await unsubscribeFromPushNotifications()
      if (result) {
        setIsSubscribed(false)
        // TODO: Remove subscription from backend
        console.log('Push notifications disabled')
      } else {
        alert('Failed to disable push notifications')
      }
    } catch (error) {
      console.error('Error disabling push notifications:', error)
      alert('Error disabling push notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground">
        Push notifications are not supported in this browser
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="text-sm text-destructive">
        Notification permission is denied. Please enable it in your browser settings.
      </div>
    )
  }

  if (isSubscribed) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleDisableNotifications}
        disabled={isLoading}
        className="gap-2"
      >
        <BellOff className="h-4 w-4" />
        {isLoading ? 'Disabling...' : 'Disable Push Notifications'}
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEnableNotifications}
      disabled={isLoading}
      className="gap-2"
    >
      <Bell className="h-4 w-4" />
      {isLoading ? 'Enabling...' : 'Enable Push Notifications'}
    </Button>
  )
}


import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { WEBSOCKET_ENDPOINT } from '@/lib/api-config'
import { sendNotificationToServiceWorker } from '@/components/service-worker-register'

export function useChatWebSocket(
  conversationId: string | null,
  onNewMessage?: (message: any) => void,
) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Get token from localStorage
    const token = localStorage.getItem('auth_token')
    if (!token) return

    // Connect to WebSocket (always connect, even without conversationId)
    const socketInstance = io(`${WEBSOCKET_ENDPOINT}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketInstance.on('connect', () => {
      console.log('Connected to chat WebSocket')
      setIsConnected(true)

      // Join conversation if conversationId is provided
      if (conversationId) {
        socketInstance.emit('joinConversation', { conversationId })
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from chat WebSocket')
      setIsConnected(false)
    })

    socketInstance.on('userTyping', (data: { userId: string; conversationId: string; isTyping: boolean }) => {
      if (data.conversationId !== conversationId) return

      setTypingUsers((prev) => {
        const newSet = new Set(prev)
        if (data.isTyping) {
          newSet.add(data.userId)
          
          // Clear existing timeout
          const existingTimeout = typingTimeoutRef.current.get(data.userId)
          if (existingTimeout) {
            clearTimeout(existingTimeout)
          }

          // Set timeout to remove typing indicator after 3 seconds
          const timeout = setTimeout(() => {
            setTypingUsers((current) => {
              const updated = new Set(current)
              updated.delete(data.userId)
              return updated
            })
            typingTimeoutRef.current.delete(data.userId)
          }, 3000)

          typingTimeoutRef.current.set(data.userId, timeout)
        } else {
          newSet.delete(data.userId)
          const timeout = typingTimeoutRef.current.get(data.userId)
          if (timeout) {
            clearTimeout(timeout)
            typingTimeoutRef.current.delete(data.userId)
          }
        }
        return newSet
      })
    })

    // Listen for new messages
    socketInstance.on('newMessage', (data: any) => {
      console.log('Received newMessage event:', data)
      if (data.conversationId === conversationId && onNewMessage) {
        console.log('Calling onNewMessage handler')
        onNewMessage(data)
      } else {
        console.log('Skipping newMessage - conversationId mismatch or no handler', {
          receivedConversationId: data.conversationId,
          currentConversationId: conversationId,
          hasHandler: !!onNewMessage
        })
        // Show browser notification if user is not on chat page
        if (typeof window !== 'undefined' && window.location.pathname !== '/chat') {
          sendNotificationToServiceWorker({
            title: 'Pesan Baru',
            body: data.content || 'You have a new message',
            icon: '/icon-192x192.png',
            tag: `chat-${data.conversationId}`,
            data: {
              url: `/chat?conversationId=${data.conversationId}`,
              conversationId: data.conversationId,
            },
          })
        }
      }
    })

    // Listen for general notifications
    socketInstance.on('notification', (data: any) => {
      console.log('Notification received:', data)
      // Show browser notification
      sendNotificationToServiceWorker({
        title: data.title || 'Manggon Admin',
        body: data.message || data.body || 'You have a new notification',
        icon: '/icon-192x192.png',
        tag: data.tag || 'manggon-notification',
        data: {
          url: data.link || data.url || '/',
          ...data.data,
        },
      })
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error)
    })

    setSocket(socketInstance)

    return () => {
      // Clear all timeouts
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout))
      typingTimeoutRef.current.clear()

      // Leave conversation
      if (conversationId) {
        socketInstance.emit('leaveConversation', { conversationId })
      }

      socketInstance.disconnect()
    }
  }, [conversationId, onNewMessage])

  const sendTyping = (isTyping: boolean) => {
    if (!socket || !conversationId || !isConnected) return
    socket.emit('typing', { conversationId, isTyping })
  }

  return {
    socket,
    isConnected,
    typingUsers,
    sendTyping,
  }
}


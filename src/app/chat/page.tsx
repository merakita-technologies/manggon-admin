'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { graphqlClient } from '@/lib/graphql'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send, MessageSquare, Paperclip, Image as ImageIcon, File, ArrowLeft, Check, CheckCheck } from 'lucide-react'
import { useI18n } from '@/contexts/i18n-context'
import { Badge } from '@/components/ui/badge'
import { useChatWebSocket } from '@/hooks/useChatWebSocket'
import { BACKEND_BASE_URL } from '@/lib/api-config'

interface Conversation {
  id: string
  propertyId?: string
  property?: {
    id: string
    name: string
    city?: string
  }
  bookingId?: string
  booking?: {
    id: string
    status: string
    totalPrice: number
  }
  lastMessageAt?: string
  participants: Array<{
    id: string
    userId: string
    user: {
      id: string
      email: string
      fullName: string
    }
    lastReadAt?: string
  }>
  unreadCount?: number
}

interface Message {
  id: string
  senderId: string
  sender: {
    id: string
    email: string
    fullName: string
  }
  content: string
  messageType: string
  isRead: boolean
  readAt?: string
  createdAt: string
  attachmentUrl?: string
  attachmentName?: string
  attachmentSize?: number
  attachmentMimeType?: string
}

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [uploadingFile, setUploadingFile] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  

  const loadConversations = async () => {
    try {
      setLoading(true)
      const data = await graphqlClient.getConversations()
      // Calculate unread count for each conversation
      const conversationsWithUnread = await Promise.all(
        data.map(async (conv: Conversation) => {
          const unreadCount = await calculateUnreadCount(conv)
          return { ...conv, unreadCount }
        })
      )
      // Sort by lastMessageAt descending (most recent first)
      const sorted = conversationsWithUnread.sort((a, b) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
        return dateB - dateA
      })
      setConversations(sorted)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateUnreadCount = async (conversation: Conversation): Promise<number> => {
    try {
      if (typeof window === 'undefined') return 0
      const userInfo = localStorage.getItem('user_info')
      if (!userInfo) return 0
      const user = JSON.parse(userInfo)
      
      // Get current user's participant info
      const currentParticipant = conversation.participants.find(p => p.userId === user.id)
      if (!currentParticipant) return 0
      
      // If never read, count all unread messages from others
      if (!currentParticipant.lastReadAt) {
        const messages = await graphqlClient.getMessages(conversation.id, 100, 0)
        return messages.filter((msg: Message) => msg.senderId !== user.id && !msg.isRead).length
      }
      
      // Count messages after lastReadAt that are unread
      const lastReadDate = new Date(currentParticipant.lastReadAt)
      const messages = await graphqlClient.getMessages(conversation.id, 100, 0)
      return messages.filter((msg: Message) => {
        const msgDate = new Date(msg.createdAt)
        return msg.senderId !== user.id && msgDate > lastReadDate && !msg.isRead
      }).length
    } catch (error) {
      console.error('Error calculating unread count:', error)
      return 0
    }
  }

  const scrollToBottom = () => {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'instant' })
      } else if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
    }, 100)
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await graphqlClient.getMessages(conversationId, 50, 0)
      console.log('Loaded messages:', data)
      // Don't reverse - show messages in order (oldest first, newest at bottom)
      setMessages(data || [])
      // Mark as read
      await graphqlClient.markConversationAsRead(conversationId)
      // Reload conversations to update unread count immediately
      loadConversations()
      loadUnreadCount()
      // Scroll to bottom after messages loaded
      scrollToBottom()
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages([]) // Set empty array on error
    }
  }

  // WebSocket for real-time features
  const handleNewMessage = useCallback((newMessage: any) => {
    setMessages((prev) => {
      if (prev.some((msg) => msg.id === newMessage.id)) {
        return prev
      }
      const updated = [...prev, newMessage]
      // Scroll to bottom when new message arrives
      setTimeout(() => scrollToBottom(), 100)
      return updated
    })
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
    }
    loadConversations()
  }, [selectedConversation])

  const { typingUsers, sendTyping, socket } = useChatWebSocket(
    selectedConversation?.id || null,
    handleNewMessage,
  )

  useEffect(() => {
    loadConversations()
    loadUnreadCount()
    
    // Set up socket listener for conversation updates (even when no conversation selected)
    if (socket) {
      socket.on('newMessage', (data: any) => {
        // Reload conversations and unread count when new message arrives
        loadConversations()
        loadUnreadCount()
      })
      
      socket.on('conversationUpdated', () => {
        loadConversations()
        loadUnreadCount()
      })
    }
    
    // Refresh unread count every 30 seconds as fallback
    const interval = setInterval(() => {
      loadUnreadCount()
      loadConversations()
    }, 30000)

    return () => {
      clearInterval(interval)
      if (socket) {
        socket.off('newMessage')
        socket.off('conversationUpdated')
      }
    }
  }, [socket])

  // Handle conversationId from URL params
  useEffect(() => {
    const conversationId = searchParams.get('conversationId')
    if (conversationId) {
      if (conversations.length > 0) {
        const conversation = conversations.find(c => c.id === conversationId)
        if (conversation) {
          setSelectedConversation(conversation)
          loadMessages(conversationId)
          // Clean URL
          router.replace('/chat')
        }
      } else {
        // If conversations not loaded yet, wait for them
        const checkConversation = async () => {
          try {
            const data = await graphqlClient.getConversations()
            setConversations(data)
            const conversation = data.find((c: Conversation) => c.id === conversationId)
            if (conversation) {
              setSelectedConversation(conversation)
              loadMessages(conversationId)
              router.replace('/chat')
            }
          } catch (error) {
            console.error('Error loading conversation:', error)
          }
        }
        checkConversation()
      }
    }
  }, [conversations, searchParams, router])

  // Load messages when selected conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      // Reload conversations to update unread count
      loadConversations()
    } else {
      setMessages([])
    }
  }, [selectedConversation?.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length])


  const loadUnreadCount = async () => {
    try {
      const count = await graphqlClient.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const sendMessage = async (attachmentData?: {
    url: string
    filename: string
    size: number
    mimeType: string
  }) => {
    if (!selectedConversation || (!messageText.trim() && !attachmentData)) return

    // Stop typing indicator
    sendTyping(false)

    try {
      await graphqlClient.sendMessage({
        conversationId: selectedConversation.id,
        content: messageText.trim() || (attachmentData ? t('chat.sentAttachment') : ''),
        attachmentUrl: attachmentData?.url,
        attachmentName: attachmentData?.filename,
        attachmentSize: attachmentData?.size,
        attachmentMimeType: attachmentData?.mimeType,
        messageType: attachmentData?.mimeType?.startsWith('image/') ? 'image' : attachmentData ? 'file' : undefined,
      })
      setMessageText('')
      // Reload messages and scroll to bottom after sending
      await loadMessages(selectedConversation.id)
      scrollToBottom()
      loadUnreadCount()
    } catch (error) {
      console.error('Error sending message:', error)
      alert(t('chat.sendMessageError'))
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedConversation) return

    setUploadingFile(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversationId', selectedConversation.id)

      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${BACKEND_BASE_URL}/api/v1/chats/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const uploadResult = await response.json()
      
      // Send message with attachment
      await sendMessage({
        url: uploadResult.url,
        filename: uploadResult.filename,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
      })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert(t('chat.uploadFileError'))
    } finally {
      setUploadingFile(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value)
    
    // Send typing indicator
    if (!typingTimeoutRef.current) {
      sendTyping(true)
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set timeout to stop typing indicator after 2 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false)
      typingTimeoutRef.current = null
    }, 2000)
  }

  const getOtherParticipant = (conversation: Conversation) => {
    if (typeof window === 'undefined') return null
    const userInfo = localStorage.getItem('user_info')
    if (!userInfo) return null
    const user = JSON.parse(userInfo)
    return conversation.participants.find(p => p.userId !== user.id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">{t('chat.loadingConversations')}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header with Back Button */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="h-8 w-8"
            title={t('chat.backToDashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">{t('chat.title') || 'Chat'}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className="w-1/3 border-r bg-gray-50 overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">{t('chat.conversations') || 'Conversations'}</h2>
          </div>
        <div className="divide-y">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {t('chat.noConversations') || 'No conversations yet'}
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv)
              const unreadCount = conv.unreadCount || 0
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-4 hover:bg-gray-100 transition-colors relative ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center gap-2">
                        <span className="truncate">{other?.user.fullName || t('chat.unknownUser')}</span>
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-[20px] text-xs flex-shrink-0">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </div>
                      {conv.property && (
                        <div className="text-sm text-gray-600 truncate">{conv.property.name}</div>
                      )}
                      {conv.booking && (
                        <div className="text-xs text-gray-500">{t('chat.booking')} #{conv.booking.id.slice(0, 8)}</div>
                      )}
                      {conv.lastMessageAt && (
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(conv.lastMessageAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-white">
              {(() => {
                const other = getOtherParticipant(selectedConversation)
                return (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedConversation(null)
                        setMessages([])
                      }}
                      className="h-8 w-8"
                      title={t('common.back') || 'Back'}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                      <h3 className="font-semibold">{other?.user.fullName || t('chat.unknownUser')}</h3>
                      {selectedConversation.property && (
                        <div className="text-sm text-gray-600">{selectedConversation.property.name}</div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className="px-4 py-2 text-sm text-gray-500 italic">
                {Array.from(typingUsers).map((userId, idx) => {
                  // Find user name from conversation participants
                  const user = selectedConversation?.participants.find(p => p.userId === userId)?.user
                  return user ? user.fullName : t('chat.someone')
                }).join(', ')} {typingUsers.size === 1 ? t('chat.isTyping') : t('chat.areTyping')}...
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isOwn = typeof window !== 'undefined' && (() => {
                  const userInfo = localStorage.getItem('user_info')
                  if (!userInfo) return false
                  const user = JSON.parse(userInfo)
                  return msg.senderId === user.id
                })()

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwn ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      {!isOwn && (
                        <div className="text-xs font-semibold mb-1">{msg.sender.fullName}</div>
                      )}
                      
                      {/* Attachment Display */}
                      {msg.attachmentUrl && (
                        <div className="mb-2">
                          {msg.attachmentMimeType?.startsWith('image/') ? (
                            <div className="rounded-lg overflow-hidden max-w-full">
                              <img 
                                src={`${BACKEND_BASE_URL}${msg.attachmentUrl}`}
                                alt={msg.attachmentName || t('chat.image')}
                                className="max-w-full max-h-64 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            </div>
                          ) : (
                            <a
                              href={`${BACKEND_BASE_URL}${msg.attachmentUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded border ${
                                isOwn 
                                  ? 'bg-blue-400 border-blue-300 text-white' 
                                  : 'bg-gray-100 border-gray-300 text-gray-900'
                              } hover:opacity-80 transition-opacity`}
                            >
                              <File className="h-4 w-4" />
                              <span className="text-sm">{msg.attachmentName || t('chat.file')}</span>
                              {msg.attachmentSize && (
                                <span className="text-xs opacity-75">
                                  ({(msg.attachmentSize / 1024).toFixed(1)} KB)
                                </span>
                              )}
                            </a>
                          )}
                        </div>
                      )}
                      
                      {/* Message Content */}
                      {msg.content && <div>{msg.content}</div>}
                      
                      <div className={`text-xs mt-1 flex items-center gap-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                        <span>{new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        {isOwn && (
                          <span className="ml-1">
                            {(() => {
                              // WhatsApp-like message status icons
                              // 1. Read (blue double check) - isRead && readAt
                              if (msg.isRead && msg.readAt) {
                                return <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                              }
                              // 2. Delivered (grey double check) - readAt exists or isRead true
                              if (msg.readAt || msg.isRead) {
                                return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                              }
                              // 3. Sent (grey single check) - message created but not delivered/read yet
                              return <Check className="w-3.5 h-3.5 text-gray-400" />
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {/* Scroll anchor for auto-scroll to bottom */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  title={t('chat.attachFile')}
                >
                  {uploadingFile ? (
                    <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </Button>
                <Input
                  value={messageText}
                  onChange={handleInputChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder={t('chat.typeMessage') || 'Type a message...'}
                  disabled={uploadingFile}
                />
                <Button 
                  onClick={() => sendMessage()} 
                  disabled={!messageText.trim() || uploadingFile}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('chat.selectConversation') || 'Select a conversation to start chatting'}</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}


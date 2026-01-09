'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Bell, Loader2, CheckCircle, AlertCircle, Info, Mail, MoreHorizontal, Trash2, Eye } from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/date-utils'
import { graphqlClient } from '@/lib/graphql'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useI18n } from '@/contexts/i18n-context'

export default function NotificationsPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [readFilter, setReadFilter] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [typeFilter, readFilter])

  const fetchNotifications = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await graphqlClient.getNotifications({
        type: typeFilter || undefined,
        isRead: readFilter === 'read' ? true : readFilter === 'unread' ? false : undefined,
      })
      setNotifications(data)
    } catch (err: any) {
      setError(err.message || t('common.error'))
      console.error('Error fetching notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }


  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm(t('notifications.deleteConfirm'))) {
      return
    }

    try {
      const result = await graphqlClient.deleteNotification(notificationId)
      if (result.success) {
        fetchNotifications()
      } else {
        alert(result.message || t('notifications.deleteError'))
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err)
      alert(err.message || t('notifications.deleteError'))
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await graphqlClient.markNotificationAsRead(notificationId)
      if (result.success) {
        fetchNotifications()
      } else {
        alert(result.message || t('notifications.markReadError'))
      }
    } catch (err: any) {
      console.error('Error marking notification as read:', err)
      alert(err.message || t('notifications.markReadError'))
    }
  }

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      try {
        await graphqlClient.markNotificationAsRead(notification.id)
        // Update local state
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        ))
      } catch (err) {
        console.error('Error marking notification as read:', err)
      }
    }

    // Navigate to link if exists
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const result = await graphqlClient.markAllNotificationsAsRead()
      if (result.success) {
        fetchNotifications()
      } else {
        alert(result.message || t('notifications.markAllReadError'))
      }
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err)
      alert(err.message || t('notifications.markAllReadError'))
    }
  }


  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = !searchQuery || 
      notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
      case 'info':
        return CheckCircle
      case 'payment':
      case 'warning':
        return AlertCircle
      case 'review':
      case 'error':
        return Info
      default:
        return Bell
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('notifications.management')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('notifications.managementDescription')}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllAsRead}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('notifications.markAllAsRead')}
              </Button>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('notifications.totalNotifications')}</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('notifications.allNotifications')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('notifications.unread')}</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('notifications.pendingReview')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('common.read', { defaultValue: 'Read' })}</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length - unreadCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('common.viewed', { defaultValue: 'Viewed notifications' })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t('notifications.title')}</CardTitle>
                <CardDescription>
                  {t('notifications.managementDescription')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">{t('common.all')} {t('common.type')}</option>
                  <option value="info">{t('common.info')}</option>
                  <option value="warning">{t('common.warning')}</option>
                  <option value="error">{t('common.error')}</option>
                  <option value="success">{t('common.success')}</option>
                </select>
                <select
                  value={readFilter}
                  onChange={(e) => setReadFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">{t('common.all')}</option>
                  <option value="unread">{t('notifications.unread')}</option>
                  <option value="read">{t('common.read')}</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('common.search') + ' ' + t('notifications.title').toLowerCase() + '...'}
                    className="w-full sm:w-[200px] pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={fetchNotifications} variant="outline" className="mt-4">
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>{t('notifications.title')}</CardTitle>
            <CardDescription>
              {filteredNotifications.length} {t('notifications.notification')}{filteredNotifications.length !== 1 ? 's' : ''} {t('common.found')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('notifications.noNotificationsFound')}</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? t('common.tryAdjusting') : t('notifications.noNotifications')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.notificationType)
                  return (
                    <Card
                      key={notification.id}
                      className={`hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.isRead ? 'border-primary' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-full ${
                            !notification.isRead ? 'bg-primary/10' : 'bg-muted'
                          }`}>
                            <Icon className={`h-5 w-5 ${
                              !notification.isRead ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className={`font-semibold ${!notification.isRead ? '' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                {!notification.isRead && (
                                  <Badge variant="default" className="text-xs">New</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(notification.createdAt)}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {!notification.isRead && (
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation()
                                        handleMarkAsRead(notification.id)
                                      }}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        {t('notifications.markAsRead')}
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteNotification(notification.id)
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      {t('common.delete')} {t('notifications.notification')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {notification.type}
                              </Badge>
                              {notification.link && (
                                <span className="text-xs text-primary">
                                  {t('notifications.viewLink') || 'View Details'} →
                                </span>
                              )}
                            </div>
                            {notification.user && (
                              <p className="text-xs text-muted-foreground mt-1">
                                User: {notification.user.fullName} ({notification.user.email})
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}



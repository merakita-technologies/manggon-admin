'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bell, Search, User, Menu, LogOut, Settings, Wifi, WifiOff, Cloud, CloudOff, CheckCircle2, Maximize2, Minimize2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/contexts/i18n-context'
import { LanguageSwitcher } from './language-switcher'
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount'
import { useRecentNotifications } from '@/hooks/useRecentNotifications'
import { graphqlClient } from '@/lib/graphql'
import { formatRelativeTime } from '@/lib/date-utils'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useSyncStatus } from '@/hooks/useSyncStatus'
import { useDensityMode } from '@/contexts/density-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CheckCircle, AlertCircle, Info, Bell as BellIcon } from 'lucide-react'

interface TopbarProps {
  isSidebarCollapsed: boolean;
  onMenuClick: () => void;
}

export function Topbar({ isSidebarCollapsed, onMenuClick }: TopbarProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [userName, setUserName] = useState<string>('User')
  const [userEmail, setUserEmail] = useState<string>('')
  const { unreadCount, refresh: refreshUnreadCount } = useUnreadNotificationCount()
  const { notifications: recentNotifications, refresh: refreshRecentNotifications } = useRecentNotifications(5)
  const { isOnline, wasOffline } = useOnlineStatus()
  const { syncStatus, lastSynced, startSync } = useSyncStatus()
  const { densityMode, toggleDensityMode } = useDensityMode()

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      try {
        await graphqlClient.markNotificationAsRead(notification.id)
        refreshUnreadCount()
        refreshRecentNotifications()
      } catch (err) {
        console.error('Error marking notification as read:', err)
      }
    }

    // Navigate to link if exists
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
      case 'booking_new':
      case 'booking_approved':
      case 'booking_rejected':
      case 'info':
        return CheckCircle
      case 'payment':
      case 'warning':
        return AlertCircle
      case 'review':
      case 'error':
        return Info
      default:
        return BellIcon
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userInfo = localStorage.getItem('user_info')
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo)
          setUserName(user.fullName || user.email?.split('@')[0] || 'User')
          setUserEmail(user.email || '')
        } catch (e) {
          console.error('Error parsing user info:', e)
        }
      }
    }
  }, [])

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      const { graphqlClient } = await import('@/lib/graphql')
      graphqlClient.logout()
      router.push('/auth/login')
    }
  }

  return (
    <header className={`
      sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6
      transition-all duration-300
    `}>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onMenuClick}
        className="md:hidden h-8 w-8 p-0"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex flex-1 items-center gap-4">
        <form className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('common.search')}
              className="w-full pl-8 md:w-[300px] lg:w-[400px]"
            />
          </div>
        </form>
        
        {/* Online/Offline Status Indicator */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <Wifi className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300 hidden sm:inline">
                {wasOffline ? t('common.reconnected', { defaultValue: 'Reconnected' }) : t('common.online', { defaultValue: 'Online' })}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <WifiOff className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              <span className="text-xs font-medium text-red-700 dark:text-red-300 hidden sm:inline">
                {t('common.offline', { defaultValue: 'Offline' })}
              </span>
            </div>
          )}
          
          {/* Sync Status Indicator */}
          {syncStatus === 'syncing' && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <Cloud className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300 hidden sm:inline">
                {t('common.syncing', { defaultValue: 'Syncing...' })}
              </span>
            </div>
          )}
          {syncStatus === 'synced' && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300 hidden sm:inline">
                {t('common.synced', { defaultValue: 'Synced' })}
              </span>
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="ml-auto relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>{t('notifications.title', { defaultValue: 'Notifications' })}</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} {t('notifications.unread', { defaultValue: 'unread' })}
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recentNotifications.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                {recentNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type)
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="cursor-pointer flex items-start gap-3 py-3 px-4"
                    >
                      <div className={`p-1.5 rounded-full mt-0.5 ${
                        !notification.isRead ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          !notification.isRead ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notification.isRead ? '' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                          {notification.link && (
                            <span className="text-xs text-primary">
                              {t('notifications.viewLink') || 'View'} →
                            </span>
                          )}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {t('notifications.noNotifications', { defaultValue: 'No notifications' })}
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                router.push('/notifications')
                refreshUnreadCount()
                refreshRecentNotifications()
              }}
              className="cursor-pointer"
            >
              <Bell className="mr-2 h-4 w-4" />
              <span>{t('notifications.viewAll', { defaultValue: 'View all notifications' })}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <LanguageSwitcher />
        {/* Density Mode Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleDensityMode}
          title={densityMode === 'comfortable' ? t('common.compactMode', { defaultValue: 'Compact Mode' }) : t('common.comfortableMode', { defaultValue: 'Comfortable Mode' })}
        >
          {densityMode === 'comfortable' ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t('common.settings', { defaultValue: 'Settings' })}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('auth.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
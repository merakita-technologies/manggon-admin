'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bell, Search, User, Menu, LogOut, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/contexts/i18n-context'
import { LanguageSwitcher } from './language-switcher'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopbarProps {
  isSidebarCollapsed: boolean;
  onMenuClick: () => void;
}

export function Topbar({ isSidebarCollapsed, onMenuClick }: TopbarProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [userName, setUserName] = useState<string>('User')
  const [userEmail, setUserEmail] = useState<string>('')

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
        <Button variant="outline" size="icon" className="ml-auto">
          <Bell className="h-4 w-4" />
        </Button>
        <LanguageSwitcher />
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
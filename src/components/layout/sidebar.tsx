'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, 
  Building, 
  Bed, 
  Calendar, 
  CreditCard, 
  Star, 
  Wifi,
  Plus,
  Bell,
  Home,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useEffect, useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Properties', href: '/properties', icon: Building },
  { name: 'Rooms & Units', href: '/rooms', icon: Bed },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Reviews', href: '/reviews', icon: Star },
  { name: 'Amenities', href: '/amenities', icon: Wifi },
  { name: 'Add-ons', href: '/addons', icon: Plus },
  { name: 'Notifications', href: '/notifications', icon: Bell },
]

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setIsMobileOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setIsMobileOpen])

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false)
    }
  }, [pathname, isMobile, setIsMobileOpen])

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {(!isCollapsed || isMobile) && <h1 className="text-xl font-bold">Manggon Admin</h1>}
        <div className="flex items-center gap-2">
          {isMobile ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        <TooltipProvider delayDuration={0}>
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            const linkContent = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg transition-all hover:bg-accent",
                  isActive ? "bg-accent" : "transparent",
                  isCollapsed && !isMobile ? "h-10 w-10 justify-center" : "h-10 px-3 gap-3"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {(!isCollapsed || isMobile) && (
                  <span className="text-sm truncate">{item.name}</span>
                )}
              </Link>
            )

            if (isCollapsed && !isMobile) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return linkContent
          })}
        </TooltipProvider>
      </nav>

      {/* Footer */}
      {(!isCollapsed || isMobile) && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@manggon.com</p>
            </div>
          </div>
        </div>
      )}
    </>
  )

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        {/* Mobile overlay */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
        
        {/* Mobile sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-300 md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {sidebarContent}
        </div>

        {/* Desktop sidebar (hidden on mobile) */}
        <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-50 md:bg-background md:border-r transition-all duration-300"
          style={{ width: isCollapsed ? '64px' : '256px' }}>
          {sidebarContent}
        </div>
      </>
    )
  }

  // Desktop sidebar
  return (
    <div className={cn(
      "hidden md:flex flex-col fixed inset-y-0 left-0 z-50 bg-background border-r transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {sidebarContent}
    </div>
  )
}
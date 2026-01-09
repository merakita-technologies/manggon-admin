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
  ChevronDown,
  ChevronUp,
  X,
  ShoppingCart,
  Package,
  ShoppingBag,
  MessageSquare,
  Settings,
  Calendar as CalendarIcon,
  FileText,
  Receipt,
  MapPin,
  FileCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState, useMemo } from 'react'
import { useI18n } from '@/contexts/i18n-context'
import { useUnreadChatCount } from '@/hooks/useUnreadChatCount'

interface MenuItem {
  name: string
  href: string
  icon: any
  roles: string[]
  key: string
}

interface MenuGroup {
  name: string
  icon: any
  roles: string[]
  key: string
  items: MenuItem[]
  href?: string // If provided, clicking parent navigates here
}

type NavigationItem = MenuItem | MenuGroup

const isMenuGroup = (item: NavigationItem): item is MenuGroup => {
  return 'items' in item
}

const getNavigation = (t: (key: string) => string): NavigationItem[] => [
  // Dashboard
  { 
    name: t('dashboard.title'), 
    href: '/', 
    icon: Home, 
    roles: ['admin', 'owner'], 
    key: 'dashboard' 
  },
  
  // Users (Admin only)
  { 
    name: t('users.title'), 
    href: '/users', 
    icon: Users, 
    roles: ['admin'], 
    key: 'users' 
  },
  
  // Properties Group
  {
    name: t('properties.title') || 'Properties',
    icon: Building,
    roles: ['admin', 'owner'],
    key: 'properties-group',
    href: '/properties',
    items: [
      { 
        name: t('properties.title') || 'Properties', 
        href: '/properties', 
        icon: Building, 
        roles: ['admin', 'owner'], 
        key: 'properties' 
      },
      { 
        name: t('rooms.title') || 'Rooms', 
        href: '/rooms', 
        icon: Bed, 
        roles: ['admin', 'owner'], 
        key: 'rooms' 
      },
      { 
        name: t('amenities.title') || 'Amenities', 
        href: '/amenities', 
        icon: Wifi, 
        roles: ['admin'], 
        key: 'amenities' 
      },
    ]
  },
  
  // Bookings Group
  {
    name: t('bookings.title') || 'Bookings',
    icon: Calendar,
    roles: ['admin', 'owner'],
    key: 'bookings-group',
    href: '/bookings',
    items: [
      { 
        name: t('bookings.title') || 'Bookings', 
        href: '/bookings', 
        icon: CalendarIcon, 
        roles: ['admin', 'owner'], 
        key: 'bookings' 
      },
      { 
        name: t('payments.title') || 'Payments', 
        href: '/payments', 
        icon: CreditCard, 
        roles: ['admin', 'owner'], 
        key: 'payments' 
      },
    ]
  },
  
  // Reviews
  { 
    name: t('reviews.title'), 
    href: '/reviews', 
    icon: Star, 
    roles: ['admin', 'owner'], 
    key: 'reviews' 
  },
  
  // E-Commerce Group
  {
    name: 'E-Commerce',
    icon: ShoppingCart,
    roles: ['admin', 'owner'],
    key: 'ecommerce-group',
    items: [
      { 
        name: t('products.title') || 'Products', 
        href: '/products', 
        icon: Package, 
        roles: ['admin'], 
        key: 'products' 
      },
      { 
        name: t('marketplace.title') || 'Marketplace', 
        href: '/marketplace', 
        icon: ShoppingCart, 
        roles: ['owner'], 
        key: 'marketplace' 
      },
      { 
        name: t('orders.title') || 'Orders', 
        href: '/orders', 
        icon: ShoppingBag, 
        roles: ['owner'], 
        key: 'orders' 
      },
      { 
        name: t('addons.title') || 'Addons', 
        href: '/addons', 
        icon: Plus, 
        roles: ['admin'], 
        key: 'addons' 
      },
    ]
  },
  
  // Settings Group (Admin only)
  {
    name: t('common.settings') || 'Settings',
    icon: Settings,
    roles: ['admin'],
    key: 'settings-group',
    items: [
      { 
        name: 'Holidays', 
        href: '/holidays', 
        icon: CalendarIcon, 
        roles: ['admin'], 
        key: 'holidays' 
      },
      { 
        name: 'Tax Settings', 
        href: '/tax-settings', 
        icon: Receipt, 
        roles: ['admin'], 
        key: 'tax-settings' 
      },
      { 
        name: 'Location Change Requests', 
        href: '/location-change-requests', 
        icon: MapPin, 
        roles: ['admin'], 
        key: 'location-change-requests' 
      },
      { 
        name: 'Audit Logs', 
        href: '/audit-logs', 
        icon: FileCheck, 
        roles: ['admin'], 
        key: 'audit-logs' 
      },
    ]
  },
  
  // Communication
  { 
    name: t('chat.title') || 'Chat', 
    href: '/chat', 
    icon: MessageSquare, 
    roles: ['admin', 'owner'], 
    key: 'chat' 
  },
  { 
    name: t('notifications.title'), 
    href: '/notifications', 
    icon: Bell, 
    roles: ['admin', 'owner'], 
    key: 'notifications' 
  },
]

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const [isMobile, setIsMobile] = useState(false)
  const [userRole, setUserRole] = useState<string>('user')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('Admin User')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  
  // Memoize navigation to prevent re-creation on every render
  const allNavigation = useMemo(() => getNavigation(t), [t])
  const { unreadCount } = useUnreadChatCount()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userInfo = localStorage.getItem('user_info')
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo)
          setUserRole(user.role || 'user')
          setUserEmail(user.email || 'admin@manggon.com')
          setUserName(
            user.fullName || 
            `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
            user.email?.split('@')[0] || 
            'Admin User'
          )
        } catch (e) {
          console.error('Error parsing user info:', e)
        }
      }
    }
  }, [])

  // Auto-expand groups that contain active items
  useEffect(() => {
    const activeGroups = new Set<string>()
    allNavigation.forEach(item => {
      if (isMenuGroup(item)) {
        const hasActiveChild = item.items.some(child => {
          const isActive = pathname === child.href || pathname.startsWith(child.href + '/')
          return isActive && (child.roles.includes(userRole) || userRole === 'admin')
        })
        if (hasActiveChild) {
          activeGroups.add(item.key)
        }
      }
    })
    // Only update if there are actual changes to avoid infinite loop
    setExpandedGroups(prev => {
      // Check if sets are equal
      if (prev.size !== activeGroups.size) {
        return activeGroups
      }
      for (const key of activeGroups) {
        if (!prev.has(key)) {
          return activeGroups
        }
      }
      return prev // No changes, return previous state
    })
  }, [pathname, userRole, allNavigation])

  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => {
    if (isMenuGroup(item)) {
      return item.roles.includes(userRole) || userRole === 'admin'
    }
    return item.roles.includes(userRole) || userRole === 'admin'
  })

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

  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false)
    }
  }, [pathname, isMobile, setIsMobileOpen])

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const renderMenuItem = (item: MenuItem, isSubItem: boolean = false) => {
    const Icon = item.icon
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const showBadge = item.key === 'chat' && unreadCount > 0
    
    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center rounded-lg transition-all relative",
          isActive 
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
            : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
          isCollapsed && !isMobile && !isSubItem ? "h-10 w-10 justify-center" : "h-9 px-3 gap-3",
          isSubItem && ""
        )}
      >
        {(!isCollapsed || isMobile || isSubItem) && (
          <Icon className={cn(
            "h-4 w-4 flex-shrink-0 transition-colors",
            isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/80"
          )} />
        )}
        {isCollapsed && !isMobile && !isSubItem && (
          <Icon className={cn(
            "h-4 w-4 flex-shrink-0 transition-colors",
            isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/85"
          )} />
        )}
        {(!isCollapsed || isMobile) && (
          <>
            <span className={cn(
              "text-sm truncate flex-1",
              isActive ? "font-medium" : "font-normal"
            )}>{item.name}</span>
            {showBadge && (
              <Badge variant="destructive" className="h-5 min-w-[20px] text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </>
        )}
        {isCollapsed && !isMobile && !isSubItem && showBadge && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs min-w-[20px]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Link>
    )

    if (isCollapsed && !isMobile && !isSubItem) {
      return (
        <Tooltip key={item.key}>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right">
            {item.name}
          </TooltipContent>
        </Tooltip>
      )
    }

    return <div key={item.key}>{linkContent}</div>
  }

  const renderMenuGroup = (group: MenuGroup) => {
    const Icon = group.icon
    const isExpanded = expandedGroups.has(group.key)
    const filteredItems = group.items.filter(item => 
      item.roles.includes(userRole) || userRole === 'admin'
    )
    
    if (filteredItems.length === 0) return null

    const hasActiveChild = filteredItems.some(item => 
      pathname === item.href || pathname.startsWith(item.href + '/')
    )
    const isActive = hasActiveChild || (group.href && pathname === group.href)

    if (isCollapsed && !isMobile) {
      // Collapsed mode: show only parent icon with tooltip
      return (
        <Tooltip key={group.key}>
          <TooltipTrigger asChild>
            <div className="relative">
              {group.href ? (
                <Link
                  href={group.href}
                  className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-lg transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/90"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ) : (
                <div
                  className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-lg transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
                    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/90"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            {group.name}
          </TooltipContent>
        </Tooltip>
      )
    }

    // Expanded mode: show parent with collapsible children
    return (
      <div key={group.key} className="space-y-1">
        <div
          className={cn(
            "group flex items-center rounded-lg transition-all",
            isActive ? "bg-sidebar-accent/60" : "hover:bg-sidebar-accent/40"
          )}
        >
          {group.href ? (
            <Link
              href={group.href}
              className={cn(
                "flex-1 flex items-center h-10 px-3 gap-3 transition-colors",
                isActive 
                  ? "text-sidebar-accent-foreground font-medium" 
                  : "text-sidebar-foreground/90 hover:text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 flex-shrink-0 transition-colors",
                isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/90 group-hover:text-sidebar-accent-foreground"
              )} />
              <span className="text-sm font-medium truncate flex-1">{group.name}</span>
            </Link>
          ) : (
            <div
              className={cn(
                "flex-1 flex items-center h-10 px-3 gap-3 transition-colors cursor-pointer",
                isActive 
                  ? "text-sidebar-accent-foreground font-medium" 
                  : "text-sidebar-foreground/90 hover:text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 flex-shrink-0 transition-colors",
                isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/90 group-hover:text-sidebar-accent-foreground"
              )} />
              <span className="text-sm font-medium truncate flex-1">{group.name}</span>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleGroup(group.key)
            }}
            className={cn(
              "px-2 h-10 flex items-center justify-center rounded-r-lg transition-colors hover:bg-sidebar-accent/20",
              isActive 
                ? "text-sidebar-accent-foreground hover:text-sidebar-accent-foreground" 
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground/90 group-hover:text-sidebar-foreground/90"
            )}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {isExpanded && (
          <div className="space-y-0.5 ml-2 border-l-2 border-sidebar-border/50 pl-3 py-1">
            {filteredItems.map(item => renderMenuItem(item, true))}
          </div>
        )}
      </div>
    )
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {(!isCollapsed || isMobile) && <h1 className="text-xl font-bold text-sidebar-foreground">Manggon Admin</h1>}
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
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {navigation.map((item) => {
            if (isMenuGroup(item)) {
              return renderMenuGroup(item)
            }
            return renderMenuItem(item)
          })}
        </TooltipProvider>
      </nav>

      {/* Footer */}
      {(!isCollapsed || isMobile) && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-primary-foreground">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{userName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{userEmail}</p>
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
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transform transition-transform duration-300 md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {sidebarContent}
        </div>

        {/* Desktop sidebar (hidden on mobile) */}
        <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-50 md:bg-sidebar md:text-sidebar-foreground md:border-r md:border-sidebar-border transition-all duration-300"
          style={{ width: isCollapsed ? '64px' : '256px' }}>
          {sidebarContent}
        </div>
      </>
    )
  }

  // Desktop sidebar
  return (
    <div className={cn(
      "hidden md:flex flex-col fixed inset-y-0 left-0 z-50 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {sidebarContent}
    </div>
  )
}

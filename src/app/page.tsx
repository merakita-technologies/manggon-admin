'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Building, Calendar, CreditCard, Loader2, TrendingUp, TrendingDown, ArrowRight, Bed, DollarSign, ArrowUp, ArrowDown } from 'lucide-react'
import { graphqlClient } from '@/lib/graphql'
import Link from 'next/link'
import { formatDate } from '@/lib/date-utils'
import { formatCurrency } from '@/lib/currency-utils'
import { useI18n } from '@/contexts/i18n-context'

type TimePeriod = 'today' | '7d' | '30d' | 'all'

export default function Dashboard() {
  const { t } = useI18n()
  const [userRole, setUserRole] = useState<string>('user')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalRooms: 0,
  })
  const [previousStats, setPreviousStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalRooms: 0,
  })
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get user role and ID from localStorage
    if (typeof window !== 'undefined') {
      const userInfo = localStorage.getItem('user_info')
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo)
          setUserRole(user.role || 'user')
        } catch (e) {
          console.error('Error parsing user info:', e)
        }
      }
    }
  }, [])

  const getDateRange = (period: TimePeriod) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (period) {
      case 'today':
        return { start: today, end: now }
      case '7d':
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return { start: sevenDaysAgo, end: now }
      case '30d':
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return { start: thirtyDaysAgo, end: now }
      case 'all':
      default:
        return { start: null, end: null }
    }
  }

  const fetchDashboardData = useCallback(async () => {
    if (!userRole) return // Wait for user role to be set
    
    setIsLoading(true)
    setError(null)
    try {
      // Fetch data based on user role
      const isAdmin = userRole === 'admin'
      
      // Fetch properties (already filtered by owner in backend for owner role)
      const properties = await graphqlClient.getProperties().catch(() => [])
      
      // Fetch bookings based on role
      // Admin: all bookings, Owner: bookings for their properties only
      const bookings = await graphqlClient.getAllBookings().catch(() => [])
      
      // For owner: filter bookings to only include bookings for their properties
      const ownerPropertyIds = properties.map((p: any) => p.id)
      const filteredBookings = isAdmin 
        ? bookings 
        : bookings.filter((b: any) => ownerPropertyIds.includes(b.property?.id))

      // Get date range for current period
      const { start: periodStart, end: periodEnd } = getDateRange(timePeriod)
      
      // Filter bookings by time period
      const periodBookings = periodStart && periodEnd
        ? filteredBookings.filter((b: any) => {
            const bookingDate = new Date(b.bookingDate)
            return bookingDate >= periodStart && bookingDate <= periodEnd
          })
        : filteredBookings

      // Get previous period for comparison
      let previousPeriodBookings: any[] = []
      if (timePeriod !== 'all' && periodStart && periodEnd) {
        const periodDuration = periodEnd.getTime() - periodStart.getTime()
        const previousPeriodStart = new Date(periodStart.getTime() - periodDuration)
        const previousPeriodEnd = periodStart
        
        previousPeriodBookings = filteredBookings.filter((b: any) => {
          const bookingDate = new Date(b.bookingDate)
          return bookingDate >= previousPeriodStart && bookingDate < previousPeriodEnd
        })
      }

      // Calculate stats based on role
      let totalUsers = 0
      if (isAdmin) {
        const users = await graphqlClient.getUsers().catch(() => [])
        totalUsers = users.length
      }

      const totalProperties = properties.length
      const totalBookings = periodBookings.length
      
      // Calculate total rooms
      const totalRooms = properties.reduce((sum: number, p: any) => {
        return sum + (p.rooms?.length || 0)
      }, 0)
      
      // Calculate revenue from completed payments
      const totalRevenue = periodBookings
        .filter((b: any) => b.payment?.status === 'Completed')
        .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)

      // Calculate previous period stats for comparison
      const previousBookings = previousPeriodBookings.length
      const previousRevenue = previousPeriodBookings
        .filter((b: any) => b.payment?.status === 'Completed')
        .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)

      // Store previous stats for trend calculation
      setPreviousStats({
        totalUsers: 0, // Users don't change by period
        totalProperties: 0, // Properties don't change by period
        totalBookings: previousBookings,
        totalRevenue: previousRevenue,
        totalRooms: 0, // Rooms don't change by period
      })

      setStats({
        totalUsers,
        totalProperties,
        totalBookings,
        totalRevenue,
        totalRooms,
      })

      // Get recent bookings (last 5)
      const sortedBookings = [...periodBookings]
        .sort((a: any, b: any) => 
          new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
        )
        .slice(0, 5)
      setRecentBookings(sortedBookings)
    } catch (err: any) {
      setError(err.message || t('dashboard.fetchError'))
      console.error('Error fetching dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userRole, timePeriod, t])

  useEffect(() => {
    // Fetch data after user role is set
    if (userRole) {
      fetchDashboardData()
    }
  }, [userRole, fetchDashboardData])

  // Calculate trend percentage
  const calculateTrend = (current: number, previous: number): { value: number; isPositive: boolean } => {
    if (previous === 0) {
      return { value: current > 0 ? 100 : 0, isPositive: current > 0 }
    }
    const change = ((current - previous) / previous) * 100
    return { value: Math.abs(change), isPositive: change >= 0 }
  }

  // Stat cards based on user role
  const getStatCards = () => {
    const isAdmin = userRole === 'admin'
    
    if (isAdmin) {
      return [
    { 
      title: t('dashboard.totalUsers'), 
      value: stats.totalUsers.toLocaleString(), 
      icon: Users, 
      href: '/users',
      color: 'text-blue-600',
      trend: null // Users don't change by period
    },
    { 
      title: t('dashboard.totalProperties'), 
      value: stats.totalProperties.toLocaleString(), 
      icon: Building, 
      href: '/properties',
      color: 'text-green-600',
      trend: null // Properties don't change by period
    },
    { 
      title: t('dashboard.totalBookings'), 
      value: stats.totalBookings.toLocaleString(), 
      icon: Calendar, 
      href: '/bookings',
      color: 'text-purple-600',
      trend: calculateTrend(stats.totalBookings, previousStats.totalBookings)
    },
    { 
      title: t('dashboard.totalRevenue'), 
      value: formatCurrency(stats.totalRevenue, { showDecimals: false }), 
      icon: CreditCard, 
      href: '/payments',
      color: 'text-orange-600',
      trend: calculateTrend(stats.totalRevenue, previousStats.totalRevenue)
    },
  ]
    } else {
      // Owner dashboard
      return [
        { 
          title: t('dashboard.totalProperties'), 
          value: stats.totalProperties.toLocaleString(), 
          icon: Building, 
          href: '/properties',
          color: 'text-green-600',
          trend: null
        },
        { 
          title: t('dashboard.totalRooms'), 
          value: stats.totalRooms.toLocaleString(), 
          icon: Bed, 
          href: '/rooms',
          color: 'text-blue-600',
          trend: null
        },
        { 
          title: t('dashboard.totalBookings'), 
          value: stats.totalBookings.toLocaleString(), 
          icon: Calendar, 
          href: '/bookings',
          color: 'text-purple-600',
          trend: calculateTrend(stats.totalBookings, previousStats.totalBookings)
        },
        { 
          title: t('dashboard.totalRevenue'), 
          value: formatCurrency(stats.totalRevenue, { showDecimals: false }), 
          icon: DollarSign, 
          href: '/payments',
          color: 'text-orange-600',
          trend: calculateTrend(stats.totalRevenue, previousStats.totalRevenue)
        },
      ]
    }
  }

  const statCards = getStatCards()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Time Period Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">
              {t('dashboard.welcome')}
            </p>
          </div>
          {/* Time Period Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('dashboard.timePeriod', { defaultValue: 'Period' })}:</span>
            <div className="inline-flex rounded-lg border border-input bg-background p-1">
              {(['today', '7d', '30d', 'all'] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    timePeriod === period
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {period === 'today' ? t('dashboard.today', { defaultValue: 'Today' }) :
                   period === '7d' ? t('dashboard.last7Days', { defaultValue: '7d' }) :
                   period === '30d' ? t('dashboard.last30Days', { defaultValue: '30d' }) :
                   t('dashboard.allTime', { defaultValue: 'All' })}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={fetchDashboardData} variant="outline" className="mt-4">
                {t('common.retry', { defaultValue: 'Try Again' })}
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Stats Cards with Trends */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon
                const trend = stat.trend
                return (
                  <Link key={stat.title} href={stat.href}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {stat.title}
                        </CardTitle>
                        <Icon className={`h-4 w-4 ${stat.color}`} />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        {trend && timePeriod !== 'all' && (
                          <div className={`flex items-center gap-1 mt-1 text-xs ${
                            trend.isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {trend.isPositive ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            <span className="font-medium">
                              {trend.value.toFixed(1)}%
                            </span>
                            <span className="text-muted-foreground">
                              vs previous period
                            </span>
                          </div>
                        )}
                        {(!trend || timePeriod === 'all') && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('common.view')} {t('common.details', { defaultValue: 'details' })}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            {/* Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t('dashboard.recentBookings')}</CardTitle>
                    <Link href="/bookings">
                      <Button variant="ghost" size="sm">
                        {t('common.view')} {t('common.all')}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                  <CardDescription>
                    {t('dashboard.recentActivity')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentBookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t('dashboard.noRecentBookings')}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {recentBookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {booking.user?.fullName || t('common.unknown')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.property?.name || t('common.unknown')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(booking.bookingDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">
                              {formatCurrency(booking.totalPrice, { showDecimals: false })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.bookingType === 'hourly' 
                                ? `${booking.durationHours || 0} ${t('dashboard.hours')}`
                                : `${booking.durationNights || 0} ${t('dashboard.nights')}`
                              }
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>{t('dashboard.quickActions')}</CardTitle>
                  <CardDescription>
                    {userRole === 'admin' ? t('dashboard.quickActions') : t('properties.title')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/properties">
                    <Button variant="outline" className="w-full justify-start">
                      <Building className="h-4 w-4 mr-2" />
                      {userRole === 'admin' ? t('properties.title') : t('properties.title')}
                    </Button>
                  </Link>
                  <Link href="/rooms">
                    <Button variant="outline" className="w-full justify-start">
                      <Bed className="h-4 w-4 mr-2" />
                      {t('rooms.title')}
                    </Button>
                  </Link>
                  <Link href="/bookings">
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      {t('bookings.title')}
                    </Button>
                  </Link>
                  <Link href="/payments">
                    <Button variant="outline" className="w-full justify-start">
                      <CreditCard className="h-4 w-4 mr-2" />
                      {t('payments.title')}
                    </Button>
                  </Link>
                  <Link href="/reviews">
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {t('reviews.title')}
                    </Button>
                  </Link>
                  {userRole === 'admin' && (
                    <Link href="/users">
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        {t('users.title')}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

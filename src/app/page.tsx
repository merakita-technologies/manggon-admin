'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Building, Calendar, CreditCard, Loader2, TrendingUp, ArrowRight, Bed, DollarSign } from 'lucide-react'
import { graphqlClient } from '@/lib/graphql'
import Link from 'next/link'
import { formatDate } from '@/lib/date-utils'
import { formatCurrency } from '@/lib/currency-utils'
import { useI18n } from '@/contexts/i18n-context'

export default function Dashboard() {
  const { t } = useI18n()
  const [userRole, setUserRole] = useState<string>('user')
  const [stats, setStats] = useState({
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

      // Calculate stats based on role
      let totalUsers = 0
      if (isAdmin) {
        const users = await graphqlClient.getUsers().catch(() => [])
        totalUsers = users.length
      }

      const totalProperties = properties.length
      const totalBookings = filteredBookings.length
      
      // Calculate total rooms
      const totalRooms = properties.reduce((sum: number, p: any) => {
        return sum + (p.rooms?.length || 0)
      }, 0)
      
      // Calculate revenue from completed payments
      const totalRevenue = filteredBookings
        .filter((b: any) => b.payment?.status === 'Completed')
        .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)

      setStats({
        totalUsers,
        totalProperties,
        totalBookings,
        totalRevenue,
        totalRooms,
      })

      // Get recent bookings (last 5)
      const sortedBookings = [...filteredBookings]
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
  }, [userRole])

  useEffect(() => {
    // Fetch data after user role is set
    if (userRole) {
      fetchDashboardData()
    }
  }, [userRole, fetchDashboardData])

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
      color: 'text-blue-600'
    },
    { 
      title: t('dashboard.totalProperties'), 
      value: stats.totalProperties.toLocaleString(), 
      icon: Building, 
      href: '/properties',
      color: 'text-green-600'
    },
    { 
      title: t('dashboard.totalBookings'), 
      value: stats.totalBookings.toLocaleString(), 
      icon: Calendar, 
      href: '/bookings',
      color: 'text-purple-600'
    },
    { 
      title: t('dashboard.totalRevenue'), 
      value: formatCurrency(stats.totalRevenue, { showDecimals: false }), 
      icon: CreditCard, 
      href: '/payments',
      color: 'text-orange-600'
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
          color: 'text-green-600'
        },
        { 
          title: t('dashboard.totalRooms'), 
          value: stats.totalRooms.toLocaleString(), 
          icon: Bed, 
          href: '/rooms',
          color: 'text-blue-600'
        },
        { 
          title: t('dashboard.totalBookings'), 
          value: stats.totalBookings.toLocaleString(), 
          icon: Calendar, 
          href: '/bookings',
          color: 'text-purple-600'
        },
        { 
          title: t('dashboard.totalRevenue'), 
          value: formatCurrency(stats.totalRevenue, { showDecimals: false }), 
          icon: DollarSign, 
          href: '/payments',
          color: 'text-orange-600'
        },
      ]
    }
  }

  const statCards = getStatCards()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.welcome')}
          </p>
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
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon
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
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('common.view')} {t('common.details', { defaultValue: 'details' })}
                        </p>
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

'use client'

import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, User, Building, Search, Loader2, Clock, Moon, MoreHorizontal, Edit, X, CheckCircle } from 'lucide-react'
import { graphqlClient } from '@/lib/graphql'
import { formatDate } from '@/lib/date-utils'
import { formatCurrency } from '@/lib/currency-utils'
import { useI18n } from '@/contexts/i18n-context'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ExportButton } from '@/components/ui/export-button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { PriceRangeFilter } from '@/components/ui/price-range-filter'

const statusVariants = {
  pending: 'secondary',
  pending_payment: 'secondary',
  pending_owner_approval: 'default',
  confirmed: 'default',
  rejected: 'destructive',
  cancelled: 'destructive',
  completed: 'outline',
  Pending: 'secondary',
  Confirmed: 'default',
  Cancelled: 'destructive',
  Completed: 'outline',
  Active: 'default',
  Inactive: 'secondary'
} as const

export default function BookingsPage() {
  const { t } = useI18n()
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null)
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null)
  const [filterMinPrice, setFilterMinPrice] = useState<number | null>(null)
  const [filterMaxPrice, setFilterMaxPrice] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [statusFilter])

  const fetchBookings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Use getAllBookings for admin/owner view
      const data = await graphqlClient.getAllBookings({
        status: statusFilter || undefined,
      })
      setBookings(data)
    } catch (err: any) {
      setError(err.message || t('common.error'))
      console.error('Error fetching bookings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const result = await graphqlClient.updateBookingStatus(bookingId, newStatus)
      if (result.success) {
        alert(t('bookings.updateSuccess'))
        fetchBookings()
      } else {
        alert(result.message || t('bookings.updateError'))
      }
    } catch (err: any) {
      console.error('Error updating booking status:', err)
      alert(err.message || t('common.error'))
    }
  }

  const handleApproveBooking = async (bookingId: string) => {
    if (!confirm(t('bookings.approveConfirm'))) {
      return
    }
    try {
      const result = await graphqlClient.approveBooking(bookingId)
      if (result.success) {
        alert(t('bookings.approveSuccess'))
        fetchBookings()
      } else {
        alert(result.message || t('bookings.approveError'))
      }
    } catch (err: any) {
      console.error('Error approving booking:', err)
      alert(err.message || t('bookings.approveError'))
    }
  }

  const handleRejectBooking = async (bookingId: string) => {
    const reason = prompt(t('bookings.rejectReasonPrompt'))
    if (reason === null) return // User cancelled
    
    if (!confirm(t('bookings.rejectConfirm'))) {
      return
    }
    try {
      const result = await graphqlClient.rejectBooking(bookingId, reason || undefined)
      if (result.success) {
        alert(t('bookings.rejectSuccess'))
        fetchBookings()
      } else {
        alert(result.message || t('bookings.rejectError'))
      }
    } catch (err: any) {
      console.error('Error rejecting booking:', err)
      alert(err.message || t('bookings.rejectError'))
    }
  }

  const [userRole, setUserRole] = useState<string>('user')

  useEffect(() => {
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

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin'

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm(t('bookings.cancelConfirm'))) {
      return
    }

    try {
      const result = await graphqlClient.cancelBooking(bookingId)
      if (result.success) {
        fetchBookings()
      } else {
        alert(result.message || t('bookings.cancelError'))
      }
    } catch (err: any) {
      console.error('Error cancelling booking:', err)
      alert(err.message || t('bookings.cancelError'))
    }
  }

  const filteredBookings = useMemo(() => {
    let filtered = bookings
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((booking) =>
        booking.user?.fullName?.toLowerCase().includes(query) ||
        booking.user?.email?.toLowerCase().includes(query) ||
        booking.property?.name?.toLowerCase().includes(query) ||
        booking.roomUnit?.roomNumber?.toLowerCase().includes(query)
      )
    }
    
    // Date range filter (check-in date)
    if (filterStartDate) {
      filtered = filtered.filter((booking) => {
        const checkInDate = booking.checkInDate ? new Date(booking.checkInDate) : null
        if (!checkInDate) return true
        return checkInDate >= filterStartDate
      })
    }
    if (filterEndDate) {
      filtered = filtered.filter((booking) => {
        const checkInDate = booking.checkInDate ? new Date(booking.checkInDate) : null
        if (!checkInDate) return true
        return checkInDate <= filterEndDate
      })
    }
    
    // Price range filter
    if (filterMinPrice !== null) {
      filtered = filtered.filter((booking) => {
        const price = booking.totalPrice || 0
        return price >= filterMinPrice!
      })
    }
    if (filterMaxPrice !== null) {
      filtered = filtered.filter((booking) => {
        const price = booking.totalPrice || 0
        return price <= filterMaxPrice!
      })
    }
    
    return filtered
  }, [bookings, searchQuery, filterStartDate, filterEndDate, filterMinPrice, filterMaxPrice])

  // Apply status filter on top of filtered bookings
  const bookingsToDisplay = useMemo(() => {
    if (statusFilter) {
      return filteredBookings.filter((booking) => booking.status === statusFilter)
    }
    return filteredBookings
  }, [filteredBookings, statusFilter])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('bookings.management')}</h1>
            <p className="text-muted-foreground mt-1">{t('bookings.managementDescription')}</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t('bookings.newBooking')}
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t('bookings.title')}</CardTitle>
                <CardDescription>
                  {t('bookings.viewAndManage')}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">{t('bookings.allStatus')}</option>
                  <option value="pending_payment">{t('bookings.pendingPayment')}</option>
                  <option value="pending_owner_approval">{t('bookings.pendingOwnerApproval')}</option>
                  <option value="confirmed">{t('bookings.confirmed')}</option>
                  <option value="rejected">{t('bookings.rejected')}</option>
                  <option value="cancelled">{t('bookings.cancelled')}</option>
                  <option value="completed">{t('bookings.completed')}</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('bookings.searchPlaceholder')}
                    className="w-full sm:w-[200px] pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <ExportButton
                  data={bookingsToDisplay.map(b => ({
                    id: b.id,
                    user: b.user?.fullName || '',
                    email: b.user?.email || '',
                    property: b.property?.name || '',
                    room: b.roomUnit?.roomNumber || '',
                    checkIn: b.checkInDate,
                    checkOut: b.checkOutDate,
                    duration: b.bookingType === 'hourly' ? `${b.durationHours} hours` : `${b.durationNights} nights`,
                    totalPrice: b.totalPrice,
                    status: b.status,
                  }))}
                  filename="bookings"
                  formats={['csv', 'excel', 'pdf']}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateRangePicker
                startDate={filterStartDate}
                endDate={filterEndDate}
                onChange={(start, end) => {
                  setFilterStartDate(start)
                  setFilterEndDate(end)
                }}
                label={t('bookings.checkInDate')}
              />
              <PriceRangeFilter
                minPrice={filterMinPrice}
                maxPrice={filterMaxPrice}
                onChange={(min, max) => {
                  setFilterMinPrice(min)
                  setFilterMaxPrice(max)
                }}
                label={t('bookings.priceRange')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={fetchBookings} variant="outline" className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('bookings.allBookings')}</CardTitle>
            <CardDescription>
              {t('bookings.bookingsFound', { count: bookingsToDisplay.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : bookingsToDisplay.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('bookings.noBookingsFound')}</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? t('common.tryAdjusting', { defaultValue: 'Try adjusting your search terms.' }) : t('bookings.noBookings')}
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('bookings.bookingId')}</TableHead>
                      <TableHead>{t('bookings.user')}</TableHead>
                      <TableHead>{t('bookings.property')} / {t('bookings.room')}</TableHead>
                      <TableHead>{t('common.type', { defaultValue: 'Type' })}</TableHead>
                      <TableHead>{t('bookings.checkIn')}</TableHead>
                      <TableHead>{t('bookings.checkOut')}</TableHead>
                      <TableHead>{t('bookings.duration')}</TableHead>
                      <TableHead>{t('bookings.totalPrice')}</TableHead>
                      <TableHead>{t('bookings.status')}</TableHead>
                      <TableHead>{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookingsToDisplay.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-xs">#{booking.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{booking.user?.fullName || t('common.unknown')}</span>
                            <span className="text-xs text-muted-foreground">{booking.user?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{booking.property?.name || t('common.unknown')}</span>
                            <span className="text-xs text-muted-foreground">
                              {t('bookings.room')}: {booking.roomUnit?.roomNumber || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.bookingType === 'hourly' ? (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {t('bookings.hourly')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Moon className="h-3 w-3" />
                              {t('bookings.nightly')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(booking.checkInDate)}</span>
                            {booking.checkInTime && (
                              <span className="text-xs text-muted-foreground">{booking.checkInTime}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(booking.checkOutDate)}</span>
                            {booking.checkOutTime && (
                              <span className="text-xs text-muted-foreground">{booking.checkOutTime}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.bookingType === 'hourly' ? (
                            <span>{booking.durationHours || 0} {t('dashboard.hours')}</span>
                          ) : (
                            <span>{booking.durationNights || 0} {t('dashboard.nights')}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(booking.totalPrice, { showDecimals: false })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariants[booking.status as keyof typeof statusVariants] || 'secondary'}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {booking.status === 'pending_owner_approval' && isOwnerOrAdmin && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApproveBooking(booking.id)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {t('bookings.approveBooking')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleRejectBooking(booking.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    {t('bookings.rejectBooking')}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {booking.status === 'pending_payment' && (
                                <DropdownMenuItem onClick={() => handleCancelBooking(booking.id)}>
                                  <X className="h-4 w-4 mr-2" />
                                  {t('bookings.cancelBooking')}
                                </DropdownMenuItem>
                              )}
                              {booking.status === 'confirmed' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, 'completed')}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {t('bookings.completeBooking')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCancelBooking(booking.id)}>
                                    <X className="h-4 w-4 mr-2" />
                                    {t('bookings.cancelBooking')}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(booking.status === 'pending' || booking.status === 'pending_payment') && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, 'cancelled')}>
                                  <X className="h-4 w-4 mr-2" />
                                  {t('bookings.markAsCancelled')}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
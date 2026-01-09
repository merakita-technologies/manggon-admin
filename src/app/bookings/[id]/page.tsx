'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  User, 
  Building, 
  DollarSign, 
  CreditCard,
  Clock,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Edit,
  Check,
  X
} from 'lucide-react'
import { graphqlClient } from '@/lib/graphql'
import { formatDate, formatRelativeTime } from '@/lib/date-utils'
import { formatCurrency } from '@/lib/currency-utils'
import { useI18n } from '@/contexts/i18n-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const statusVariants = {
  pending_owner_approval: 'default',
  approved: 'default',
  confirmed: 'default',
  rejected: 'destructive',
  cancelled: 'destructive',
  completed: 'outline',
} as const

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const bookingId = params.id as string
  
  const [booking, setBooking] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
    }
  }, [bookingId])

  const fetchBooking = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await graphqlClient.getBooking(bookingId)
      setBooking(data)
    } catch (err: any) {
      setError(err.message || t('common.error'))
      console.error('Error fetching booking:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    setIsUpdating(true)
    try {
      const result = await graphqlClient.approveBooking(bookingId)
      if (result.success) {
        setShowApproveDialog(false)
        alert(t('bookings.approveSuccess'))
        fetchBooking()
      } else {
        alert(result.message || t('bookings.approveError'))
      }
    } catch (err: any) {
      console.error('Error approving booking:', err)
      alert(err.message || t('bookings.approveError'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert(t('bookings.rejectReasonRequired') || 'Please provide a reason for rejection')
      return
    }
    
    setIsUpdating(true)
    try {
      const result = await graphqlClient.rejectBooking(bookingId, rejectReason)
      if (result.success) {
        setShowRejectDialog(false)
        setRejectReason('')
        alert(t('bookings.rejectSuccess'))
        fetchBooking()
      } else {
        alert(result.message || t('bookings.rejectError'))
      }
    } catch (err: any) {
      console.error('Error rejecting booking:', err)
      alert(err.message || t('bookings.rejectError'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!confirm(t('bookings.updateStatusConfirm') || `Are you sure you want to update status to ${newStatus}?`)) {
      return
    }
    
    setIsUpdating(true)
    try {
      const result = await graphqlClient.updateBookingStatus(bookingId, newStatus)
      if (result.success) {
        alert(t('bookings.updateSuccess'))
        fetchBooking()
      } else {
        alert(result.message || t('bookings.updateError'))
      }
    } catch (err: any) {
      console.error('Error updating booking status:', err)
      alert(err.message || t('common.error'))
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return CheckCircle
      case 'rejected':
      case 'cancelled':
        return XCircle
      case 'pending_owner_approval':
        return AlertCircle
      default:
        return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return 'text-green-600'
      case 'rejected':
      case 'cancelled':
        return 'text-red-600'
      case 'pending_owner_approval':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending_owner_approval':
        return t('bookings.pendingOwnerApproval')
      case 'approved':
        return t('bookings.approved') || 'Approved'
      case 'confirmed':
        return t('bookings.confirmed')
      case 'completed':
        return t('bookings.completed')
      case 'rejected':
        return t('bookings.rejected')
      case 'cancelled':
        return t('bookings.cancelled')
      default:
        return status || t('bookings.pending')
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !booking) {
    return (
      <DashboardLayout>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error || t('bookings.notFound')}</p>
            <Button onClick={() => router.push('/bookings')} variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('bookings.backToBookings')}
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  const StatusIcon = getStatusIcon(booking.status)
  const canApprove = booking.status === 'pending_owner_approval'
  const canReject = booking.status === 'pending_owner_approval' || booking.status === 'approved'
  const duration = booking.bookingType === 'hourly' 
    ? `${booking.durationHours || 0} ${t('bookings.hours') || 'hours'}`
    : `${booking.durationNights || 0} ${t('bookings.nights') || 'nights'}`

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/bookings')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t('bookings.bookingDetails')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('bookings.bookingId')}: {booking.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${getStatusColor(booking.status)}`} />
            <Badge variant={statusVariants[booking.status as keyof typeof statusVariants] || 'default'}>
              {getStatusText(booking.status)}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        {(canApprove || canReject) && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {canApprove && (
                  <Button
                    onClick={() => setShowApproveDialog(true)}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {t('bookings.approve')}
                  </Button>
                )}
                {canReject && (
                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isUpdating}
                    variant="destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('bookings.reject')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Information - Use guestNames from booking, not user account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('bookings.guestInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.guestNames && booking.guestNames.length > 0 ? (
                  <div className="space-y-3">
                    {booking.guestNames.map((guestName: string, index: number) => (
                      <div key={index} className={index > 0 ? 'pt-3 border-t' : ''}>
                        <p className="text-sm text-muted-foreground mb-1">
                          {booking.guestNames.length > 1 
                            ? `${t('bookings.guest') || 'Guest'} ${index + 1}`
                            : t('bookings.guestName')}
                        </p>
                        <p className="font-medium">{guestName}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('bookings.guestInformationNotAvailable') || 'Guest information not available'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('bookings.bookingInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('bookings.checkInDate')}</p>
                    <p className="font-medium">{formatDate(booking.checkInDate)}</p>
                    {booking.checkInTime && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {booking.checkInTime}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('bookings.checkOutDate')}</p>
                    <p className="font-medium">{formatDate(booking.checkOutDate)}</p>
                    {booking.checkOutTime && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {booking.checkOutTime}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('bookings.duration')}</p>
                    <p className="font-medium">{duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('bookings.bookingType')}</p>
                    <p className="font-medium capitalize">{booking.bookingType === 'hourly' ? t('bookings.hourly') : t('bookings.nightly')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('bookings.bookingDate')}</p>
                    <p className="font-medium">{formatDate(booking.bookingDate)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(booking.bookingDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('bookings.status')}</p>
                    <Badge variant={statusVariants[booking.status as keyof typeof statusVariants] || 'default'}>
                      {getStatusText(booking.status)}
                    </Badge>
                  </div>
                </div>
                {booking.specialRequests && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">{t('bookings.specialRequests')}</p>
                    <p className="text-sm bg-muted p-3 rounded-md">{booking.specialRequests}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Information */}
            {booking.property && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {t('bookings.propertyInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('bookings.propertyName')}</p>
                    <p className="font-medium text-lg">{booking.property.name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{booking.property.city}, {booking.property.country}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Room Information - Separated from Property */}
            {booking.roomUnit && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('bookings.roomInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('bookings.roomNumber')}</p>
                      <p className="font-medium">{booking.roomUnit.roomNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('bookings.roomType')}</p>
                      <p className="font-medium capitalize">{booking.roomUnit.roomType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('bookings.capacity')}</p>
                      <p className="font-medium">{booking.roomUnit.capacity} {t('bookings.guests')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('bookings.roomPrice')}</p>
                      <p className="font-medium">{formatCurrency(booking.roomUnit.basePricePerNight)} / {t('bookings.night')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            {booking.payment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t('bookings.paymentInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('bookings.paymentStatus')}</p>
                      <Badge variant={booking.payment.status === 'paid' ? 'default' : 'secondary'}>
                        {booking.payment.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('bookings.paymentMethod')}</p>
                      <p className="font-medium">{booking.payment.paymentMethod || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('bookings.paymentAmount')}</p>
                      <p className="font-medium">{formatCurrency(booking.payment.amount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Total Price */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t('bookings.totalPrice')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(booking.totalPrice)}</p>
                {/* Price Breakdown */}
                {booking.priceBreakdown && booking.priceBreakdown.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-semibold mb-3">{t('bookings.priceBreakdown') || 'Rincian Harga'}</p>
                    <div className="space-y-2">
                      {booking.priceBreakdown.map((item: any, index: number) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{formatDate(item.date)}</p>
                              {item.holidayName && (
                                <p className="text-xs text-muted-foreground">{item.holidayName}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(item.basePrice)} {item.multiplier !== 1 ? `× ${item.multiplier}` : ''}
                              </p>
                            </div>
                            <p className="font-medium ml-2">{formatCurrency(item.finalPrice)}</p>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 border-t mt-2">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold">{t('bookings.totalPrice')}</p>
                          <p className="font-bold text-lg">{formatCurrency(booking.totalPrice)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t('bookings.quickActions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {booking.property?.id && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/properties/${booking.property.id}`)}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    {t('bookings.viewProperty')}
                  </Button>
                )}
                {booking.user?.id && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/users/${booking.user.id}`)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {t('bookings.viewGuest')}
                  </Button>
                )}
                {booking.payment && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/payments?bookingId=${booking.id}`)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t('bookings.viewPayment')}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('bookings.approveBooking')}</DialogTitle>
              <DialogDescription>
                {t('bookings.approveConfirm')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleApprove} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('bookings.processing')}
                  </>
                ) : (
                  t('bookings.approve')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('bookings.rejectBooking')}</DialogTitle>
              <DialogDescription>
                {t('bookings.rejectConfirm')}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-md"
                placeholder={t('bookings.rejectReasonPlaceholder')}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setRejectReason('')
                setShowRejectDialog(false)
              }}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleReject} disabled={isUpdating || !rejectReason.trim()} variant="destructive">
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('bookings.processing')}
                  </>
                ) : (
                  t('bookings.reject')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}


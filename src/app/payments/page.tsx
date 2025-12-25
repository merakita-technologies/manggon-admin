'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, CreditCard, Loader2, CheckCircle, XCircle, Clock, MoreHorizontal, RefreshCw, DollarSign } from 'lucide-react'
import { graphqlClient } from '@/lib/graphql'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/lib/currency-utils'
import { useI18n } from '@/contexts/i18n-context'

const statusVariants = {
  pending: 'secondary',
  paid: 'default',
  failed: 'destructive',
  refunded: 'outline',
  Pending: 'secondary',
  Completed: 'default',
  Paid: 'default',
  Failed: 'destructive',
  Refunded: 'outline'
} as const

const paymentMethodIcons = {
  CreditCard: CreditCard,
  DebitCard: CreditCard,
  BankTransfer: CreditCard,
  Cash: CreditCard,
} as const

export default function PaymentsPage() {
  const { t } = useI18n()
  const [payments, setPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [statusFilter])

  const fetchPayments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Use getAllPayments for admin/owner view
      const data = await graphqlClient.getAllPayments({
        status: statusFilter || undefined,
      })
      
      // Get bookings to enrich payment data
      const bookings = await graphqlClient.getAllBookings()
      const paymentsList = data.map((payment: any) => {
        const booking = bookings.find((b: any) => b.payment?.id === payment.id)
        return {
          ...payment,
          bookingId: booking?.id,
          bookingDate: booking?.bookingDate,
          user: booking?.user,
          property: booking?.property,
          totalPrice: booking?.totalPrice || payment.amount,
        }
      })
      
      setPayments(paymentsList)
    } catch (err: any) {
      setError(err.message || t('common.error'))
      console.error('Error fetching payments:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    try {
      const result = await graphqlClient.updatePaymentStatus(paymentId, newStatus)
      if (result.success) {
        fetchPayments()
      } else {
        alert(result.message || t('payments.updateError'))
      }
    } catch (err: any) {
      console.error('Error updating payment status:', err)
      alert(err.message || t('payments.updateError'))
    }
  }

  const handleRefund = async (paymentId: string) => {
    if (!confirm(t('payments.refundConfirm'))) {
      return
    }

    try {
      const result = await graphqlClient.refundPayment(paymentId)
      if (result.success) {
        fetchPayments()
      } else {
        alert(result.message || t('payments.refundError'))
      }
    } catch (err: any) {
      console.error('Error refunding payment:', err)
      alert(err.message || t('common.error'))
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = !searchQuery || 
      payment.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = !statusFilter || payment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const totalRevenue = payments
    .filter((p) => p.status === 'paid' || p.status === 'Completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const pendingPayments = payments.filter((p) => p.status === 'pending' || p.status === 'Pending').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('payments.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('payments.managementDescription')}
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('payments.totalRevenue')}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue, { showDecimals: false })}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('payments.fromCompletedPayments')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('payments.pendingPayments')}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('payments.awaitingConfirmation')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('payments.totalPayments')}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('payments.allTransactions')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t('payments.title')}</CardTitle>
                <CardDescription>
                  {t('payments.managementDescription')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">{t('payments.allStatus')}</option>
                  <option value="pending">{t('payments.pending')}</option>
                  <option value="paid">{t('payments.paid')}</option>
                  <option value="failed">{t('payments.failed')}</option>
                  <option value="refunded">{t('payments.refunded')}</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('payments.searchPlaceholder')}
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
              <Button onClick={fetchPayments} variant="outline" className="mt-4">
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('payments.title')}</CardTitle>
            <CardDescription>
              {filteredPayments.length} {t('payments.payment', { defaultValue: 'payment' })}{filteredPayments.length !== 1 ? 's' : ''} {t('common.found', { defaultValue: 'found' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('payments.noPaymentsFound')}</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? t('common.tryAdjusting', { defaultValue: 'Try adjusting your search terms.' }) : t('payments.noPaymentsProcessed')}
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('payments.paymentId')}</TableHead>
                      <TableHead>{t('payments.user')}</TableHead>
                      <TableHead>{t('payments.property')}</TableHead>
                      <TableHead>{t('payments.amount')}</TableHead>
                      <TableHead>{t('payments.method')}</TableHead>
                      <TableHead>{t('payments.status')}</TableHead>
                      <TableHead>{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">#{payment.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{payment.user?.fullName || t('common.unknown')}</span>
                            <span className="text-xs text-muted-foreground">{payment.user?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{payment.property?.name || t('common.unknown')}</span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(payment.amount, { showDecimals: false })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.paymentMethod || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariants[payment.status as keyof typeof statusVariants] || 'secondary'}>
                            {(payment.status === 'paid' || payment.status === 'Completed' || payment.status === 'Paid') && <CheckCircle className="h-3 w-3 mr-1" />}
                            {(payment.status === 'failed' || payment.status === 'Failed') && <XCircle className="h-3 w-3 mr-1" />}
                            {(payment.status === 'pending' || payment.status === 'Pending') && <Clock className="h-3 w-3 mr-1" />}
                            {payment.status}
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
                              {(payment.status === 'pending' || payment.status === 'Pending') && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(payment.id, 'paid')}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              {(payment.status === 'paid' || payment.status === 'Paid' || payment.status === 'Completed') && (
                                <DropdownMenuItem onClick={() => handleRefund(payment.id)}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Refund Payment
                                </DropdownMenuItem>
                              )}
                              {(payment.status === 'pending' || payment.status === 'Pending') && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(payment.id, 'failed')}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {t('payments.markAsFailed')}
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



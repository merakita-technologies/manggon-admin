'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Package, 
  Loader2, 
  Star, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Truck,
  ShoppingBag,
  Calendar,
  DollarSign,
  MoreHorizontal,
  CheckCircle,
  Ship
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { graphqlClient } from '@/lib/graphql'
import { formatCurrency } from '@/lib/currency-utils'
import { useI18n } from '@/contexts/i18n-context'

export default function OrdersPage() {
  const { t } = useI18n()
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
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

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const isAdmin = userRole === 'admin'

  const fetchOrders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : undefined
      const data = await graphqlClient.getOrders(params)
      setOrders(data)
    } catch (err: any) {
      setError(err.message || t('common.error'))
      console.error('Error fetching orders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(t('orders.cancelConfirm'))) {
      return
    }

    try {
      const result = await graphqlClient.updateOrderStatus(orderId, 'cancelled')
      if (result.success) {
        alert(t('orders.cancelSuccess'))
        fetchOrders()
      } else {
        alert(result.message || t('orders.cancelError'))
      }
    } catch (err: any) {
      console.error('Error cancelling order:', err)
      alert(err.message || t('orders.cancelError'))
    }
  }

  const handleApproveOrder = async (orderId: string, notes?: string) => {
    try {
      const result = await graphqlClient.approveOrder(orderId, notes)
      if (result.success) {
        alert(t('orders.approveSuccess'))
        fetchOrders()
      } else {
        alert(result.message || t('orders.approveError'))
      }
    } catch (err: any) {
      console.error('Error approving order:', err)
      alert(err.message || t('orders.approveError'))
    }
  }

  const handleProcessOrder = async (orderId: string) => {
    try {
      const result = await graphqlClient.processOrder(orderId)
      if (result.success) {
        alert(t('orders.processSuccess'))
        fetchOrders()
      } else {
        alert(result.message || t('orders.processError'))
      }
    } catch (err: any) {
      console.error('Error processing order:', err)
      alert(err.message || t('orders.processError'))
    }
  }

  const handleShipOrder = async (orderId: string, trackingNumber: string, notes?: string) => {
    if (!trackingNumber.trim()) {
      alert(t('orders.trackingNumberRequired'))
      return
    }
    try {
      const result = await graphqlClient.shipOrder(orderId, trackingNumber, notes)
      if (result.success) {
        alert(t('orders.shipSuccess'))
        fetchOrders()
      } else {
        alert(result.message || t('orders.shipError'))
      }
    } catch (err: any) {
      console.error('Error shipping order:', err)
      alert(err.message || t('orders.shipError'))
    }
  }

  const handleCompleteOrder = async (orderId: string) => {
    if (!confirm(t('orders.completeConfirm'))) {
      return
    }
    try {
      const result = await graphqlClient.completeOrder(orderId)
      if (result.success) {
        alert(t('orders.completeSuccess'))
        fetchOrders()
      } else {
        alert(result.message || t('orders.completeError'))
      }
    } catch (err: any) {
      console.error('Error completing order:', err)
      alert(err.message || t('orders.completeError'))
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      pending: {
        label: t('orders.pending'),
        variant: 'secondary',
        icon: Clock
      },
      confirmed: {
        label: t('orders.confirmed'),
        variant: 'default',
        icon: CheckCircle2
      },
      processing: {
        label: t('orders.processing'),
        variant: 'default',
        icon: Package
      },
      shipped: {
        label: t('orders.shipped'),
        variant: 'default',
        icon: Truck
      },
      completed: {
        label: t('orders.completed'),
        variant: 'default',
        icon: CheckCircle2
      },
      cancelled: {
        label: t('orders.cancelled'),
        variant: 'destructive',
        icon: XCircle
      }
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTrackingSteps = (order: any) => {
    const steps = [
      {
        label: t('orders.orderPlaced'),
        date: order.createdAt,
        completed: true,
        icon: ShoppingBag
      }
    ]

    if (order.status === 'cancelled') {
      steps.push({
        label: t('orders.orderCancelled'),
        date: order.updatedAt,
        completed: true,
        icon: XCircle
      })
      return steps
    }

    // Payment/Confirmation step
    if (order.paymentStatus === 'paid' || ['confirmed', 'processing', 'shipped', 'completed'].includes(order.status)) {
      steps.push({
        label: t('orders.orderConfirmed'),
        date: order.approvedAt || order.updatedAt,
        completed: true,
        icon: CheckCircle2
      })
    }

    // Processing step
    if (['processing', 'shipped', 'completed'].includes(order.status)) {
      steps.push({
        label: t('orders.orderProcessed'),
        date: order.updatedAt,
        completed: true,
        icon: Package
      })
    }

    // Shipped step
    if (['shipped', 'completed'].includes(order.status)) {
      steps.push({
        label: t('orders.orderShipped'),
        date: order.shippedAt || order.updatedAt,
        completed: true,
        icon: Truck
      })
    }

    // Completed step
    if (order.status === 'completed') {
      steps.push({
        label: t('orders.orderDelivered'),
        date: order.updatedAt,
        completed: true,
        icon: CheckCircle2
      })
    }

    return steps
  }

  const filteredOrders = orders.filter((order) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesProduct = order.product?.name?.toLowerCase().includes(query)
      const matchesId = order.id?.toLowerCase().includes(query)
      if (!matchesProduct && !matchesId) return false
    }
    return true
  })

  const totalSpent = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, order) => sum + parseFloat(order.totalPrice || 0), 0)

  const totalPoints = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, order) => sum + parseFloat(order.pointsEarned || 0), 0)

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-8 w-8" />
            {t('orders.title')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('orders.managementDescription')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('orders.allOrders')}</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">{t('orders.orders')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('orders.totalSpent')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              <p className="text-xs text-muted-foreground">{t('orders.completed')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('orders.totalPoints')}</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPoints}</div>
              <p className="text-xs text-muted-foreground">{t('common.points')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>{t('orders.orderHistory')}</CardTitle>
            <CardDescription>{t('orders.filterByStatus')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('orders.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t('orders.allStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('orders.allStatus')}</SelectItem>
                  <SelectItem value="pending">{t('orders.pending')}</SelectItem>
                  <SelectItem value="confirmed">{t('orders.confirmed')}</SelectItem>
                  <SelectItem value="processing">{t('orders.processing')}</SelectItem>
                  <SelectItem value="shipped">{t('orders.shipped')}</SelectItem>
                  <SelectItem value="completed">{t('orders.completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('orders.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('orders.noOrdersFound')}</h3>
                <p className="text-muted-foreground">{t('common.tryAdjusting')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const trackingSteps = getTrackingSteps(order)
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{order.product?.name || t('orders.order')}</CardTitle>
                          {getStatusBadge(order.status)}
                        </div>
                        <CardDescription>
                          {t('orders.orderId')}: {order.id.slice(0, 8)}...
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {formatCurrency(parseFloat(order.totalPrice || 0))}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          +{order.pointsEarned || 0} {t('common.points')}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Product Info */}
                      <div className="flex gap-4">
                        {order.product?.imageUrl ? (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border">
                            <img
                              src={order.product.imageUrl}
                              alt={order.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0 border">
                            <Package className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">{t('orders.quantity')}</p>
                            <p className="font-medium">{order.quantity} {t('common.items')}</p>
                          </div>
                          {order.product?.category && (
                            <Badge variant="outline">{order.product.category}</Badge>
                          )}
                        </div>
                      </div>

                      {/* Payment Status */}
                      {order.paymentStatus && (
                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{t('orders.paymentStatus')}</span>
                            <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                              {order.paymentStatus === 'paid' ? t('orders.paid') : 
                               order.paymentStatus === 'pending' ? t('orders.paymentPending') :
                               order.paymentStatus === 'failed' ? t('orders.paymentFailed') :
                               t('orders.unpaid')}
                            </Badge>
                          </div>
                          {order.trackingNumber && (
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm text-muted-foreground">{t('orders.trackingNumber')}</span>
                              <span className="text-sm font-mono">{order.trackingNumber}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tracking Timeline */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            {t('orders.orderTracking')}
                          </h4>
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4 mr-1" />
                                  {t('common.actions')}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {order.status === 'confirmed' && (
                                  <DropdownMenuItem onClick={() => handleApproveOrder(order.id)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {t('orders.approveOrder')}
                                  </DropdownMenuItem>
                                )}
                                {(order.status === 'confirmed' || order.status === 'processing') && (
                                  <DropdownMenuItem onClick={() => handleProcessOrder(order.id)}>
                                    <Package className="h-4 w-4 mr-2" />
                                    {t('orders.processOrder')}
                                  </DropdownMenuItem>
                                )}
                                {order.status === 'processing' && (
                                  <DropdownMenuItem onClick={() => {
                                    const trackingNumber = prompt(t('orders.enterTrackingNumber'))
                                    if (trackingNumber) {
                                      handleShipOrder(order.id, trackingNumber)
                                    }
                                  }}>
                                    <Ship className="h-4 w-4 mr-2" />
                                    {t('orders.shipOrder')}
                                  </DropdownMenuItem>
                                )}
                                {(order.status === 'processing' || order.status === 'shipped') && (
                                  <DropdownMenuItem onClick={() => handleCompleteOrder(order.id)}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    {t('orders.completeOrder')}
                                  </DropdownMenuItem>
                                )}
                          {order.status === 'pending' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="text-destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    {t('orders.cancelOrder')}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {!isAdmin && order.status === 'pending' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {t('orders.cancelOrder')}
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {trackingSteps.map((step, index) => {
                            const Icon = step.icon
                            return (
                              <div key={index} className="flex items-start gap-3">
                                <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                  step.completed 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${
                                    step.completed ? 'text-foreground' : 'text-muted-foreground'
                                  }`}>
                                    {step.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(step.date).toLocaleDateString('id-ID', {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

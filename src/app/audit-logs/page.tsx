'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FileText, 
  Loader2, 
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  Database,
  RefreshCw
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { format } from 'date-fns'

interface AuditLog {
  id: string
  action: 'create' | 'update' | 'delete'
  entityType: string
  entityId: string
  userId?: string
  userEmail?: string
  userRole?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  description?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  createdAt: string
}

interface AuditLogResponse {
  logs: AuditLog[]
  total: number
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [action, setAction] = useState<string>('')
  const [entityType, setEntityType] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)

  useEffect(() => {
    fetchLogs()
  }, [action, entityType, userRole, search, startDate, endDate, page, limit])

  const fetchLogs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (action) params.append('action', action)
      if (entityType) params.append('entityType', entityType)
      if (userRole) params.append('userRole', userRole)
      if (search) params.append('search', search)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      const data = await apiClient.get<AuditLogResponse>(`/audit-logs?${params.toString()}`)
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      console.error('Error fetching audit logs:', err)
      setError(err.message || 'Failed to load audit logs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setAction('')
    setEntityType('')
    setUserRole('')
    setSearch('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-500'
      case 'update':
        return 'bg-blue-500'
      case 'delete':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all create, update, and delete operations across the system
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter audit logs by various criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All entities</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="room_unit">Room Unit</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="amenity">Amenity</SelectItem>
                    <SelectItem value="addon">Addon</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="tax_settings">Tax Settings</SelectItem>
                    <SelectItem value="location_change_request">Location Change Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>User Role</Label>
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Items per page</Label>
                <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1) }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={handleReset} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Page</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{page} / {totalPages}</div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              Showing {logs.length} of {total.toLocaleString()} logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No audit logs found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Time</th>
                      <th className="text-left p-2">Action</th>
                      <th className="text-left p-2">Entity</th>
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">Role</th>
                      <th className="text-left p-2">IP Address</th>
                      <th className="text-left p-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 text-sm">
                          {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                        </td>
                        <td className="p-2">
                          <Badge className={getActionColor(log.action)}>
                            {log.action.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            <div className="font-medium">{log.entityType}</div>
                            <div className="text-muted-foreground text-xs">{log.entityId}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            {log.userEmail || 'N/A'}
                          </div>
                        </td>
                        <td className="p-2">
                          {log.userRole && (
                            <Badge variant="outline">{log.userRole}</Badge>
                          )}
                        </td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {log.ipAddress || 'N/A'}
                        </td>
                        <td className="p-2 text-sm text-muted-foreground max-w-md truncate">
                          {log.description || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Users, 
  Star, 
  Calendar, 
  TrendingUp,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { User } from '@/types/user'
import { formatDate, formatRelativeTime, isCurrentMonth } from '@/lib/date-utils'
import { mockUsers, statusBadgeVariants } from './constants'
import { useUsers } from '@/hooks/useUsers'
import { useI18n } from '@/contexts/i18n-context'
import { UserFormModal } from '@/components/users/user-form-modal'
import { ExportButton } from '@/components/ui/export-button'
import { DateRangePicker } from '@/components/ui/date-range-picker'

export default function UsersPage() {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null)
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null)
  const { users: apiUsers, isLoading, error, fetchUsers, deleteUser, setError } = useUsers()
  
  // Use API users if available, otherwise fallback to mock data
  const allUsers = apiUsers.length > 0 ? apiUsers : mockUsers

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Filter users based on search query and date range
  const filteredUsers = useMemo(() => {
    let filtered = allUsers

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.full_name.toLowerCase().includes(query) ||
        user.phone_number.includes(query)
      )
    }

    // Date range filter (registration date)
    if (filterStartDate) {
      filtered = filtered.filter(user => {
        const regDate = user.registration_date ? new Date(user.registration_date) : null
        if (!regDate) return true
        return regDate >= filterStartDate
      })
    }
    if (filterEndDate) {
      filtered = filtered.filter(user => {
        const regDate = user.registration_date ? new Date(user.registration_date) : null
        if (!regDate) return true
        return regDate <= filterEndDate
      })
    }

    return filtered
  }, [searchQuery, allUsers, filterStartDate, filterEndDate])

  // Stats calculation
  const stats = useMemo(() => {
    const totalUsers = allUsers.length
    const activeUsers = allUsers.filter(u => u.status === 'active').length
    const newThisMonth = allUsers.filter(u => isCurrentMonth(u.registration_date)).length
    const avgLoyaltyPoints = totalUsers > 0
      ? Math.round(allUsers.reduce((sum, u) => sum + u.loyalty_points, 0) / totalUsers)
      : 0

    return { totalUsers, activeUsers, newThisMonth, avgLoyaltyPoints }
  }, [allUsers])

  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Handler functions
  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsUserModalOpen(true)
  }

  const handleViewDetails = (user: User) => {
    // For now, open edit modal. Can be enhanced with detail view later
    handleEditUser(user)
  }

  const handleDeleteUser = async (user: User) => {
    if (confirm(t('users.deleteConfirm', { name: user.full_name }))) {
      try {
        await deleteUser(user.user_id)
      } catch (err) {
        console.error('Error deleting user:', err)
        alert(t('users.deleteError'))
      }
    }
  }

  const handleAddUser = () => {
    setSelectedUser(null)
    setIsUserModalOpen(true)
  }

  const handleUserModalSuccess = () => {
    fetchUsers()
    setIsUserModalOpen(false)
    setSelectedUser(null)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled automatically by the filteredUsers computation
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">{t('users.errorLoadingUsers')}</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setError(null)}>{t('common.retry')}</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('users.management')}</h1>
            <p className="text-muted-foreground mt-1.5">
              {t('users.managementDescription')}
            </p>
          </div>
          <Button 
            onClick={handleAddUser} 
            className="sm:w-auto w-full"
            aria-label={t('users.addUser')}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('users.addUser')}
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('users.totalUsers')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.newThisMonth} {t('users.newThisMonth')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('users.activeUsers')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalUsers > 0 
                  ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}${t('users.ofTotal')}`
                  : t('users.noUsersYet')
                }
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('users.avgLoyalty', { defaultValue: 'Avg. Loyalty' })}</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgLoyaltyPoints}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('users.averagePoints', { defaultValue: 'Average points per user' })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('users.newThisMonthTitle', { defaultValue: 'New This Month' })}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('users.recentRegistrations', { defaultValue: 'Recent registrations' })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t('users.userManagement')}</CardTitle>
                <CardDescription>
                  {t('users.searchFilterManage')}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search 
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" 
                      aria-hidden="true"
                    />
                    <Input
                      type="search"
                      placeholder={t('users.searchPlaceholder')}
                      className="w-full sm:w-[300px] pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label={t('users.searchPlaceholder')}
                    />
                  </div>
                </form>
                <ExportButton
                  data={filteredUsers.map(u => ({
                    id: u.user_id,
                    username: u.username,
                    email: u.email,
                    fullName: u.full_name,
                    phoneNumber: u.phone_number,
                    role: u.role,
                    status: u.status,
                    loyaltyPoints: u.loyalty_points,
                    registrationDate: u.registration_date,
                  }))}
                  filename="users"
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
                label={t('users.registrationDate')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t('users.allUsers')}</CardTitle>
                <CardDescription>
                  {t('users.usersFound', { count: filteredUsers.length })}
                  {searchQuery && (
                    <span className="ml-1">
                      {t('users.for')} &quot;<span className="font-medium">{searchQuery}</span>&quot;
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState />
            ) : filteredUsers.length === 0 ? (
              <EmptyState 
                searchQuery={searchQuery} 
                onClearSearch={() => setSearchQuery('')}
                onAddUser={handleAddUser}
              />
            ) : (
              <div className="rounded-md border overflow-hidden">
                <div className="relative w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">{t('users.user')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('users.contact')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('users.registration')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('users.lastLogin')}</TableHead>
                        <TableHead className="whitespace-nowrap text-right">{t('users.loyaltyPoints')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('users.status')}</TableHead>
                        <TableHead className="whitespace-nowrap w-[80px] text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <UserTableRow
                          key={user.user_id}
                          user={user}
                          onEdit={handleEditUser}
                          onViewDetails={handleViewDetails}
                          onDelete={handleDeleteUser}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Form Modal */}
      <UserFormModal
        open={isUserModalOpen}
        onOpenChange={setIsUserModalOpen}
        user={selectedUser ? {
          id: selectedUser.user_id.toString(),
          email: selectedUser.email,
          firstName: selectedUser.full_name.split(' ')[0],
          lastName: selectedUser.full_name.split(' ').slice(1).join(' '),
          phoneNumber: selectedUser.phone_number,
          role: selectedUser.role || 'user',
          isActive: selectedUser.status === 'active',
          emailVerified: false, // Default, can be enhanced
          loyaltyPoints: selectedUser.loyalty_points,
        } : undefined}
        onSuccess={handleUserModalSuccess}
      />
    </DashboardLayout>
  )
}

// User Table Row Component
interface UserTableRowProps {
  user: User
  onEdit: (user: User) => void
  onViewDetails: (user: User) => void
  onDelete: (user: User) => void
}

function UserTableRow({ user, onEdit, onViewDetails, onDelete }: UserTableRowProps) {
  const { t } = useI18n()
  const statusVariant = user.status 
    ? statusBadgeVariants[user.status] 
    : 'secondary'

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-sm">{user.full_name}</span>
          <span className="text-xs text-muted-foreground">@{user.username}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">{user.email}</span>
          <span className="text-xs text-muted-foreground">{user.phone_number}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm whitespace-nowrap">
          {formatDate(user.registration_date)}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm whitespace-nowrap">
          {formatRelativeTime(user.last_login)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <Badge variant="secondary" className="font-mono text-xs">
          {user.loyalty_points.toLocaleString()}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant} className="capitalize">
          {user.status || t('common.unknown')}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              aria-label={`${t('common.actions')} ${t('users.for')} ${user.full_name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => onViewDetails(user)}>
              <Eye className="h-4 w-4 mr-2" />
              {t('common.view')} {t('common.details')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(user)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('users.editUser')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onSelect={() => onDelete(user)}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('users.deleteUser')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// Loading State Component
function LoadingState() {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">{t('users.loadingUsers')}</p>
      </div>
    </div>
  )
}

// Empty State Component
interface EmptyStateProps {
  searchQuery: string
  onClearSearch: () => void
  onAddUser: () => void
}

function EmptyState({ searchQuery, onClearSearch, onAddUser }: EmptyStateProps) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">
        {searchQuery ? t('users.noUsersFound') : t('users.noUsersYetMessage')}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {searchQuery 
          ? t('users.noUsersMatch', { searchQuery })
          : t('users.getStarted')
        }
      </p>
      {searchQuery ? (
        <Button variant="outline" onClick={onClearSearch}>
          {t('users.clearSearch')}
        </Button>
      ) : (
        <Button onClick={onAddUser}>
          <Plus className="h-4 w-4 mr-2" />
          {t('users.addUser')}
        </Button>
      )}
    </div>
  )
}

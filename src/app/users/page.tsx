'use client'

import { useState, useMemo, useEffect } from 'react'
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

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { users: apiUsers, isLoading, error, fetchUsers, deleteUser, setError } = useUsers()
  
  // Use API users if available, otherwise fallback to mock data
  const allUsers = apiUsers.length > 0 ? apiUsers : mockUsers

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers

    const query = searchQuery.toLowerCase()
    return allUsers.filter(user =>
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.full_name.toLowerCase().includes(query) ||
      user.phone_number.includes(query)
    )
  }, [searchQuery, allUsers])

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

  // Handler functions
  const handleEditUser = (user: User) => {
    console.log('Edit user:', user)
    // In real app: router.push(`/users/${user.user_id}/edit`)
  }

  const handleViewDetails = (user: User) => {
    console.log('View user details:', user)
    // In real app: router.push(`/users/${user.user_id}`)
  }

  const handleDeleteUser = async (user: User) => {
    if (confirm(`Are you sure you want to delete user ${user.full_name}?`)) {
      try {
        await deleteUser(user.user_id)
      } catch (err) {
        console.error('Error deleting user:', err)
        alert('Failed to delete user. Please try again.')
      }
    }
  }

  const handleAddUser = () => {
    console.log('Add new user')
    // In real app: router.push('/users/new')
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
              <CardTitle className="text-destructive">Error Loading Users</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setError(null)}>Try Again</Button>
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Users Management</h1>
            <p className="text-muted-foreground mt-1.5">
              Manage system users and their data
            </p>
          </div>
          <Button 
            onClick={handleAddUser} 
            className="sm:w-auto w-full"
            aria-label="Add new user"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.newThisMonth} this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalUsers > 0 
                  ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total`
                  : 'No users'
                }
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Loyalty</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgLoyaltyPoints}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Average points per user
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Recent registrations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Search, filter, and manage system users
                </CardDescription>
              </div>
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <Search 
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" 
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="w-full sm:w-[300px] pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search users by name, email, username, or phone number"
                  />
                </div>
              </form>
            </div>
          </CardHeader>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                  {searchQuery && (
                    <span className="ml-1">
                      for &quot;<span className="font-medium">{searchQuery}</span>&quot;
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
                        <TableHead className="whitespace-nowrap">User</TableHead>
                        <TableHead className="whitespace-nowrap">Contact</TableHead>
                        <TableHead className="whitespace-nowrap">Registration</TableHead>
                        <TableHead className="whitespace-nowrap">Last Login</TableHead>
                        <TableHead className="whitespace-nowrap text-right">Loyalty Points</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap w-[80px] text-right">Actions</TableHead>
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
          {user.status || 'unknown'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              aria-label={`Actions for ${user.full_name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => onViewDetails(user)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(user)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onSelect={() => onDelete(user)}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// Loading State Component
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading users...</p>
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
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">
        {searchQuery ? 'No users found' : 'No users yet'}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {searchQuery 
          ? `No users match your search for "${searchQuery}". Try adjusting your search terms.`
          : 'Get started by adding your first user to the system.'
        }
      </p>
      {searchQuery ? (
        <Button variant="outline" onClick={onClearSearch}>
          Clear Search
        </Button>
      ) : (
        <Button onClick={onAddUser}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      )}
    </div>
  )
}

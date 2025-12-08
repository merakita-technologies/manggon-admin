import { useState, useCallback } from 'react'
import { User, SearchFilters } from '@/types/user'
import { apiClient } from '@/lib/api'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async (filters?: Partial<SearchFilters>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.getUsers({
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        search: filters?.search,
      })
      
      // Backend returns { data: User[], meta: {...} }
      // Handle both direct array and paginated response
      const usersData = Array.isArray(response) ? response : (response.data || [])
      
      // Transform backend response to match frontend User type
      const transformedUsers = usersData.map((user: any) => ({
        user_id: parseInt(user.id) || 0,
        username: user.email?.split('@')[0] || 'user',
        email: user.email || '',
        full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
        phone_number: user.phoneNumber || '-',
        registration_date: user.createdAt || new Date().toISOString(),
        last_login: user.lastLogin || user.updatedAt || new Date().toISOString(),
        status: user.isActive ? 'active' : 'inactive',
        loyalty_points: user.loyaltyPoints || 0,
      }))
      
      setUsers(transformedUsers)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
      console.error('Error fetching users:', err)
      // Don't set users to empty array on error, keep previous state
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteUser = useCallback(async (userId: number) => {
    try {
      await apiClient.deleteUser(userId.toString())
      setUsers(prev => prev.filter(user => user.user_id !== userId))
    } catch (err: any) {
      setError(err.message || 'Failed to delete user')
      console.error('Error deleting user:', err)
      throw err
    }
  }, [])

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    deleteUser,
    setError
  }
}
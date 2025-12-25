import { useState, useCallback } from 'react'
import { User, SearchFilters } from '@/types/user'
import { graphqlClient } from '@/lib/graphql'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async (filters?: Partial<SearchFilters>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Get users from GraphQL
      // Note: Backend might need a dedicated users query
      // For now, we get users from properties owners and bookings
      const usersData = await graphqlClient.getUsers()
      
      // Apply search filter if provided
      let filteredUsers = usersData
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filteredUsers = usersData.filter((user: any) =>
          user.email?.toLowerCase().includes(searchLower) ||
          user.fullName?.toLowerCase().includes(searchLower) ||
          user.phoneNumber?.includes(searchLower)
        )
      }
      
      // Transform GraphQL response to match frontend User type
      const transformedUsers = filteredUsers.map((user: any, index: number) => ({
        user_id: parseInt(user.id?.replace(/\D/g, '') || `${index}`) || index + 1,
        username: user.email?.split('@')[0] || 'user',
        email: user.email || '',
        full_name: user.fullName || 'Unknown User',
        phone_number: user.phoneNumber || '-',
        registration_date: new Date().toISOString(), // GraphQL schema doesn't have createdAt for users yet
        last_login: new Date().toISOString(), // GraphQL schema doesn't have lastLogin yet
        status: 'active' as const, // Default to active
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
      // GraphQL mutation for delete user would need to be added to backend
      // For now, just remove from local state
      setUsers(prev => prev.filter(user => user.user_id !== userId))
      // TODO: Implement delete user mutation in GraphQL
      throw new Error('Delete user mutation not yet implemented in GraphQL backend')
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
'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useI18n } from '@/contexts/i18n-context'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'owner' | 'admin' | 'user'
}

const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/resend-verification', '/verify-email']

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const checkAuth = async () => {
    // Allow public routes
    if (publicRoutes.includes(pathname)) {
      setIsAuthenticated(true)
      setIsLoading(false)
      return
    }

    // Check for token in localStorage
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    const token = localStorage.getItem('auth_token')
    const userInfo = localStorage.getItem('user_info')

    console.log('AuthGuard check:', { pathname, hasToken: !!token, hasUserInfo: !!userInfo })

    if (!token) {
      // No token, redirect to login
      console.log('No token found, redirecting to login')
      router.push('/auth/login')
      setIsLoading(false)
      return
    }

    // Check user role if required
    if (requiredRole && userInfo) {
      try {
        const user = JSON.parse(userInfo)
        const userRole = user.role

        console.log('User role check:', { requiredRole, userRole })

        // Admin can access everything
        if (userRole === 'admin') {
          setIsAuthenticated(true)
          setIsLoading(false)
          return
        }

        // Check if user has required role
        if (requiredRole === 'owner' && userRole !== 'owner' && userRole !== 'admin') {
          console.log('Access denied: user role does not match required role')
          router.push('/auth/login')
          setIsLoading(false)
          return
        }

        if (requiredRole === 'user' && !['user', 'owner', 'admin'].includes(userRole)) {
          console.log('Access denied: user role does not match required role')
          router.push('/auth/login')
          setIsLoading(false)
          return
        }
      } catch (e) {
        console.error('Error parsing user info:', e)
        router.push('/auth/login')
        setIsLoading(false)
        return
      }
    }

    console.log('Authentication successful, allowing access')
    setIsAuthenticated(true)
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}


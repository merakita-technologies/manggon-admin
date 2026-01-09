'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function useNavigationLoading() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const prevPathnameRef = useRef<string | null>(null)
  const prevSearchParamsRef = useRef<string | null>(null)

  useEffect(() => {
    const currentPathname = pathname
    const currentSearchParams = searchParams.toString()
    
    // Exclude chat page from global loading (it has its own smooth loading logic)
    const isChatPage = currentPathname === '/chat'
    
    // Check if pathname or searchParams actually changed
    const pathnameChanged = prevPathnameRef.current !== currentPathname
    const searchParamsChanged = prevSearchParamsRef.current !== currentSearchParams
    
    if (pathnameChanged || searchParamsChanged) {
      // Only show loading if it's a real navigation (not initial load) and not chat page
      if (prevPathnameRef.current !== null && !isChatPage) {
        setIsLoading(true)
        
        // Set loading to false after page loads
        const timer = setTimeout(() => {
          setIsLoading(false)
        }, 300)

        return () => clearTimeout(timer)
      }
      
      // Update refs
      prevPathnameRef.current = currentPathname
      prevSearchParamsRef.current = currentSearchParams
    }
  }, [pathname, searchParams])

  // Initialize refs on mount
  useEffect(() => {
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname
      prevSearchParamsRef.current = searchParams.toString()
    }
  }, [pathname, searchParams])

  return isLoading
}

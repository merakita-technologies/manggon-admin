'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { PropertyMap } from '@/components/map/property-map'
import { MapPropertyPin } from '@/types/map'
import { apiClient } from '@/lib/api'
import { Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function MapPage() {
  const [properties, setProperties] = useState<MapPropertyPin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchMapProperties()
  }, [])

  const fetchMapProperties = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiClient.get<MapPropertyPin[]>('/properties/map')
      setProperties(data)
    } catch (err: any) {
      console.error('Error fetching map properties:', err)
      setError(err.message || 'Failed to load properties')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePropertyClick = (property: MapPropertyPin) => {
    router.push(`/properties?propertyId=${property.id}`)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-gray-400" />
            <p className="mt-4 text-gray-600">Loading map properties...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={fetchMapProperties}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-100px)] w-full">
        <PropertyMap
          properties={properties}
          onPropertyClick={handlePropertyClick}
        />
      </div>
    </DashboardLayout>
  )
}

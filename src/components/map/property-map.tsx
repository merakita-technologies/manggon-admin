'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapPropertyPin } from '@/types/map'
import { MapPin, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/currency-utils'

// Dynamic import to disable SSR for Mapbox
const MapboxMap = dynamic(() => import('./mapbox-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
})

interface PropertyMapProps {
  properties: MapPropertyPin[]
  center?: [number, number]
  zoom?: number
  onPropertyClick?: (property: MapPropertyPin) => void
}

export function PropertyMap({ 
  properties, 
  center = [-7.7971, 110.3705], // Default to Yogyakarta
  zoom = 12,
  onPropertyClick 
}: PropertyMapProps) {
  const [selectedProperty, setSelectedProperty] = useState<MapPropertyPin | null>(null)

  const handleMarkerClick = (property: MapPropertyPin) => {
    setSelectedProperty(property)
    if (onPropertyClick) {
      onPropertyClick(property)
    }
  }

  const handleClosePopup = () => {
    setSelectedProperty(null)
  }

  // Calculate center from properties if not provided
  const mapCenter = center || (() => {
    if (properties.length === 0) return center
    const validProps = properties.filter(p => p.lat && p.lng)
    if (validProps.length === 0) return center
    
    const avgLat = validProps.reduce((sum, p) => sum + p.lat, 0) / validProps.length
    const avgLng = validProps.reduce((sum, p) => sum + p.lng, 0) / validProps.length
    return [avgLat, avgLng] as [number, number]
  })()

  return (
    <div className="relative w-full h-full">
      <MapboxMap
        properties={properties}
        center={mapCenter}
        zoom={zoom}
        onMarkerClick={handleMarkerClick}
      />
      
      {/* Popup Card */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-4 right-4 z-10 max-w-md mx-auto">
          <Card className="shadow-xl border-2">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {selectedProperty.image && (
                  <img
                    src={selectedProperty.image}
                    alt={selectedProperty.name}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 truncate">
                        {selectedProperty.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-600 truncate">
                          {selectedProperty.city}
                        </p>
                      </div>
                      {selectedProperty.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {selectedProperty.rating.toFixed(1)}
                          </span>
                          {selectedProperty.reviewCount > 0 && (
                            <span className="text-sm text-gray-500">
                              ({selectedProperty.reviewCount})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClosePopup}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {selectedProperty.facilities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedProperty.facilities.slice(0, 3).map((facility, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                        >
                          {facility}
                        </span>
                      ))}
                      {selectedProperty.facilities.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-gray-500">
                          +{selectedProperty.facilities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(selectedProperty.price)}
                      </p>
                      <p className="text-xs text-gray-500">per night</p>
                    </div>
                    {onPropertyClick && (
                      <Button
                        size="sm"
                        onClick={() => onPropertyClick(selectedProperty)}
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

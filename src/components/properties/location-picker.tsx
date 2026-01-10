'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import mapboxgl from 'mapbox-gl'
import { MapPin } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

// Import Mapbox CSS
if (typeof window !== 'undefined') {
  require('mapbox-gl/dist/mapbox-gl.css')
}

interface LocationPickerProps {
  latitude: number | string
  longitude: number | string
  onLocationChange: (lat: number, lng: number) => void
  className?: string
}

export function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  className = '',
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  // Function to update marker
  const updateMarker = (lat: number, lng: number) => {
    if (!map.current) return

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove()
    }

    // Create custom marker
    const el = document.createElement('div')
    el.className = 'location-marker'
    el.style.width = '32px'
    el.style.height = '32px'
    el.style.borderRadius = '50%'
    el.style.backgroundColor = '#3b82f6'
    el.style.border = '3px solid white'
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
    el.style.cursor = 'pointer'

    // Add marker to map
    markerRef.current = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(map.current)
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!mapboxToken) {
      console.error('MAPBOX_ACCESS_TOKEN is not set')
      return
    }

    mapboxgl.accessToken = mapboxToken

    // Default center (Yogyakarta)
    const defaultCenter: [number, number] = [110.3705, -7.7971] // [lng, lat]
    
    // Validate and parse coordinates
    let initialLat: number
    let initialLng: number
    let hasValidCoords = false
    
    if (latitude && longitude) {
      const parsedLat = parseFloat(String(latitude))
      const parsedLng = parseFloat(String(longitude))
      
      // Check if valid numbers and within valid range
      if (!isNaN(parsedLat) && !isNaN(parsedLng) && 
          parsedLat >= -90 && parsedLat <= 90 &&
          parsedLng >= -180 && parsedLng <= 180) {
        initialLat = parsedLat
        initialLng = parsedLng
        hasValidCoords = true
      } else {
        // Invalid coordinates, use default
        initialLat = defaultCenter[1]
        initialLng = defaultCenter[0]
      }
    } else {
      // No coordinates provided, use default
      initialLat = defaultCenter[1]
      initialLng = defaultCenter[0]
    }

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [initialLng, initialLat],
        zoom: hasValidCoords ? 15 : 10,
      })

      map.current.on('load', () => {
        setIsMapReady(true)
        // Update marker when map is ready if we have valid coordinates
        if (hasValidCoords) {
          updateMarker(initialLat, initialLng)
        }
      })

      // Add navigation control
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

      // Handle map click to set location
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat
        onLocationChange(lat, lng)
        updateMarker(lat, lng)
      })
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update marker when coordinates change
  useEffect(() => {
    if (!isMapReady || !map.current) return

    if (!latitude || !longitude) return

    const lat = parseFloat(String(latitude))
    const lng = parseFloat(String(longitude))

    // Validate coordinates before using
    if (!isNaN(lat) && !isNaN(lng) && 
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180) {
      updateMarker(lat, lng)
      // Center map on marker
      map.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1000,
      })
    }
  }, [latitude, longitude, isMapReady])

  return (
    <div className={className}>
      <Label className="mb-2 block">Pilih Lokasi di Peta</Label>
      <p className="text-xs text-muted-foreground mb-3">
        Klik pada peta atau gunakan koordinat manual untuk menentukan lokasi properti
      </p>

      {/* Manual Input */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="space-y-1">
          <Label htmlFor="latitude" className="text-xs">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => {
              const lat = e.target.value
              const lng = longitude
              if (lat && lng) {
                onLocationChange(parseFloat(lat), parseFloat(String(lng)))
              }
            }}
            placeholder="-7.7971"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="longitude" className="text-xs">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => {
              const lat = latitude
              const lng = e.target.value
              if (lat && lng) {
                onLocationChange(parseFloat(String(lat)), parseFloat(lng))
              }
            }}
            placeholder="110.3705"
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="relative border rounded-lg overflow-hidden">
        <div
          ref={mapContainer}
          className="w-full"
          style={{ height: '400px', minHeight: '400px' }}
        />
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Memuat peta...</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        Klik pada peta untuk memilih lokasi, atau masukkan koordinat secara manual
      </p>
    </div>
  )
}

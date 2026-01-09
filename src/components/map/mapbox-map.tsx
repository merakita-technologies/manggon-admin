'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { MapPropertyPin } from '@/types/map'

// Import Mapbox CSS - using dynamic import to avoid SSR issues
if (typeof window !== 'undefined') {
  require('mapbox-gl/dist/mapbox-gl.css')
}

interface MapboxMapProps {
  properties: MapPropertyPin[]
  center: [number, number]
  zoom: number
  onMarkerClick: (property: MapPropertyPin) => void
}

export default function MapboxMap({
  properties,
  center,
  zoom,
  onMarkerClick,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!mapContainer.current) return

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!mapboxToken) {
      console.error('MAPBOX_ACCESS_TOKEN is not set in environment variables')
      return
    }

    mapboxgl.accessToken = mapboxToken

    // Initialize map
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12', // Using Mapbox style with OpenStreetMap data
        center: center,
        zoom: zoom,
      })
    }

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update markers when properties change
  useEffect(() => {
    if (!map.current) return

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Create custom marker HTML
    const createMarkerElement = (property: MapPropertyPin) => {
      const el = document.createElement('div')
      el.className = 'custom-marker'
      el.style.width = '40px'
      el.style.height = '40px'
      el.style.cursor = 'pointer'
      el.style.background = '#3b82f6'
      el.style.border = '3px solid white'
      el.style.borderRadius = '50%'
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      
      // Add price badge
      const priceEl = document.createElement('div')
      priceEl.textContent = `Rp${Math.round(property.price / 1000)}k`
      priceEl.style.fontSize = '9px'
      priceEl.style.fontWeight = 'bold'
      priceEl.style.color = 'white'
      priceEl.style.textAlign = 'center'
      priceEl.style.lineHeight = '1'
      el.appendChild(priceEl)

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onMarkerClick(property)
      })

      return el
    }

    // Add markers for each property
    properties.forEach((property) => {
      if (property.lat && property.lng) {
        const markerEl = createMarkerElement(property)
        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat([property.lng, property.lat])
          .addTo(map.current!)

        markersRef.current.push(marker)
      }
    })

    // Fit bounds if we have properties
    if (properties.length > 0 && map.current) {
      const validProps = properties.filter((p) => p.lat && p.lng)
      if (validProps.length > 0) {
        const bounds = new mapboxgl.LngLatBounds()
        validProps.forEach((prop) => {
          bounds.extend([prop.lng, prop.lat])
        })
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
        })
      }
    }
  }, [properties, onMarkerClick])

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
      style={{ minHeight: '500px' }}
    />
  )
}

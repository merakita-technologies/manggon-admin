/**
 * Google Maps URL Parser
 * Extract Place ID or coordinates from various Google Maps URL formats
 */

export interface GoogleMapsParseResult {
  placeId?: string
  latitude?: number
  longitude?: number
  address?: string
}

/**
 * Parse Google Maps URL to extract Place ID or coordinates
 * Supports:
 * - Short links: https://maps.app.goo.gl/xxxxx
 * - Long links: https://www.google.com/maps/place/.../@lat,lng
 * - Share links: https://maps.google.com/?q=lat,lng
 * - Direct coordinates: lat,lng
 */
export function parseGoogleMapsUrl(url: string): GoogleMapsParseResult | null {
  if (!url || !url.trim()) return null

  const trimmedUrl = url.trim()

  // Check if it's already coordinates (lat,lng format)
  const coordMatch = trimmedUrl.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/)
  if (coordMatch) {
    return {
      latitude: parseFloat(coordMatch[1]),
      longitude: parseFloat(coordMatch[2]),
    }
  }

  try {
    // Short link format: https://maps.app.goo.gl/xxxxx
    if (trimmedUrl.includes('maps.app.goo.gl') || trimmedUrl.includes('goo.gl/maps')) {
      // Extract short link ID
      const shortLinkMatch = trimmedUrl.match(/(?:maps\.app\.goo\.gl|goo\.gl\/maps)\/([A-Za-z0-9_-]+)/)
      if (shortLinkMatch) {
        // For short links, we'll store the full URL as placeId
        // Backend can resolve it or we can resolve it client-side
        return {
          placeId: trimmedUrl, // Store full short link URL
        }
      }
    }

    // Long link format: https://www.google.com/maps/place/Place+Name/@lat,lng
    const placeMatch = trimmedUrl.match(/\/place\/([^/@]+)(?:\/@(-?\d+\.?\d*),(-?\d+\.?\d*))?/)
    if (placeMatch) {
      const result: GoogleMapsParseResult = {}
      
      // Extract Place ID if available (usually in format like ChIJ...)
      const placeIdMatch = trimmedUrl.match(/\/place\/[^/]+\/data=([^&]+)/)
      if (placeIdMatch) {
        // Try to extract from data parameter
        const dataParam = placeIdMatch[1]
        const decoded = decodeURIComponent(dataParam)
        const placeIdInData = decoded.match(/0x[0-9a-fA-F]+:0x[0-9a-fA-F]+|ChIJ[a-zA-Z0-9_-]+/)
        if (placeIdInData) {
          result.placeId = placeIdInData[0]
        }
      }

      // Extract coordinates
      if (placeMatch[2] && placeMatch[3]) {
        result.latitude = parseFloat(placeMatch[2])
        result.longitude = parseFloat(placeMatch[3])
      }

      // Extract address/place name
      const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
      if (placeName && placeName !== 'place') {
        result.address = placeName
      }

      return Object.keys(result).length > 0 ? result : null
    }

    // Share link format: https://maps.google.com/?q=lat,lng or ?q=address
    const shareMatch = trimmedUrl.match(/[?&]q=([^&]+)/)
    if (shareMatch) {
      const query = decodeURIComponent(shareMatch[1])
      
      // Check if query is coordinates
      const coordMatch = query.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/)
      if (coordMatch) {
        return {
          latitude: parseFloat(coordMatch[1]),
          longitude: parseFloat(coordMatch[2]),
        }
      }
      
      // Otherwise it's an address
      return {
        address: query,
      }
    }

    // Direct Google Maps search: https://www.google.com/maps/search/?api=1&query=lat,lng
    const searchMatch = trimmedUrl.match(/[?&]query=([^&]+)/)
    if (searchMatch) {
      const query = decodeURIComponent(searchMatch[1])
      const coordMatch = query.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/)
      if (coordMatch) {
        return {
          latitude: parseFloat(coordMatch[1]),
          longitude: parseFloat(coordMatch[2]),
        }
      }
    }

    // Try to extract Place ID from URL (ChIJ... format)
    const placeIdMatch = trimmedUrl.match(/(ChIJ[a-zA-Z0-9_-]{27})/)
    if (placeIdMatch) {
      return {
        placeId: placeIdMatch[1],
      }
    }

    // If it looks like a Place ID directly (starts with ChIJ)
    if (/^ChIJ[a-zA-Z0-9_-]{27}$/.test(trimmedUrl)) {
      return {
        placeId: trimmedUrl,
      }
    }
  } catch (error) {
    console.error('Error parsing Google Maps URL:', error)
  }

  return null
}

/**
 * Validate if a string looks like a Google Maps URL
 */
export function isGoogleMapsUrl(url: string): boolean {
  if (!url) return false
  
  const patterns = [
    /maps\.app\.goo\.gl/,
    /goo\.gl\/maps/,
    /google\.com\/maps/,
    /maps\.google\.com/,
    /^ChIJ[a-zA-Z0-9_-]{27}$/, // Place ID format
    /^-?\d+\.?\d*,-?\d+\.?\d*$/, // Coordinates format
  ]

  return patterns.some(pattern => pattern.test(url))
}

/**
 * Format Google Maps URL for display
 */
export function formatGoogleMapsUrl(placeId?: string, lat?: number, lng?: number): string | null {
  if (placeId) {
    // If it's a short link ID, return as is
    if (!placeId.startsWith('ChIJ')) {
      return `https://maps.app.goo.gl/${placeId}`
    }
    // Full Place ID
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`
  }
  
  if (lat && lng) {
    return `https://www.google.com/maps?q=${lat},${lng}`
  }
  
  return null
}

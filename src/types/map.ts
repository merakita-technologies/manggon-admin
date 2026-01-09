/**
 * Shared map pin data structure
 * Used by both web (Next.js) and mobile (Flutter) applications
 */
export interface MapPropertyPin {
  id: string
  name: string
  lat: number
  lng: number
  price: number
  image: string | null
  facilities: string[]
  address: string
  city: string
  rating: number
  reviewCount: number
}

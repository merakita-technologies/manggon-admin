'use client'

import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react'
import { Modal, ModalHeader, ModalContent, ModalFooter, ModalTitle, ModalDescription } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { graphqlClient } from '@/lib/graphql'
import { Loader2, AlertCircle, X, Upload, Image as ImageIcon } from 'lucide-react'
import { useI18n } from '@/contexts/i18n-context'
import { BACKEND_BASE_URL } from '@/lib/api-config'
import { parseGoogleMapsUrl, isGoogleMapsUrl } from '@/lib/google-maps-utils'
import dynamic from 'next/dynamic'

// Dynamic import untuk LocationPicker (disable SSR)
const LocationPicker = dynamic(() => import('./location-picker').then(mod => ({ default: mod.LocationPicker })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 flex items-center justify-center bg-muted rounded-lg">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Memuat peta...</p>
      </div>
    </div>
  ),
})

interface PropertyFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property?: any
  onSuccess?: () => void
}

export function PropertyFormModal({ open, onOpenChange, property, onSuccess }: PropertyFormModalProps) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    description: '',
    propertyType: 'hotel',
    imageUrls: [] as string[],
    placeId: '',
    amenities: [] as string[],
    maxGuests: '',
    bedrooms: '',
    bathrooms: '',
    latitude: '',
    longitude: '',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    cancellationPolicy: '',
    isActive: true,
  })
  const [amenityInput, setAmenityInput] = useState('')
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [googleMapsLink, setGoogleMapsLink] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (property) {
      // Format placeId as Google Maps link if exists
      let googleLink = ''
      if (property.placeId) {
        // If it's already a URL, use it directly
        if (property.placeId.startsWith('http')) {
          googleLink = property.placeId
        } else if (property.placeId.startsWith('ChIJ')) {
          // Full Place ID
          googleLink = `https://www.google.com/maps/place/?q=place_id:${property.placeId}`
        } else {
          // Short link ID or other format
          googleLink = `https://maps.app.goo.gl/${property.placeId}`
        }
      }
      
      setFormData({
        name: property.name || '',
        address: property.address || '',
        city: property.city || '',
        country: property.country || '',
        description: property.description || '',
        propertyType: property.propertyType || 'hotel',
        imageUrls: property.imageUrls || [],
        placeId: property.placeId || '',
        amenities: property.amenities || [],
        maxGuests: property.maxGuests?.toString() || '',
        bedrooms: property.bedrooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        latitude: property.latitude?.toString() || '',
        longitude: property.longitude?.toString() || '',
        checkInTime: property.checkInTime || '14:00',
        checkOutTime: property.checkOutTime || '12:00',
        cancellationPolicy: property.cancellationPolicy || '',
        isActive: property.isActive !== undefined ? property.isActive : true,
      })
      setGoogleMapsLink(googleLink)
    } else {
      // Reset form for new property
      setFormData({
        name: '',
        address: '',
        city: '',
        country: '',
        description: '',
        propertyType: 'hotel',
        imageUrls: [],
        placeId: '',
        amenities: [],
        maxGuests: '',
        bedrooms: '',
        bathrooms: '',
        latitude: '',
        longitude: '',
        checkInTime: '14:00',
        checkOutTime: '12:00',
        cancellationPolicy: '',
        isActive: true,
      })
      setGoogleMapsLink('')
    }
    setError(null)
  }, [property, open])

  const handleGoogleMapsLinkChange = (link: string) => {
    setGoogleMapsLink(link)
    
    if (!link.trim()) {
      // Clear placeId if link is empty
      setFormData({ ...formData, placeId: '' })
      return
    }
    
    // Parse Google Maps URL
    const parsed = parseGoogleMapsUrl(link)
    
    if (parsed) {
      // Update placeId if found (store full URL for short links, or Place ID for full IDs)
      if (parsed.placeId) {
        // If it's a short link URL, store the full URL
        // If it's a Place ID (ChIJ...), store just the ID
        const placeIdToStore = link.includes('maps.app.goo.gl') || link.includes('goo.gl/maps')
          ? link // Store full URL for short links
          : parsed.placeId // Store Place ID for full IDs
        setFormData({ ...formData, placeId: placeIdToStore })
      }
      
      // Update coordinates if found
      if (parsed.latitude && parsed.longitude) {
        setFormData({
          ...formData,
          latitude: parsed.latitude.toString(),
          longitude: parsed.longitude.toString(),
        })
      }
      
      // Update address if found
      if (parsed.address && !formData.address) {
        setFormData({ ...formData, address: parsed.address })
      }
    } else {
      // If parsing fails but it looks like a Google Maps URL, store it anyway
      if (isGoogleMapsUrl(link)) {
        setFormData({ ...formData, placeId: link })
      }
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Only include location fields if they are valid
      // For updates: only include if location has actually changed
      // For new properties: always include if valid
      let latitude: number | undefined
      let longitude: number | undefined
      
      if (formData.latitude && formData.longitude) {
        const parsedLat = parseFloat(formData.latitude)
        const parsedLng = parseFloat(formData.longitude)
        
        // Validate coordinates
        if (!isNaN(parsedLat) && !isNaN(parsedLng) &&
            parsedLat >= -90 && parsedLat <= 90 &&
            parsedLng >= -180 && parsedLng <= 180) {
          
          // For updates: check if location actually changed
          if (property) {
            const currentLat = property.latitude ? parseFloat(property.latitude.toString()) : null
            const currentLng = property.longitude ? parseFloat(property.longitude.toString()) : null
            
            // Only include if coordinates actually changed
            const locationChanged = (
              currentLat === null || currentLng === null ||
              Math.abs(currentLat - parsedLat) > 0.000001 ||
              Math.abs(currentLng - parsedLng) > 0.000001
            )
            
            if (locationChanged) {
              latitude = parsedLat
              longitude = parsedLng
            }
            // If location hasn't changed, don't send latitude/longitude (undefined)
          } else {
            // For new properties, always include valid coordinates
            latitude = parsedLat
            longitude = parsedLng
          }
        }
      }

      // Build input object, excluding undefined fields
      const input: any = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        propertyType: formData.propertyType,
        isActive: formData.isActive,
      }
      
      // Only add optional fields if they have values
      if (formData.description) input.description = formData.description
      if (formData.imageUrls.length > 0) input.imageUrls = formData.imageUrls
      if (formData.placeId) input.placeId = formData.placeId
      if (formData.amenities.length > 0) input.amenities = formData.amenities
      if (formData.maxGuests) input.maxGuests = parseInt(formData.maxGuests)
      if (formData.bedrooms) input.bedrooms = parseInt(formData.bedrooms)
      if (formData.bathrooms) input.bathrooms = parseInt(formData.bathrooms)
      if (formData.checkInTime) input.checkInTime = formData.checkInTime
      if (formData.checkOutTime) input.checkOutTime = formData.checkOutTime
      if (formData.cancellationPolicy) input.cancellationPolicy = formData.cancellationPolicy
      
      // Only include location fields if they are valid and changed (for updates) or provided (for new properties)
      if (latitude !== undefined && longitude !== undefined) {
        input.latitude = latitude
        input.longitude = longitude
      }

      let result
      if (property) {
        result = await graphqlClient.updateProperty(property.id, input)
      } else {
        result = await graphqlClient.createProperty(input)
      }

      if (result.success) {
        onSuccess?.()
        onOpenChange(false)
      } else {
        // Check if it's a pending location change request error
        let errorMessage = result.message || t('properties.saveError')
        
        // Map specific error messages to localized versions
        if (result.message?.includes('pending location change request')) {
          errorMessage = t('properties.pendingLocationChangeRequest')
        }
        
        setError(errorMessage)
        // Show alert for better visibility
        alert(errorMessage)
      }
    } catch (err: any) {
      console.error('Error saving property:', err)
      setError(err.message || t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const addAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenityInput.trim()],
      })
      setAmenityInput('')
    }
  }

  const removeAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((a) => a !== amenity),
    })
  }

  const addImageUrl = () => {
    if (imageUrlInput.trim() && !formData.imageUrls.includes(imageUrlInput.trim())) {
      setFormData({
        ...formData,
        imageUrls: [...formData.imageUrls, imageUrlInput.trim()],
      })
      setImageUrlInput('')
    }
  }

  const removeImageUrl = (url: string) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((u) => u !== url),
    })
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const token = localStorage.getItem('auth_token')
      let uploadUrl: string
      
      // If property exists, upload to property-specific endpoint
      // Otherwise, upload to general property upload endpoint
      if (property?.id) {
        uploadUrl = `${BACKEND_BASE_URL}/api/v1/properties/${property.id}/upload-image`
      } else {
        uploadUrl = `${BACKEND_BASE_URL}/api/v1/properties/upload-image`
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(errorData.message || 'Upload failed')
      }

      const uploadResult = await response.json()
      
      // Construct full URL if needed
      const imageUrl = uploadResult.url.startsWith('http') 
        ? uploadResult.url 
        : `${BACKEND_BASE_URL}${uploadResult.url}`
      
      // Add uploaded image URL to form data immediately
      setFormData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, imageUrl],
      }))

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Error uploading image:', error)
      setError(error.message || 'Gagal upload foto')
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-4xl">
      <form onSubmit={handleSubmit} className="flex flex-col" style={{ height: '100%', maxHeight: '90vh' }}>
        <ModalHeader onClose={() => onOpenChange(false)}>
          <div>
            <ModalTitle>{property ? t('properties.editProperty') : t('properties.addProperty')}</ModalTitle>
            <ModalDescription>
              {property ? t('properties.editPropertyDescription') : t('properties.addPropertyDescription')}
            </ModalDescription>
          </div>
        </ModalHeader>

        <ModalContent className="flex-1 overflow-y-auto min-h-0">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t('properties.basicInformation')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('properties.propertyName')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyType">{t('properties.propertyType')} *</Label>
                  <select
                    id="propertyType"
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    required
                  >
                    <option value="hotel">Hotel</option>
                    <option value="villa">Villa</option>
                    <option value="apartment">Apartment</option>
                    <option value="resort">Resort</option>
                    <option value="hostel">Hostel</option>
                    <option value="guesthouse">Guesthouse</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('properties.address')} *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Kota *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">{t('properties.country')} *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('properties.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Detail Properti</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Price per night field removed - pricing is now managed through room units */}
                
                <div className="space-y-2">
                  <Label htmlFor="maxGuests">{t('properties.maxGuests')}</Label>
                  <Input
                    id="maxGuests"
                    type="number"
                    value={formData.maxGuests}
                    onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bedrooms">{t('properties.bedrooms')}</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">{t('properties.bathrooms')}</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkInTime">{t('properties.checkInTime')}</Label>
                  <Input
                    id="checkInTime"
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkOutTime">{t('properties.checkOutTime')}</Label>
                  <Input
                    id="checkOutTime"
                    type="time"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellationPolicy">{t('properties.cancellationPolicy')}</Label>
                <Textarea
                  id="cancellationPolicy"
                  value={formData.cancellationPolicy}
                  onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
                  rows={3}
                  placeholder={t('properties.cancellationPolicy')}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Lokasi</h3>
              
              <LocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={(lat, lng) => {
                  setFormData({
                    ...formData,
                    latitude: lat.toString(),
                    longitude: lng.toString(),
                  })
                }}
              />

              <div className="space-y-2">
                <Label htmlFor="googleMapsLink">Link Google Maps</Label>
                <Input
                  id="googleMapsLink"
                  type="url"
                  value={googleMapsLink}
                  onChange={(e) => handleGoogleMapsLinkChange(e.target.value)}
                  placeholder="https://maps.app.goo.gl/xxxxx atau https://www.google.com/maps/place/..."
                />
                <p className="text-xs text-muted-foreground">
                  Paste link Google Maps (short link seperti maps.app.goo.gl atau full link). Sistem akan otomatis mengambil Place ID dan koordinat.
                </p>
                {googleMapsLink && !isGoogleMapsUrl(googleMapsLink) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Format link tidak dikenali. Pastikan menggunakan link Google Maps yang valid.</span>
                  </p>
                )}
                {formData.placeId && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                    <div className="font-medium">Informasi yang ditemukan:</div>
                    {formData.placeId && (
                      <div>
                        Place ID: <code className="text-xs bg-background px-1 py-0.5 rounded">{formData.placeId}</code>
                      </div>
                    )}
                    {formData.latitude && formData.longitude && (
                      <div>
                        Koordinat: {formData.latitude}, {formData.longitude}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">{t('properties.amenitiesSection')}</h3>
              
              <div className="flex gap-2">
                <Input
                  placeholder={t('properties.addAmenity')}
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addAmenity()
                    }
                  }}
                />
                <Button 
                  type="button" 
                  onClick={addAmenity} 
                  variant="outline"
                  className="relative z-10"
                >
                  {t('common.add')}
                </Button>
              </div>

              {formData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="hover:text-destructive relative z-10 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Images */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">{t('properties.imagesSection')}</h3>
              
              <div className="flex gap-2 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  disabled={uploadingImage}
                  className="relative z-10"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengunggah...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Foto
                    </>
                  )}
                </Button>
                <Input
                  type="url"
                  placeholder={t('properties.addImageUrl')}
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addImageUrl()
                    }
                  }}
                  className="flex-1 min-w-[200px]"
                />
                <Button 
                  type="button" 
                  onClick={addImageUrl} 
                  variant="outline"
                  className="relative z-10"
                >
                  {t('common.add')}
                </Button>
              </div>

              {formData.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {formData.imageUrls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt={`Property image ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImageUrl(url)}
                        className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">{t('common.settings', { defaultValue: 'Settings' })}</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">{t('properties.propertyActive')}</span>
                </label>
              </div>
            </div>
          </div>
        </ModalContent>

        <ModalFooter className="border-t bg-background shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="relative z-10"
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="relative z-10"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              property ? t('properties.updateProperty') : t('properties.addPropertyButton')
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

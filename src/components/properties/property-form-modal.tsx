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
    dynamicPricingEnabled: false,
    weekendMultiplier: '',
    isActive: true,
  })
  const [amenityInput, setAmenityInput] = useState('')
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (property) {
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
        dynamicPricingEnabled: property.dynamicPricingEnabled || false,
        weekendMultiplier: property.weekendMultiplier?.toString() || '',
        isActive: property.isActive !== undefined ? property.isActive : true,
      })
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
        dynamicPricingEnabled: false,
        weekendMultiplier: '',
        isActive: true,
      })
    }
    setError(null)
  }, [property, open])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const input = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        description: formData.description || undefined,
        propertyType: formData.propertyType,
        imageUrls: formData.imageUrls.length > 0 ? formData.imageUrls : undefined,
        placeId: formData.placeId || undefined,
        amenities: formData.amenities.length > 0 ? formData.amenities : undefined,
        maxGuests: formData.maxGuests ? parseInt(formData.maxGuests) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        checkInTime: formData.checkInTime || undefined,
        checkOutTime: formData.checkOutTime || undefined,
        cancellationPolicy: formData.cancellationPolicy || undefined,
        dynamicPricingEnabled: formData.dynamicPricingEnabled,
        weekendMultiplier: formData.weekendMultiplier ? parseFloat(formData.weekendMultiplier) : undefined,
        isActive: formData.isActive,
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
        setError(result.message || t('properties.saveSuccess'))
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

            {/* Pricing & Details */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">{t('properties.pricingDetails')}</h3>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="dynamicPricingEnabled"
                      checked={formData.dynamicPricingEnabled}
                      onChange={(e) => setFormData({ ...formData, dynamicPricingEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="dynamicPricingEnabled" className="text-sm font-medium cursor-pointer">
                      {t('properties.enableDynamicPricing')}
                    </Label>
                  </div>
                  <div className="ml-6 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {t('properties.dynamicPricingDescription')}
                    </p>
                    {formData.dynamicPricingEnabled && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-900 dark:text-blue-100 font-medium mb-1">
                          {t('properties.dynamicPricingInfo')}
                        </p>
                        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                          <li>{t('properties.dynamicPricingTip1')}</li>
                          <li>{t('properties.dynamicPricingTip2')}</li>
                          <li>{t('properties.dynamicPricingTip3')}</li>
                          <li>{t('properties.dynamicPricingTip4')}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weekendMultiplier">Weekend Multiplier (Sabtu Malam & Minggu)</Label>
                  <Input
                    id="weekendMultiplier"
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="5.0"
                    value={formData.weekendMultiplier}
                    onChange={(e) => setFormData({ ...formData, weekendMultiplier: e.target.value })}
                    placeholder="1.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contoh: 1.5 = 50% lebih mahal, 2.0 = 100% lebih mahal (2x harga normal). Kosongkan jika tidak ingin ada multiplier weekend.
                  </p>
                </div>
              
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
            </div>

            {/* Location */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Lokasi</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="-6.2088"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="106.8456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placeId">Place ID (Google Maps)</Label>
                  <Input
                    id="placeId"
                    value={formData.placeId}
                    onChange={(e) => setFormData({ ...formData, placeId: e.target.value })}
                  />
                </div>
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

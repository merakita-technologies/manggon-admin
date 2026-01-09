'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, ModalHeader, ModalContent, ModalFooter, ModalTitle, ModalDescription } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { graphqlClient } from '@/lib/graphql'
import { Loader2, AlertCircle, X, Upload } from 'lucide-react'
import { HourlyRatesManager } from './hourly-rates-manager'
import { useI18n } from '@/contexts/i18n-context'
import { BACKEND_BASE_URL } from '@/lib/api-config'

interface RoomFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room?: any
  propertyId?: string
  onSuccess?: () => void
}

export function RoomFormModal({ open, onOpenChange, room, propertyId, onSuccess }: RoomFormModalProps) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [formData, setFormData] = useState({
    propertyId: propertyId || '',
    roomNumber: '',
    roomType: 'single',
    capacity: '1',
    basePricePerNight: '',
    description: '',
    images: [] as string[],
    weekendMultiplier: '',
    holidayMultiplier: '',
    weekendMultiplierEnabled: false,
    holidayMultiplierEnabled: false,
    isActive: true,
    supportsHourlyBooking: false,
  })
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      fetchProperties()
    }
  }, [open])

  useEffect(() => {
    if (room) {
      setFormData({
        propertyId: room.propertyId || propertyId || '',
        roomNumber: room.roomNumber || '',
        roomType: room.roomType || 'single',
        capacity: room.capacity?.toString() || '1',
        basePricePerNight: room.basePricePerNight?.toString() || '',
        description: room.description || '',
        images: room.images || [],
        weekendMultiplier: room.weekendMultiplier?.toString() || '',
        holidayMultiplier: room.holidayMultiplier?.toString() || '',
        // Use enable flags from database, fallback to checking if multiplier exists
        weekendMultiplierEnabled: room.enableWeekendMultiplier ?? (room.weekendMultiplier != null && room.weekendMultiplier > 0),
        holidayMultiplierEnabled: room.enableHolidayMultiplier ?? (room.holidayMultiplier != null && room.holidayMultiplier > 0),
        isActive: room.isActive !== undefined ? room.isActive : true,
        supportsHourlyBooking: room.supportsHourlyBooking || false,
      })
    } else {
      setFormData({
        propertyId: propertyId || '',
        roomNumber: '',
        roomType: 'single',
        capacity: '1',
        basePricePerNight: '',
        description: '',
        images: [],
        weekendMultiplier: '',
        holidayMultiplier: '',
        weekendMultiplierEnabled: false,
        holidayMultiplierEnabled: false,
        isActive: true,
        supportsHourlyBooking: false,
      })
    }
    setError(null)
  }, [room, propertyId, open])

  const fetchProperties = async () => {
    try {
      const data = await graphqlClient.getProperties()
      setProperties(data)
    } catch (err: any) {
      console.error('Error fetching properties:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!formData.propertyId) {
        setError(t('rooms.propertyRequired'))
        setIsLoading(false)
        return
      }

      let result
      if (room) {
        // For update, don't include propertyId (it can't be changed)
        // IMPORTANT: Preserve existing multiplier values if checkbox is disabled
        const updateInput: any = {
          roomNumber: formData.roomNumber,
          roomType: formData.roomType,
          capacity: parseInt(formData.capacity),
          basePricePerNight: parseFloat(formData.basePricePerNight),
          description: formData.description || undefined,
          images: formData.images, // Always send array, even if empty (to allow deletion)
          isActive: formData.isActive,
          supportsHourlyBooking: formData.supportsHourlyBooking,
        }
        
        // Handle weekend multiplier and enable flag
        if (formData.weekendMultiplierEnabled && formData.weekendMultiplier) {
          updateInput.weekendMultiplier = parseFloat(formData.weekendMultiplier)
          updateInput.enableWeekendMultiplier = true
        } else if (!formData.weekendMultiplierEnabled) {
          // If disabled, keep existing multiplier value but set enable flag to false
          updateInput.weekendMultiplier = room.weekendMultiplier ?? undefined
          updateInput.enableWeekendMultiplier = false
        } else {
          // If enabled but empty, set to undefined (user wants to remove)
          updateInput.weekendMultiplier = undefined
          updateInput.enableWeekendMultiplier = false
        }
        
        // Handle holiday multiplier and enable flag
        if (formData.holidayMultiplierEnabled && formData.holidayMultiplier) {
          updateInput.holidayMultiplier = parseFloat(formData.holidayMultiplier)
          updateInput.enableHolidayMultiplier = true
        } else if (!formData.holidayMultiplierEnabled) {
          // If disabled, keep existing multiplier value but set enable flag to false
          updateInput.holidayMultiplier = room.holidayMultiplier ?? undefined
          updateInput.enableHolidayMultiplier = false
        } else {
          // If enabled but empty, set to undefined (user wants to remove)
          updateInput.holidayMultiplier = undefined
          updateInput.enableHolidayMultiplier = false
        }
        
        result = await graphqlClient.updateRoomUnit(room.id, updateInput)
      } else {
        // For create, include propertyId
        const createInput: any = {
          propertyId: formData.propertyId,
          roomNumber: formData.roomNumber,
          roomType: formData.roomType,
          capacity: parseInt(formData.capacity),
          basePricePerNight: parseFloat(formData.basePricePerNight),
          description: formData.description || undefined,
          images: formData.images, // Always send array, even if empty
          isActive: formData.isActive,
          supportsHourlyBooking: formData.supportsHourlyBooking,
        }
        
        // Only include multipliers if checkbox is enabled and value is provided
        if (formData.weekendMultiplierEnabled && formData.weekendMultiplier) {
          createInput.weekendMultiplier = parseFloat(formData.weekendMultiplier)
          createInput.enableWeekendMultiplier = true
        } else {
          createInput.enableWeekendMultiplier = false
        }
        
        if (formData.holidayMultiplierEnabled && formData.holidayMultiplier) {
          createInput.holidayMultiplier = parseFloat(formData.holidayMultiplier)
          createInput.enableHolidayMultiplier = true
        } else {
          createInput.enableHolidayMultiplier = false
        }
        
        result = await graphqlClient.createRoomUnit(createInput)
      }

      if (result.success) {
        onSuccess?.()
        onOpenChange(false)
      } else {
        setError(result.message || t('rooms.saveRoomError'))
      }
    } catch (err: any) {
      console.error('Error saving room unit:', err)
      setError(err.message || t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const addImageUrl = () => {
    if (imageUrlInput.trim() && !formData.images.includes(imageUrlInput.trim())) {
      setFormData({
        ...formData,
        images: [...formData.images, imageUrlInput.trim()],
      })
      setImageUrlInput('')
    }
  }

  const removeImageUrl = (url: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter((u) => u !== url),
    })
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const token = localStorage.getItem('auth_token')
      let uploadUrl: string
      
      // If room exists, upload to room-specific endpoint
      // Otherwise, upload to general room upload endpoint
      if (room?.id) {
        uploadUrl = `${BACKEND_BASE_URL}/api/v1/properties/rooms/${room.id}/upload-image`
      } else {
        // For new room, we can't upload yet - use preview URL
        const previewUrl = URL.createObjectURL(file)
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, previewUrl],
        }))
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setUploadingImage(false)
        return
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
          
          // Use the URL from server response as-is (it should be relative path like /api/v1/uploads/rooms/...)
          // Don't prepend BACKEND_BASE_URL as it will be resolved by the frontend automatically
          const imageUrl = uploadResult.url
          
          // Add uploaded image URL to form data immediately
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, imageUrl],
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
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-3xl">
      <form onSubmit={handleSubmit} className="flex flex-col" style={{ height: '100%', maxHeight: '90vh' }}>
        <ModalHeader onClose={() => onOpenChange(false)}>
          <div>
            <ModalTitle>{room ? t('rooms.editRoomTitle') : t('rooms.addRoomTitle')}</ModalTitle>
            <ModalDescription>
              {room ? t('rooms.editRoomDescription') : t('rooms.addRoomDescription')}
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
              <h3 className="font-semibold text-lg">{t('rooms.basicInformation')}</h3>
              
              <div className="space-y-2">
                <Label htmlFor="propertyId">{t('properties.property')} *</Label>
                <select
                  id="propertyId"
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  required
                  disabled={!!propertyId}
                >
                  <option value="">{t('rooms.selectProperty')}</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name} - {property.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roomNumber">{t('rooms.roomNumberLabel')} *</Label>
                  <Input
                    id="roomNumber"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="101, A1, Suite 1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomType">{t('rooms.roomTypeLabel')} *</Label>
                  <select
                    id="roomType"
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    required
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="twin">Twin</option>
                    <option value="suite">Suite</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="family">Family</option>
                    <option value="presidential">Presidential</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">{t('rooms.capacityLabel')} *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="basePricePerNight">{t('rooms.basePriceLabel')} *</Label>
                  <Input
                    id="basePricePerNight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePricePerNight}
                    onChange={(e) => setFormData({ ...formData, basePricePerNight: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weekendMultiplierEnabled"
                    checked={formData.weekendMultiplierEnabled}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, weekendMultiplierEnabled: checked === true });
                    }}
                  />
                  <Label htmlFor="weekendMultiplierEnabled" className="cursor-pointer">
                    Aktifkan Weekend Multiplier
                  </Label>
                </div>
                {formData.weekendMultiplierEnabled && (
                  <>
                    <div className="relative">
                      <Input
                        id="weekendMultiplier"
                        type="number"
                        step="0.01"
                        min="1"
                        max="5"
                        value={formData.weekendMultiplier}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 1 && parseFloat(val) <= 5)) {
                            setFormData({ ...formData, weekendMultiplier: val });
                          }
                        }}
                        placeholder="1.25"
                        className="pr-20"
                      />
                      {formData.weekendMultiplier && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {(parseFloat(formData.weekendMultiplier) * 100 - 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Format:</strong> Angka antara 1.0 - 5.0 (contoh: 1.25 = +25%, 1.5 = +50%, 2.0 = +100%). 
                      <strong className="block mt-1">PENTING:</strong> Weekend multiplier HANYA berlaku jika TIDAK ada Holiday. Holiday memiliki priority lebih tinggi.
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="holidayMultiplierEnabled"
                    checked={formData.holidayMultiplierEnabled}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, holidayMultiplierEnabled: checked === true });
                    }}
                  />
                  <Label htmlFor="holidayMultiplierEnabled" className="cursor-pointer">
                    Aktifkan Holiday Multiplier
                  </Label>
                </div>
                {formData.holidayMultiplierEnabled && (
                  <>
                    <div className="relative">
                      <Input
                        id="holidayMultiplier"
                        type="number"
                        step="0.01"
                        min="1"
                        max="5"
                        value={formData.holidayMultiplier}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 1 && parseFloat(val) <= 5)) {
                            setFormData({ ...formData, holidayMultiplier: val });
                          }
                        }}
                        placeholder="1.5"
                        className="pr-20"
                      />
                      {formData.holidayMultiplier && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {(parseFloat(formData.holidayMultiplier) * 100 - 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Format:</strong> Angka antara 1.0 - 5.0 (contoh: 1.5 = +50%, 2.0 = +100%, 2.5 = +150%). 
                      <strong className="block mt-1">PENTING:</strong> Holiday multiplier berlaku untuk SEMUA holiday. Priority: RoomUnit &gt; PropertyHolidayMultiplier &gt; Holiday default.
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('rooms.descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder={t('rooms.descriptionLabel')}
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">{t('rooms.imagesLabel')}</h3>
              
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
                  placeholder={t('rooms.addImageUrl')}
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

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {formData.images.map((url, idx) => {
                    // Normalize URL - if it's a relative path, prepend BACKEND_BASE_URL
                    const imageSrc = url.startsWith('http') 
                      ? url 
                      : url.startsWith('/') 
                        ? `${BACKEND_BASE_URL}${url}`
                        : `${BACKEND_BASE_URL}/api/v1/uploads/rooms/${url}`
                    
                    return (
                      <div key={idx} className="relative group">
                        <img
                          src={imageSrc}
                          alt={`Room image ${idx + 1}`}
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
                    )
                  })}
                </div>
              )}
            </div>

            {/* Hourly Rates Management */}
            {formData.supportsHourlyBooking && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg">{t('rooms.hourlyRates')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('rooms.hourlyRatesDetailDescription')}
                </p>
                {room?.id ? (
                  <HourlyRatesManager roomUnitId={room.id} roomNumber={room.roomNumber} />
                ) : (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      {t('rooms.saveFirstMessage')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Settings */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">{t('common.settings', { defaultValue: 'Settings' })}</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.supportsHourlyBooking}
                    onChange={(e) => setFormData({ ...formData, supportsHourlyBooking: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">{t('rooms.supportsHourlyBooking')}</span>
                </label>
                <p className="text-xs text-muted-foreground ml-6">
                  {t('rooms.hourlyBookingDescription')}
                </p>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">{t('rooms.roomActiveLabel')}</span>
                </label>
              </div>
            </div>
          </div>
        </ModalContent>

        <ModalFooter>
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
              room ? t('rooms.updateRoom') : t('rooms.addRoom')
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}


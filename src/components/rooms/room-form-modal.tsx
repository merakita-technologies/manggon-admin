'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalContent, ModalFooter, ModalTitle, ModalDescription } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { graphqlClient } from '@/lib/graphql'
import { Loader2, AlertCircle, X } from 'lucide-react'
import { HourlyRatesManager } from './hourly-rates-manager'
import { useI18n } from '@/contexts/i18n-context'

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
    isActive: true,
    supportsHourlyBooking: false,
  })
  const [imageUrlInput, setImageUrlInput] = useState('')

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
        const updateInput = {
          roomNumber: formData.roomNumber,
          roomType: formData.roomType,
          capacity: parseInt(formData.capacity),
          basePricePerNight: parseFloat(formData.basePricePerNight),
          description: formData.description || undefined,
          images: formData.images.length > 0 ? formData.images : undefined,
          isActive: formData.isActive,
          supportsHourlyBooking: formData.supportsHourlyBooking,
        }
        result = await graphqlClient.updateRoomUnit(room.id, updateInput)
      } else {
        // For create, include propertyId
        const createInput = {
          propertyId: formData.propertyId,
          roomNumber: formData.roomNumber,
          roomType: formData.roomType,
          capacity: parseInt(formData.capacity),
          basePricePerNight: parseFloat(formData.basePricePerNight),
          description: formData.description || undefined,
          images: formData.images.length > 0 ? formData.images : undefined,
          isActive: formData.isActive,
          supportsHourlyBooking: formData.supportsHourlyBooking,
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

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-3xl">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={() => onOpenChange(false)}>
          <div>
            <ModalTitle>{room ? t('rooms.editRoomTitle') : t('rooms.addRoomTitle')}</ModalTitle>
            <ModalDescription>
              {room ? t('rooms.editRoomDescription') : t('rooms.addRoomDescription')}
            </ModalDescription>
          </div>
        </ModalHeader>

        <ModalContent>
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
              
              <div className="flex gap-2">
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
                  {formData.images.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
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
                  ))}
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


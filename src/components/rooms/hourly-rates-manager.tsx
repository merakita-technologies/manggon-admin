'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { graphqlClient } from '@/lib/graphql'
import { Loader2, AlertCircle, Plus, Trash2, Edit2, Clock, X } from 'lucide-react'
import { Modal, ModalHeader, ModalContent, ModalFooter, ModalTitle, ModalDescription } from '@/components/ui/modal'
import { useI18n } from '@/contexts/i18n-context'

interface HourlyRate {
  id?: string
  roomUnitId: string
  startTime: string
  endTime: string
  pricePerHour: number
  minimumDurationHours: number
  crossesMidnight: boolean
  isActive: boolean
  description?: string
}

interface HourlyRatesManagerProps {
  roomUnitId: string
  roomNumber?: string
}

export function HourlyRatesManager({ roomUnitId, roomNumber }: HourlyRatesManagerProps) {
  const { t } = useI18n()
  const [rates, setRates] = useState<HourlyRate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<HourlyRate | null>(null)
  const [formData, setFormData] = useState<Omit<HourlyRate, 'id'>>({
    roomUnitId,
    startTime: '07:00',
    endTime: '12:00',
    pricePerHour: 0,
    minimumDurationHours: 1,
    crossesMidnight: false,
    isActive: true,
    description: '',
  })

  useEffect(() => {
    if (roomUnitId) {
      fetchRates()
    }
  }, [roomUnitId])

  const fetchRates = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await graphqlClient.getHourlyRatesByRoomUnit(roomUnitId)
      setRates(data || [])
    } catch (err: any) {
      setError(err.message || t('rooms.noRates'))
      console.error('Error fetching hourly rates:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (rate?: HourlyRate) => {
    if (rate) {
      setEditingRate(rate)
      setFormData({
        roomUnitId,
        startTime: rate.startTime,
        endTime: rate.endTime,
        pricePerHour: rate.pricePerHour,
        minimumDurationHours: rate.minimumDurationHours,
        crossesMidnight: rate.crossesMidnight,
        isActive: rate.isActive,
        description: rate.description || '',
      })
    } else {
      setEditingRate(null)
      setFormData({
        roomUnitId,
        startTime: '07:00',
        endTime: '12:00',
        pricePerHour: 0,
        minimumDurationHours: 1,
        crossesMidnight: false,
        isActive: true,
        description: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRate(null)
    setError(null)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    // Validasi form
    if (!formData.startTime || !formData.endTime) {
      setError(t('rooms.rateRequired'))
      return
    }
    
    if (formData.pricePerHour <= 0) {
      setError(t('rooms.priceRequired'))
      return
    }
    
    if (formData.minimumDurationHours < 1) {
      setError(t('rooms.durationRequired'))
      return
    }
    
    setError(null)
    setIsLoading(true)

    try {
      let result
      if (editingRate?.id) {
        result = await graphqlClient.updateHourlyRate(editingRate.id, {
          startTime: formData.startTime,
          endTime: formData.endTime,
          pricePerHour: formData.pricePerHour,
          minimumDurationHours: formData.minimumDurationHours,
          crossesMidnight: formData.crossesMidnight,
          isActive: formData.isActive,
          description: formData.description || undefined,
        })
      } else {
        result = await graphqlClient.createHourlyRate({
          roomUnitId: formData.roomUnitId,
          startTime: formData.startTime,
          endTime: formData.endTime,
          pricePerHour: formData.pricePerHour,
          minimumDurationHours: formData.minimumDurationHours,
          crossesMidnight: formData.crossesMidnight,
          description: formData.description || undefined,
        })
      }

      if (result.success) {
        handleCloseModal()
        fetchRates()
      } else {
        setError(result.message || t('rooms.saveRateSuccess'))
      }
    } catch (err: any) {
      console.error('Error saving hourly rate:', err)
      setError(err.message || t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('rooms.deleteRateConfirm'))) {
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const result = await graphqlClient.deleteHourlyRate(id)
      if (result.success) {
        fetchRates()
      } else {
        setError(result.message || t('rooms.deleteRateSuccess'))
      }
    } catch (err: any) {
      console.error('Error deleting hourly rate:', err)
      setError(err.message || t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-base">{t('rooms.hourlyRates')}</h4>
          <p className="text-sm text-muted-foreground">
            {t('rooms.hourlyRatesDescription')}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => handleOpenModal()}
          size="sm"
          className="relative z-10"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('rooms.addRate')}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && !rates.length ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{t('rooms.noRates')}</p>
          <p className="text-sm mt-1">{t('rooms.noRatesMessage')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {formatTime(rate.startTime)} - {formatTime(rate.endTime)}
                    {rate.crossesMidnight && (
                      <span className="ml-2 text-xs text-muted-foreground">({t('rooms.crossesMidnightLabel')})</span>
                    )}
                  </span>
                  {!rate.isActive && (
                    <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                      {t('common.inactive')}
                    </span>
                  )}
                </div>
                {rate.description && (
                  <p className="text-sm text-muted-foreground mb-1">{rate.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    <strong>{t('rooms.pricePerHour')}:</strong> {formatPrice(rate.pricePerHour)}/{t('dashboard.hours')}
                  </span>
                  <span>
                    <strong>{t('rooms.minimumDuration')}:</strong> {rate.minimumDurationHours} {t('dashboard.hours')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenModal(rate)}
                  className="relative z-10"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => rate.id && handleDelete(rate.id)}
                  className="text-destructive hover:text-destructive relative z-10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal untuk Add/Edit Hourly Rate */}
      <Modal open={isModalOpen} onOpenChange={handleCloseModal} className="max-w-2xl">
        <div>
          <ModalHeader onClose={handleCloseModal}>
            <div>
              <ModalTitle>
                {editingRate ? t('rooms.editRateTitle') : t('rooms.addRateTitle')}
              </ModalTitle>
              <ModalDescription>
                {editingRate
                  ? t('rooms.rateDescription')
                  : t('rooms.addRateDescription')}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">{t('rooms.startTime')} *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">{t('rooms.endTime')} *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('rooms.rateDescriptionLabel')}</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('rooms.rateDescriptionPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerHour">{t('rooms.pricePerHour')} (IDR) *</Label>
                  <Input
                    id="pricePerHour"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData({ ...formData, pricePerHour: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumDurationHours">{t('rooms.minimumDuration')} *</Label>
                  <Input
                    id="minimumDurationHours"
                    type="number"
                    min="1"
                    value={formData.minimumDurationHours}
                    onChange={(e) => setFormData({ ...formData, minimumDurationHours: parseInt(e.target.value) || 1 })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('rooms.minimumDurationDescription')}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.crossesMidnight}
                    onChange={(e) => setFormData({ ...formData, crossesMidnight: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">{t('rooms.crossesMidnight')}</span>
                </label>
                <p className="text-xs text-muted-foreground ml-6">
                  {t('rooms.crossesMidnightDescription')}
                </p>

                {editingRate && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-sm">{t('rooms.rateActive')}</span>
                  </label>
                )}
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>{t('rooms.rateTips')}</strong> {t('rooms.rateTipsDescription')}
                </p>
              </div>
            </div>
          </ModalContent>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={isLoading}
              className="relative z-10"
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="button"
              onClick={handleSubmit}
              disabled={isLoading} 
              className="relative z-10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                editingRate ? t('common.update') : t('rooms.addRate')
              )}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}


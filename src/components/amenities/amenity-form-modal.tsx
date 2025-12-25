'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalContent, ModalFooter, ModalTitle, ModalDescription } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { graphqlClient } from '@/lib/graphql'
import { Loader2, AlertCircle } from 'lucide-react'
import { useI18n } from '@/contexts/i18n-context'

interface AmenityFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amenity?: any
  onSuccess?: () => void
}

export function AmenityFormModal({ open, onOpenChange, amenity, onSuccess }: AmenityFormModalProps) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    category: '',
    isActive: true,
  })

  useEffect(() => {
    if (amenity) {
      setFormData({
        name: amenity.name || '',
        description: amenity.description || '',
        icon: amenity.icon || '',
        category: amenity.category || '',
        isActive: amenity.isActive !== undefined ? amenity.isActive : true,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '',
        category: '',
        isActive: true,
      })
    }
    setError(null)
  }, [amenity, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const input = {
        name: formData.name,
        description: formData.description || undefined,
        icon: formData.icon || undefined,
        category: formData.category || undefined,
        isActive: formData.isActive,
      }

      let result
      if (amenity) {
        result = await graphqlClient.updateAmenity(amenity.id, input)
      } else {
        result = await graphqlClient.createAmenity(input)
      }

      if (result.success) {
        onSuccess?.()
        onOpenChange(false)
      } else {
        setError(result.message || t('amenities.saveSuccess'))
      }
    } catch (err: any) {
      console.error('Error saving amenity:', err)
      setError(err.message || t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col" style={{ height: '100%', maxHeight: '90vh' }}>
        <ModalHeader onClose={() => onOpenChange(false)}>
          <div>
            <ModalTitle>{amenity ? t('amenities.editAmenity') : t('amenities.addAmenity')}</ModalTitle>
            <ModalDescription>
              {amenity ? t('amenities.editAmenity') : t('amenities.managementDescription')}
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
            <div className="space-y-2">
              <Label htmlFor="name">{t('amenities.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('amenities.name')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('amenities.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('amenities.description')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">{t('amenities.icon')}</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder={t('amenities.iconPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t('amenities.category')}</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder={t('amenities.category')}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">{t('amenities.isActive')}</span>
              </label>
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
          <Button type="submit" disabled={isLoading} className="relative z-10">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              amenity ? t('common.update') : t('common.save')
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

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

interface AddonFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  addon?: any
  onSuccess?: () => void
}

export function AddonFormModal({ open, onOpenChange, addon, onSuccess }: AddonFormModalProps) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: '',
    isActive: true,
    isRecurring: false,
  })

  useEffect(() => {
    if (addon) {
      setFormData({
        name: addon.name || '',
        description: addon.description || '',
        price: addon.price?.toString() || '',
        imageUrl: addon.imageUrl || '',
        category: addon.category || '',
        isActive: addon.isActive !== undefined ? addon.isActive : true,
        isRecurring: addon.isRecurring !== undefined ? addon.isRecurring : false,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        category: '',
        isActive: true,
        isRecurring: false,
      })
    }
    setError(null)
  }, [addon, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const input = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl || undefined,
        category: formData.category || undefined,
        isActive: formData.isActive,
        isRecurring: formData.isRecurring,
      }

      let result
      if (addon) {
        result = await graphqlClient.updateAddon(addon.id, input)
      } else {
        result = await graphqlClient.createAddon(input)
      }

      if (result.success) {
        onSuccess?.()
        onOpenChange(false)
      } else {
        setError(result.message || t('addons.saveSuccess'))
      }
    } catch (err: any) {
      console.error('Error saving addon:', err)
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
            <ModalTitle>{addon ? t('addons.editAddon') : t('addons.addAddon')}</ModalTitle>
            <ModalDescription>
              {addon ? t('addons.editAddon') : t('addons.managementDescription')}
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
              <Label htmlFor="name">{t('addons.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('addons.name')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('addons.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('addons.description')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t('addons.price')} (IDR) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t('addons.category')}</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder={t('addons.category')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">{t('addons.imageUrl')}</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">{t('addons.isRecurring')}</span>
              </label>
              <p className="text-xs text-muted-foreground ml-6">
                {t('addons.isRecurringDescription')}
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">{t('addons.isActive')}</span>
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
              addon ? t('common.update') : t('common.save')
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

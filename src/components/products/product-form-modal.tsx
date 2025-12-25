'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalContent, ModalFooter, ModalTitle, ModalDescription } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { graphqlClient } from '@/lib/graphql'
import { Loader2, AlertCircle, AlertTriangle, X } from 'lucide-react'
import { useI18n } from '@/contexts/i18n-context'

interface ProductFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: any
  onSuccess?: () => void
  existingCategories?: string[]
}

export function ProductFormModal({ open, onOpenChange, product, onSuccess, existingCategories = [] }: ProductFormModalProps) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
    category: '',
    customCategory: '',
    pointsEarned: '',
    isActive: true,
  })
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        imageUrl: product.imageUrl || '',
        category: product.category || '',
        customCategory: '',
        pointsEarned: product.pointsEarned?.toString() || '0',
        isActive: product.isActive !== undefined ? product.isActive : true,
      })
      setImagePreview(product.imageUrl || null)
      setShowCustomCategory(product.category && !existingCategories.includes(product.category))
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        imageUrl: '',
        category: '',
        customCategory: '',
        pointsEarned: '0',
        isActive: true,
      })
      setImagePreview(null)
      setShowCustomCategory(false)
    }
    setError(null)
  }, [product, open, existingCategories])

  useEffect(() => {
    if (formData.imageUrl) {
      setImagePreview(formData.imageUrl)
    } else {
      setImagePreview(null)
    }
  }, [formData.imageUrl])

  const handleCategoryChange = (value: string) => {
    if (value === '__custom__') {
      setShowCustomCategory(true)
      setFormData({ ...formData, category: '', customCategory: '' })
    } else {
      setShowCustomCategory(false)
      setFormData({ ...formData, category: value, customCategory: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Validasi stok
    const stockValue = parseInt(formData.stock)
    if (stockValue < 0) {
      setError(t('products.stockValidation'))
      setIsLoading(false)
      return
    }

    try {
      const finalCategory = showCustomCategory ? formData.customCategory : formData.category
      const input = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        stock: stockValue,
        imageUrl: formData.imageUrl || undefined,
        category: finalCategory || undefined,
        pointsEarned: parseFloat(formData.pointsEarned) || 0,
        isActive: formData.isActive,
      }

      let result
      if (product) {
        result = await graphqlClient.updateProduct(product.id, input)
      } else {
        result = await graphqlClient.createProduct(input)
      }

      if (result.success) {
        onSuccess?.()
        onOpenChange(false)
      } else {
        setError(result.message || t('products.saveSuccess'))
      }
    } catch (err: any) {
      console.error('Error saving product:', err)
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
            <ModalTitle>{product ? t('products.editProduct') : t('products.addProduct')}</ModalTitle>
            <ModalDescription>
              {product ? t('products.editProduct') : t('products.managementDescription')}
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
              <Label htmlFor="name">{t('products.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('products.name')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('products.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('products.description')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t('products.price')} (IDR) *</Label>
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
                <Label htmlFor="stock">{t('products.stock')} *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                  required
                />
                {formData.stock && parseInt(formData.stock) < 10 && parseInt(formData.stock) >= 0 && (
                  <div className="flex items-center gap-2 p-2 text-sm text-amber-600 bg-amber-50 rounded-md border border-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{t('products.lowStockWarning')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t('products.category')}</Label>
                <select
                  id="category"
                  value={showCustomCategory ? '__custom__' : formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">{t('products.selectCategory')}</option>
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__custom__">{t('products.addNewCategory')}</option>
                </select>
                {showCustomCategory && (
                  <Input
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    placeholder={t('products.newCategoryName')}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pointsEarned">{t('products.pointsEarned')}</Label>
                <Input
                  id="pointsEarned"
                  type="number"
                  min="0"
                  value={formData.pointsEarned}
                  onChange={(e) => setFormData({ ...formData, pointsEarned: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">{t('products.imageUrl')}</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
              {imagePreview && (
                <div className="relative mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md border"
                    onError={() => setImagePreview(null)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setFormData({ ...formData, imageUrl: '' })
                      setImagePreview(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>


            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">{t('products.isActive')}</span>
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
              product ? t('common.update') : t('common.save')
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

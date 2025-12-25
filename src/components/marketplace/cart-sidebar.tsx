'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, ShoppingCart, Plus, Minus, Loader2, Trash2, Package, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/currency-utils'
import { useI18n } from '@/contexts/i18n-context'

interface CartItem {
  productId: string
  product: any
  quantity: number
}

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
  cartItems: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onCheckout: () => void
  isCheckoutLoading?: boolean
}

export function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isCheckoutLoading = false,
}: CartSidebarProps) {
  const { t } = useI18n()

  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity)
  }, 0)

  const totalPoints = cartItems.reduce((sum, item) => {
    return sum + (item.product.pointsEarned * item.quantity)
  }, 0)

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      onRemoveItem(productId)
    } else {
      const item = cartItems.find(i => i.productId === productId)
      if (item && newQuantity > item.product.stock) {
        alert(t('marketplace.insufficientStock'))
        return
      }
      onUpdateQuantity(productId, newQuantity)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-background border-l-2 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{t('marketplace.cart')}</h2>
              {cartItems.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {cartItems.length} {cartItems.length === 1 ? t('marketplace.item') : t('marketplace.items')}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">{t('marketplace.cartEmpty')}</p>
              <p className="text-sm text-muted-foreground">{t('marketplace.cartEmptyDescription')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.productId} className="border-2 rounded-lg p-4 hover:shadow-md transition-all bg-card">
                  <div className="flex gap-4">
                    {item.product.imageUrl ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border-2">
                        <Package className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 line-clamp-1">{item.product.name}</h3>
                      {item.product.category && (
                        <Badge variant="outline" className="text-xs mb-2">
                          {item.product.category}
                        </Badge>
                      )}
                      <p className="text-base font-bold text-primary mb-2">
                        {formatCurrency(item.product.price)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={item.product.stock}
                          value={item.quantity}
                          onChange={(e) => {
                            const newQty = parseInt(e.target.value) || 1
                            handleQuantityChange(item.productId, newQty)
                          }}
                          className="w-16 text-center"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.productId)}
                          className="ml-auto text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('marketplace.subtotal')}: {formatCurrency(item.product.price * item.quantity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('marketplace.pointsEarned')}: {item.product.pointsEarned * item.quantity} {t('common.points')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t-2 p-5 space-y-4 bg-gradient-to-t from-background to-primary/5">
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">{t('common.total')}</span>
                <span className="font-bold text-2xl text-primary">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm text-muted-foreground">{t('marketplace.totalPoints')}</span>
                </div>
                <span className="font-bold text-amber-600 dark:text-amber-400">{totalPoints} {t('common.points')}</span>
              </div>
            </div>
            <Button
              className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={onCheckout}
              disabled={isCheckoutLoading}
            >
              {isCheckoutLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {t('marketplace.processing')}
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {t('marketplace.checkout')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}


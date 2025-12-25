'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Search, Package, Loader2, Star, AlertCircle, Plus, Edit, Trash2, Power, MoreHorizontal, Sparkles } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { graphqlClient } from '@/lib/graphql'
import { formatCurrency } from '@/lib/currency-utils'
import { useI18n } from '@/contexts/i18n-context'
import { Modal, ModalHeader, ModalContent, ModalFooter, ModalTitle, ModalDescription } from '@/components/ui/modal'
import { Label } from '@/components/ui/label'
import { ProductFormModal } from '@/components/products/product-form-modal'
import { CartSidebar } from '@/components/marketplace/cart-sidebar'

export default function MarketplacePage() {
  const { t } = useI18n()
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOrderLoading, setIsOrderLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderQuantity, setOrderQuantity] = useState(1)
  const [userRole, setUserRole] = useState<string>('user')
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [cartItems, setCartItems] = useState<Array<{ productId: string; product: any; quantity: number }>>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const isClearingCartRef = useRef(false)

  useEffect(() => {
    // Get user role from localStorage
    if (typeof window !== 'undefined') {
      const userInfo = localStorage.getItem('user_info')
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo)
          setUserRole(user.role || 'user')
        } catch (e) {
          console.error('Error parsing user info:', e)
        }
      }
      
      // Load cart from localStorage only on initial mount (not when clearing)
      if (!isClearingCartRef.current) {
        const savedCart = localStorage.getItem('marketplace_cart')
        if (savedCart) {
          try {
            const cart = JSON.parse(savedCart)
            // Only load if cart is not empty
            if (cart && cart.length > 0) {
              setCartItems(cart)
            }
          } catch (e) {
            console.error('Error parsing cart:', e)
          }
        }
      }
    }
    fetchProducts()
    fetchOrders()
  }, [])

  // Save cart to localStorage whenever it changes (but skip if clearing)
  useEffect(() => {
    if (typeof window !== 'undefined' && !isClearingCartRef.current) {
      if (cartItems.length > 0) {
        localStorage.setItem('marketplace_cart', JSON.stringify(cartItems))
      } else {
        // Only clear localStorage if it exists (avoid unnecessary operations)
        const existing = localStorage.getItem('marketplace_cart')
        if (existing) {
          localStorage.removeItem('marketplace_cart')
        }
      }
    }
  }, [cartItems])

  const fetchProducts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await graphqlClient.getProducts()
      setProducts(data)
      
      // Sync cart items with updated product data
      if (cartItems.length > 0) {
        setCartItems(cartItems.map(cartItem => {
          const updatedProduct = data.find(p => p.id === cartItem.productId)
          if (updatedProduct) {
            // Update product data and adjust quantity if stock is less
            const maxQuantity = Math.min(cartItem.quantity, updatedProduct.stock)
            return {
              ...cartItem,
              product: updatedProduct,
              quantity: maxQuantity
            }
          }
          return cartItem
        }).filter(cartItem => {
          // Remove items if product no longer exists or is inactive
          const product = data.find(p => p.id === cartItem.productId)
          return product && product.isActive
        }))
      }
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const data = await graphqlClient.getOrders()
      setOrders(data)
    } catch (err: any) {
      console.error('Error fetching orders:', err)
    }
  }

  const handleBuyNow = (product: any) => {
    setSelectedProduct(product)
    setOrderQuantity(1)
    setIsOrderModalOpen(true)
  }

  const handleAddToCart = (product: any) => {
    const existingItem = cartItems.find(item => item.productId === product.id)
    
    if (existingItem) {
      // Update quantity if already in cart
      if (existingItem.quantity + 1 > product.stock) {
        alert(t('marketplace.insufficientStock'))
        return
      }
      setCartItems(cartItems.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      // Add new item to cart
      if (product.stock < 1) {
        alert(t('marketplace.insufficientStock'))
        return
      }
      setCartItems([...cartItems, {
        productId: product.id,
        product: product,
        quantity: 1
      }])
    }
    setIsCartOpen(true)
  }

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    const item = cartItems.find(i => i.productId === productId)
    if (!item) return

    if (quantity > item.product.stock) {
      alert(t('marketplace.insufficientStock'))
      return
    }

    if (quantity < 1) {
      handleRemoveFromCart(productId)
      return
    }

    setCartItems(cartItems.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    ))
  }

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.productId !== productId))
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) return

    setIsCheckoutLoading(true)
    try {
      // Create orders for all cart items
      const orderPromises = cartItems.map(item =>
        graphqlClient.createOrder({
          productId: item.productId,
          quantity: item.quantity,
        })
      )

      const results = await Promise.all(orderPromises)
      const failedOrders = results.filter(r => !r.success)

      if (failedOrders.length > 0) {
        alert(t('marketplace.someOrdersFailed'))
      } else {
        // Set flag FIRST to prevent useEffect from interfering
        isClearingCartRef.current = true
        
        // Clear localStorage FIRST before state update
        if (typeof window !== 'undefined') {
          localStorage.removeItem('marketplace_cart')
        }
        
        // Clear cart state
        setCartItems([])
        
        // Close cart sidebar
        setIsCartOpen(false)
        
        // Refresh data
        fetchProducts()
        fetchOrders()
        
        // Show success message
        alert(t('marketplace.checkoutSuccess'))
        
        // Reset flag after everything is done
        setTimeout(() => {
          isClearingCartRef.current = false
        }, 1000)
      }
    } catch (err: any) {
      console.error('Error during checkout:', err)
      alert(err.message || t('marketplace.checkoutError'))
      // Reset flag on error
      isClearingCartRef.current = false
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!selectedProduct) return

    setIsOrderLoading(true)
    try {
      if (orderQuantity > selectedProduct.stock) {
        alert(t('marketplace.insufficientStock'))
        setIsOrderLoading(false)
        return
      }

      const result = await graphqlClient.createOrder({
        productId: selectedProduct.id,
        quantity: orderQuantity,
      })

      if (result.success) {
        alert(t('marketplace.orderSuccess'))
        setIsOrderModalOpen(false)
        setSelectedProduct(null)
        fetchProducts()
        fetchOrders()
      } else {
        alert(result.message || t('marketplace.orderError'))
      }
    } catch (err: any) {
      console.error('Error creating order:', err)
      alert(err.message || t('marketplace.orderError'))
    } finally {
      setIsOrderLoading(false)
    }
  }

  const handleOpenProductModal = (product?: any) => {
    setSelectedProductForEdit(product || null)
    setIsProductModalOpen(true)
  }

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false)
    setSelectedProductForEdit(null)
  }

  const handleProductModalSuccess = () => {
    fetchProducts()
    handleCloseProductModal()
  }

  const handleDeleteProduct = async (product: any) => {
    if (!confirm(t('products.deleteConfirm'))) {
      return
    }

    try {
      const result = await graphqlClient.deleteProduct(product.id)
      if (result.success) {
        fetchProducts()
      } else {
        alert(result.message || t('products.deleteSuccess'))
      }
    } catch (err: any) {
      console.error('Error deleting product:', err)
      alert(err.message || t('common.error'))
    }
  }

  const handleToggleProductStatus = async (product: any) => {
    try {
      const result = await graphqlClient.toggleProductStatus(product.id)
      if (result.success) {
        fetchProducts()
      } else {
        alert(result.message || t('common.error'))
      }
    } catch (err: any) {
      console.error('Error toggling product status:', err)
      alert(err.message || t('common.error'))
    }
  }

  const isAdmin = userRole === 'admin'

  const filteredProducts = products.filter((product) => {
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !product.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (categoryFilter && product.category !== categoryFilter) {
      return false
    }
    if (statusFilter === 'active' && !product.isActive) {
      return false
    }
    if (statusFilter === 'inactive' && product.isActive) {
      return false
    }
    return true
  })

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return
    if (!confirm(t('products.bulkDeleteConfirm', { count: selectedProducts.length }))) {
      return
    }

    try {
      for (const productId of selectedProducts) {
        await graphqlClient.deleteProduct(productId)
      }
      setSelectedProducts([])
      fetchProducts()
    } catch (err: any) {
      console.error('Error bulk deleting products:', err)
      alert(err.message || t('common.error'))
    }
  }

  const handleBulkToggleStatus = async (activate: boolean) => {
    if (selectedProducts.length === 0) return

    try {
      for (const productId of selectedProducts) {
        const product = products.find(p => p.id === productId)
        if (product && product.isActive !== activate) {
          await graphqlClient.toggleProductStatus(productId)
        }
      }
      setSelectedProducts([])
      fetchProducts()
    } catch (err: any) {
      console.error('Error bulk toggling product status:', err)
      alert(err.message || t('common.error'))
    }
  }

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))
  const totalPointsEarned = orders.reduce((sum, order) => sum + (order.pointsEarned || 0), 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('marketplace.management')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('marketplace.managementDescription')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isAdmin && cartItems.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setIsCartOpen(true)}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {t('marketplace.cart')}
                {cartItems.length > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartItems.length}
                  </Badge>
                )}
              </Button>
            )}
            {isAdmin && (
              <Button onClick={() => handleOpenProductModal()} className="sm:w-auto w-full">
                <Plus className="h-4 w-4 mr-2" />
                {t('products.addProduct')}
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('products.products')}</CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{products.length}</div>
              <p className="text-xs text-muted-foreground">
                {t('common.productsAvailable')}
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('marketplace.myOrders')}</CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{orders.length}</div>
              <p className="text-xs text-muted-foreground">
                {t('common.totalOrders')}
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('marketplace.pointsEarned')}</CardTitle>
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 text-amber-600 dark:text-amber-400">{totalPointsEarned}</div>
              <p className="text-xs text-muted-foreground">
                {t('common.points')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {t('marketplace.title')}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {filteredProducts.length} {t('products.products')} {t('common.found')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {isAdmin && selectedProducts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedProducts.length} {t('common.selected')}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkToggleStatus(true)}
                    >
                      {t('common.activate')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkToggleStatus(false)}
                    >
                      {t('common.deactivate')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('common.delete')}
                    </Button>
                  </div>
                )}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm min-w-[150px]"
                >
                  <option value="">{t('common.all')} {t('products.category')}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {isAdmin && (
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm min-w-[120px]"
                  >
                    <option value="all">{t('common.all')} {t('common.status')}</option>
                    <option value="active">{t('common.active')}</option>
                    <option value="inactive">{t('common.inactive')}</option>
                  </select>
                )}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('products.searchPlaceholder')}
                    className="w-full sm:w-[200px] pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={fetchProducts} variant="outline" className="mt-4">
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('marketplace.noProductsAvailable')}</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? t('common.tryAdjusting') : t('marketplace.managementDescription')}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {isAdmin && filteredProducts.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-input"
                      />
                      <span className="text-sm font-medium">{t('common.selectAll')}</span>
                    </label>
                    {selectedProducts.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {selectedProducts.length} {t('common.selected')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className={`group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:border-primary/50 ${
                    selectedProducts.includes(product.id) ? 'ring-2 ring-primary border-primary' : 'border-border'
                  } ${!product.isActive || product.stock === 0 ? 'opacity-60' : ''}`}
                >
                  {/* Admin Checkbox */}
                  {isAdmin && (
                    <div className="absolute top-3 left-3 z-10">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="h-5 w-5 rounded border-2 border-background shadow-md cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Admin Dropdown Menu */}
                  {isAdmin && (
                    <div className="absolute top-3 right-3 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md hover:bg-background">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenProductModal(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleProductStatus(product)}>
                            <Power className="h-4 w-4 mr-2" />
                            {product.isActive ? t('common.deactivate') : t('common.activate')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteProduct(product)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Stock Badge Overlay */}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                          {t('marketplace.outOfStock')}
                        </Badge>
                      </div>
                    )}
                    {/* Category Badge */}
                    {product.category && (
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                        <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm shadow-md text-xs">
                          {product.category}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-3 sm:p-4 md:p-5">
                    {/* Product Name */}
                    <CardTitle className="text-base sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </CardTitle>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 md:mb-4 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
                      {product.description || t('products.noDescription')}
                    </p>

                    {/* Price Section */}
                    <div className="mb-2 sm:mb-3 md:mb-4">
                      <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 md:mb-3">
                        <span className="text-xs sm:text-sm text-muted-foreground">{t('products.price')}</span>
                        <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{formatCurrency(product.price)}</span>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{t('products.stock')}</span>
                          <Badge 
                            variant={product.stock > 0 ? 'default' : 'destructive'}
                            className="w-fit text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                          >
                            {product.stock > 0 ? `${product.stock} ${t('common.available')}` : t('marketplace.outOfStock')}
                          </Badge>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{t('marketplace.pointsEarned')}</span>
                          <Badge variant="secondary" className="w-fit text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            {product.pointsEarned} {t('common.points')}
                          </Badge>
                        </div>
                      </div>

                      {/* Admin Status */}
                      {isAdmin && (
                        <div className="pt-2 sm:pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{t('common.status')}</span>
                            <Badge variant={product.isActive ? 'default' : 'secondary'} className="text-xs">
                              {product.isActive ? t('common.active') : t('common.inactive')}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {!isAdmin && (
                      <div className="flex flex-col md:flex-row gap-2 pt-2">
                        <Button
                          variant="outline"
                          className="w-full md:flex-1 border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-xs md:text-sm h-9 md:h-10 px-3 md:px-4"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0 || !product.isActive}
                        >
                          <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1.5 shrink-0" />
                          <span className="hidden lg:inline">{t('marketplace.addToCart')}</span>
                          <span className="hidden md:inline lg:hidden">{t('marketplace.addToCartShort')}</span>
                          <span className="md:hidden">{t('marketplace.cart')}</span>
                        </Button>
                        <Button
                          className="w-full md:flex-1 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all text-xs md:text-sm h-9 md:h-10 px-3 md:px-4"
                          onClick={() => handleBuyNow(product)}
                          disabled={product.stock === 0 || !product.isActive}
                        >
                          <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1.5 shrink-0" />
                          <span className="hidden lg:inline">{t('marketplace.buyNow')}</span>
                          <span className="hidden md:inline lg:hidden">{t('marketplace.buyNowShort')}</span>
                          <span className="md:hidden">{t('marketplace.buyNowShort')}</span>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Order Modal */}
        <Modal open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
          <ModalHeader onClose={() => setIsOrderModalOpen(false)}>
            <ModalTitle>{t('marketplace.buyNow')}</ModalTitle>
            <ModalDescription>
              {selectedProduct?.name}
            </ModalDescription>
          </ModalHeader>
          <ModalContent>
            {selectedProduct && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">{t('products.price')}:</span>
                  <span className="font-bold">{formatCurrency(selectedProduct.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{t('marketplace.pointsEarned')} per item:</span>
                  <span className="font-bold">{selectedProduct.pointsEarned} {t('common.points')}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">{t('common.quantity')}</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('common.available')}: {selectedProduct.stock}
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{t('common.total')}:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(selectedProduct.price * orderQuantity)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('marketplace.pointsEarned')}:</span>
                    <span className="text-sm font-medium">
                      {selectedProduct.pointsEarned * orderQuantity} {t('common.points')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </ModalContent>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setIsOrderModalOpen(false)}
              disabled={isOrderLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={isOrderLoading || !selectedProduct || orderQuantity < 1 || orderQuantity > selectedProduct.stock}
            >
              {isOrderLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('marketplace.buyNow')
              )}
            </Button>
          </ModalFooter>
        </Modal>

        {/* Product Form Modal for Admin */}
        {isAdmin && (
          <ProductFormModal
            open={isProductModalOpen}
            onOpenChange={handleCloseProductModal}
            product={selectedProductForEdit}
            onSuccess={handleProductModalSuccess}
            existingCategories={categories}
          />
        )}

        {/* Cart Sidebar */}
        {!isAdmin && (
          <CartSidebar
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onCheckout={handleCheckout}
            isCheckoutLoading={isCheckoutLoading}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

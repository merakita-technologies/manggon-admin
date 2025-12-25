'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Package, Edit, Trash2, Power, Loader2, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { graphqlClient } from '@/lib/graphql'
import { formatCurrency } from '@/lib/currency-utils'
import { useI18n } from '@/contexts/i18n-context'
import { ProductFormModal } from '@/components/products/product-form-modal'

export default function ProductsPage() {
  const { t } = useI18n()
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await graphqlClient.getProducts({ includeInactive: true })
      setProducts(data)
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (product?: any) => {
    setSelectedProduct(product || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  const handleModalSuccess = () => {
    fetchProducts()
    handleCloseModal()
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

  const handleToggleStatus = async (product: any) => {
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

  const filteredProducts = products.filter((product) => {
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !product.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (categoryFilter && product.category !== categoryFilter) {
      return false
    }
    return true
  })

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('products.management')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('products.managementDescription')}
            </p>
          </div>
          <Button onClick={() => handleOpenModal()} className="sm:w-auto w-full">
            <Plus className="h-4 w-4 mr-2" />
            {t('products.addProduct')}
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t('products.products')}</CardTitle>
                <CardDescription>
                  {filteredProducts.length} {t('products.products')} {t('common.found')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
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
                <h3 className="text-lg font-semibold mb-2">{t('products.noProductsFound')}</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? t('common.tryAdjusting') : t('products.managementDescription')}
                </p>
                {!searchQuery && (
                  <Button onClick={() => handleOpenModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('products.addProduct')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {product.category && (
                        <Badge variant="outline" className="mt-2">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenModal(product)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(product)}>
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
                </CardHeader>
                <CardContent>
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description || t('products.noDescription')}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('products.price')}:</span>
                      <span className="text-lg font-bold">{formatCurrency(product.price)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('products.stock')}:</span>
                      <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                        {product.stock}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('products.pointsEarned')}:</span>
                      <Badge variant="secondary">{product.pointsEarned} {t('common.points')}</Badge>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">{t('common.status')}:</span>
                      <Badge variant={product.isActive ? 'default' : 'secondary'}>
                        {product.isActive ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <ProductFormModal
          open={isModalOpen}
          onOpenChange={handleCloseModal}
          product={selectedProduct}
          onSuccess={handleModalSuccess}
          existingCategories={categories}
        />
      </div>
    </DashboardLayout>
  )
}

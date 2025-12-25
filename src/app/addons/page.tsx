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
import { AddonFormModal } from '@/components/addons/addon-form-modal'

export default function AddonsPage() {
  const { t } = useI18n()
  const [addons, setAddons] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAddon, setSelectedAddon] = useState<any>(null)

  useEffect(() => {
    fetchAddons()
  }, [])

  const fetchAddons = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await graphqlClient.getAddons({ includeInactive: true })
      setAddons(data)
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (addon?: any) => {
    setSelectedAddon(addon || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAddon(null)
  }

  const handleModalSuccess = () => {
    fetchAddons()
    handleCloseModal()
  }

  const handleDeleteAddon = async (addon: any) => {
    if (!confirm(t('addons.deleteConfirm'))) {
      return
    }

    try {
      const result = await graphqlClient.deleteAddon(addon.id)
      if (result.success) {
        fetchAddons()
      } else {
        alert(result.message || t('addons.deleteSuccess'))
      }
    } catch (err: any) {
      console.error('Error deleting addon:', err)
      alert(err.message || t('common.error'))
    }
  }

  const handleToggleStatus = async (addon: any) => {
    try {
      const result = await graphqlClient.toggleAddonStatus(addon.id)
      if (result.success) {
        fetchAddons()
      } else {
        alert(result.message || t('common.error'))
      }
    } catch (err: any) {
      console.error('Error toggling addon status:', err)
      alert(err.message || t('common.error'))
    }
  }

  const filteredAddons = addons.filter((addon) => {
    if (searchQuery && !addon.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !addon.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (categoryFilter && addon.category !== categoryFilter) {
      return false
    }
    return true
  })

  const categories = Array.from(new Set(addons.map(a => a.category).filter(Boolean)))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('addons.management')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('addons.managementDescription')}
            </p>
          </div>
          <Button onClick={() => handleOpenModal()} className="sm:w-auto w-full">
            <Plus className="h-4 w-4 mr-2" />
            {t('addons.addAddon')}
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t('addons.addons')}</CardTitle>
                <CardDescription>
                  {filteredAddons.length} {t('addons.addons')} {t('common.found')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm min-w-[150px]"
                >
                  <option value="">{t('common.all')} {t('addons.category')}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('addons.searchPlaceholder')}
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
              <Button onClick={fetchAddons} variant="outline" className="mt-4">
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Addons Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAddons.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('addons.noAddonsFound')}</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? t('common.tryAdjusting') : t('addons.managementDescription')}
                </p>
                {!searchQuery && (
                  <Button onClick={() => handleOpenModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addons.addAddon')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAddons.map((addon) => (
              <Card key={addon.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{addon.name}</CardTitle>
                      {addon.category && (
                        <Badge variant="outline" className="mt-2">
                          {addon.category}
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
                        <DropdownMenuItem onClick={() => handleOpenModal(addon)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(addon)}>
                          <Power className="h-4 w-4 mr-2" />
                          {addon.isActive ? t('common.deactivate') : t('common.activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteAddon(addon)}
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
                  {addon.imageUrl && (
                    <img
                      src={addon.imageUrl}
                      alt={addon.name}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {addon.description || t('addons.noDescription')}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('addons.price')}:</span>
                      <span className="text-lg font-bold">{formatCurrency(addon.price)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('addons.type')}:</span>
                      <Badge variant="secondary">
                        {addon.isRecurring ? t('addons.recurring') : t('addons.oneTime')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">{t('common.status')}:</span>
                      <Badge variant={addon.isActive ? 'default' : 'secondary'}>
                        {addon.isActive ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddonFormModal
          open={isModalOpen}
          onOpenChange={handleCloseModal}
          addon={selectedAddon}
          onSuccess={handleModalSuccess}
        />
      </div>
    </DashboardLayout>
  )
}

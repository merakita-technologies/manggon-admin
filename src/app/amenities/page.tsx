'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Wifi, Edit, Trash2, Power, Loader2, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { graphqlClient } from '@/lib/graphql'
import { useI18n } from '@/contexts/i18n-context'
import { AmenityFormModal } from '@/components/amenities/amenity-form-modal'

export default function AmenitiesPage() {
  const { t } = useI18n()
  const [amenities, setAmenities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAmenity, setSelectedAmenity] = useState<any>(null)

  useEffect(() => {
    fetchAmenities()
  }, [])

  const fetchAmenities = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await graphqlClient.getAmenities({ includeInactive: true })
      setAmenities(data)
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (amenity?: any) => {
    setSelectedAmenity(amenity || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAmenity(null)
  }

  const handleModalSuccess = () => {
    fetchAmenities()
    handleCloseModal()
  }

  const handleDeleteAmenity = async (amenity: any) => {
    if (!confirm(t('amenities.deleteConfirm'))) {
      return
    }

    try {
      const result = await graphqlClient.deleteAmenity(amenity.id)
      if (result.success) {
        fetchAmenities()
      } else {
        alert(result.message || t('amenities.deleteSuccess'))
      }
    } catch (err: any) {
      console.error('Error deleting amenity:', err)
      alert(err.message || t('common.error'))
    }
  }

  const handleToggleStatus = async (amenity: any) => {
    try {
      const result = await graphqlClient.toggleAmenityStatus(amenity.id)
      if (result.success) {
        fetchAmenities()
      } else {
        alert(result.message || t('common.error'))
      }
    } catch (err: any) {
      console.error('Error toggling amenity status:', err)
      alert(err.message || t('common.error'))
    }
  }

  const filteredAmenities = amenities.filter((amenity) => {
    if (searchQuery && !amenity.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !amenity.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (categoryFilter && amenity.category !== categoryFilter) {
      return false
    }
    return true
  })

  const categories = Array.from(new Set(amenities.map(a => a.category).filter(Boolean)))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('amenities.management')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('amenities.managementDescription')}
            </p>
          </div>
          <Button onClick={() => handleOpenModal()} className="sm:w-auto w-full">
            <Plus className="h-4 w-4 mr-2" />
            {t('amenities.addAmenity')}
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t('amenities.amenities')}</CardTitle>
                <CardDescription>
                  {filteredAmenities.length} {t('amenities.amenities')} {t('common.found')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm min-w-[150px]"
                >
                  <option value="">{t('common.all')} {t('amenities.category')}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('amenities.searchPlaceholder')}
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
              <Button onClick={fetchAmenities} variant="outline" className="mt-4">
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Amenities Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAmenities.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('amenities.noAmenitiesFound')}</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? t('common.tryAdjusting') : t('amenities.managementDescription')}
                </p>
                {!searchQuery && (
                  <Button onClick={() => handleOpenModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('amenities.addAmenity')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAmenities.map((amenity) => (
              <Card key={amenity.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {amenity.icon && (
                          <span className="text-2xl">{amenity.icon}</span>
                        )}
                        <CardTitle className="text-lg">{amenity.name}</CardTitle>
                      </div>
                      {amenity.category && (
                        <Badge variant="outline" className="mt-2">
                          {amenity.category}
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
                        <DropdownMenuItem onClick={() => handleOpenModal(amenity)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(amenity)}>
                          <Power className="h-4 w-4 mr-2" />
                          {amenity.isActive ? t('common.deactivate') : t('common.activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteAmenity(amenity)}
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
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {amenity.description || t('amenities.noDescription')}
                  </p>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">{t('common.status')}:</span>
                    <Badge variant={amenity.isActive ? 'default' : 'secondary'}>
                      {amenity.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AmenityFormModal
          open={isModalOpen}
          onOpenChange={handleCloseModal}
          amenity={selectedAmenity}
          onSuccess={handleModalSuccess}
        />
      </div>
    </DashboardLayout>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  MoreHorizontal,
  Building,
  Edit,
  Loader2,
  Trash2,
  Power
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { graphqlClient } from '@/lib/graphql'
import { formatPricePerNight } from '@/lib/currency-utils'
import { PropertyFormModal } from '@/components/properties/property-form-modal'
import { useI18n } from '@/contexts/i18n-context'
import { ExportButton } from '@/components/ui/export-button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { PriceRangeFilter } from '@/components/ui/price-range-filter'

const statusVariants = {
  Active: 'default',
  Maintenance: 'secondary',
  Inactive: 'outline',
  Suspended: 'destructive'
} as const

const typeVariants = {
  Hotel: 'default',
  Villa: 'secondary',
  Cabin: 'destructive'
} as const

export default function PropertiesPage() {
  const { t } = useI18n()
  const [properties, setProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterCity, setFilterCity] = useState<string>('')
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null)
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null)
  const [filterMinPrice, setFilterMinPrice] = useState<number | null>(null)
  const [filterMaxPrice, setFilterMaxPrice] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<any>(null)

  useEffect(() => {
    fetchProperties()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProperties = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: any = {}
      if (searchQuery) params.search = searchQuery
      if (filterType) params.propertyType = filterType
      if (filterCity) params.city = filterCity

      const data = await graphqlClient.getProperties(params)
      setProperties(data)
    } catch (err: any) {
      setError(err.message || t('common.error'))
      console.error('Error fetching properties:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProperties = useMemo(() => {
    let filtered = properties
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((property) => 
        property.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Type filter
    if (filterType) {
      filtered = filtered.filter((property) => property.propertyType === filterType)
    }
    
    // City filter
    if (filterCity) {
      filtered = filtered.filter((property) => property.city === filterCity)
    }
    
    // Date range filter (created date)
    if (filterStartDate) {
      filtered = filtered.filter((property) => {
        const createdDate = property.createdAt ? new Date(property.createdAt) : null
        if (!createdDate) return true
        return createdDate >= filterStartDate
      })
    }
    if (filterEndDate) {
      filtered = filtered.filter((property) => {
        const createdDate = property.createdAt ? new Date(property.createdAt) : null
        if (!createdDate) return true
        return createdDate <= filterEndDate
      })
    }
    
    // Price range filter
    if (filterMinPrice !== null) {
      filtered = filtered.filter((property) => {
        const price = property.pricePerNight || 0
        return price >= filterMinPrice!
      })
    }
    if (filterMaxPrice !== null) {
      filtered = filtered.filter((property) => {
        const price = property.pricePerNight || 0
        return price <= filterMaxPrice!
      })
    }
    
    return filtered
  }, [properties, searchQuery, filterType, filterCity, filterStartDate, filterEndDate, filterMinPrice, filterMaxPrice])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProperties()
  }

  const handleAddProperty = () => {
    setSelectedProperty(null)
    setIsModalOpen(true)
  }

  const handleEditProperty = (property: any) => {
    setSelectedProperty(property)
    setIsModalOpen(true)
  }

  const handleDeleteProperty = async (property: any) => {
    if (!confirm(t('properties.deleteConfirm', { name: property.name }))) {
      return
    }

    try {
      const result = await graphqlClient.deleteProperty(property.id)
      if (result.success) {
        fetchProperties()
      } else {
        alert(result.message || t('properties.deleteError'))
      }
    } catch (err: any) {
      console.error('Error deleting property:', err)
      alert(err.message || t('properties.deleteError'))
    }
  }

  const handleToggleStatus = async (property: any) => {
    try {
      const result = await graphqlClient.togglePropertyStatus(property.id)
      if (result.success) {
        fetchProperties()
      } else {
        alert(result.message || t('common.error'))
      }
    } catch (err: any) {
      console.error('Error toggling property status:', err)
      alert(err.message || t('common.error'))
    }
  }

  const handleModalSuccess = () => {
    fetchProperties()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('properties.management')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('properties.managementDescription')}
            </p>
          </div>
          <Button className="sm:w-auto w-full" onClick={handleAddProperty}>
            <Plus className="h-4 w-4 mr-2" />
            {t('properties.addProperty')}
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t('properties.title')}</CardTitle>
                <CardDescription>
                  {t('properties.managementDescription')}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('properties.searchPlaceholder')}
                      className="w-full sm:w-[200px] pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </form>
                <ExportButton
                  data={filteredProperties}
                  filename="properties"
                  formats={['csv', 'excel', 'pdf']}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">{t('common.all')} {t('properties.propertyType', { defaultValue: 'Types' })}</option>
                  <option value="hotel">Hotel</option>
                  <option value="villa">Villa</option>
                  <option value="apartment">Apartment</option>
                  <option value="resort">Resort</option>
                  <option value="hostel">Hostel</option>
                  <option value="guesthouse">Guesthouse</option>
                </select>
              </div>
              <div>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">{t('common.all')} {t('properties.cities', { defaultValue: 'Cities' })}</option>
                  {Array.from(new Set(properties.map(p => p.city).filter(Boolean))).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <DateRangePicker
                startDate={filterStartDate}
                endDate={filterEndDate}
                onChange={(start, end) => {
                  setFilterStartDate(start)
                  setFilterEndDate(end)
                }}
                label={t('properties.createdDate')}
              />
              <PriceRangeFilter
                minPrice={filterMinPrice}
                maxPrice={filterMaxPrice}
                onChange={(min, max) => {
                  setFilterMinPrice(min)
                  setFilterMaxPrice(max)
                }}
                label={t('properties.priceRange')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={fetchProperties} variant="outline" className="mt-4">
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('properties.noPropertiesFound')}</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? t('properties.tryAdjusting') : t('properties.getStarted')}
                </p>
                <Button onClick={handleAddProperty}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('properties.addProperty')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Properties Grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => (
              <PropertyCard 
                key={property.id} 
                property={property}
                onEdit={handleEditProperty}
                onDelete={handleDeleteProperty}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Property Form Modal */}
      <PropertyFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        property={selectedProperty}
        onSuccess={handleModalSuccess}
      />
    </DashboardLayout>
  )
}

function PropertyCard({ 
  property,
  onEdit,
  onDelete,
  onToggleStatus
}: { 
  property: any
  onEdit: (property: any) => void
  onDelete: (property: any) => void
  onToggleStatus: (property: any) => void
}) {
  const status = property.isActive ? 'Active' : 'Inactive'
  const totalRooms = property.rooms?.length || 0
  const availableRooms = property.rooms?.filter((r: any) => r.isActive).length || 0

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200">
      {/* Property Image */}
      <div className="aspect-video relative bg-gradient-to-br from-blue-400 to-purple-500">
        {property.imageUrls && property.imageUrls.length > 0 && (
          <img 
            src={property.imageUrls[0]} 
            alt={property.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={statusVariants[status as keyof typeof statusVariants]}>
            {status}
          </Badge>
          <Badge variant={typeVariants[property.propertyType as keyof typeof typeVariants] || 'default'}>
            {property.propertyType}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white relative z-10"
                type="button"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(property)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Property
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(property)}>
                <Power className="h-4 w-4 mr-2" />
                {property.isActive ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(property)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <CardTitle className="text-lg leading-tight">{property.name}</CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{property.city}, {property.country}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-foreground">{property.rating?.toFixed(1) || '0.0'}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({property.reviewCount || 0} reviews)
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {property.description || 'No description available'}
        </p>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {property.amenities.slice(0, 3).map((amenity: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {property.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{property.amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Property Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs font-medium">Rooms</div>
            <div className="font-semibold text-foreground">
              {availableRooms}/{totalRooms} available
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs font-medium">Price</div>
            <div className="font-semibold text-foreground">
              {formatPricePerNight(property.pricePerNight)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs font-medium">Check-in</div>
            <div className="font-semibold text-foreground">{property.checkInTime || '14:00'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs font-medium">Check-out</div>
            <div className="font-semibold text-foreground">{property.checkOutTime || '12:00'}</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="grid grid-rows-2 gap-4 pt-3 border-t">
        <div className="flex justify-between text-xs text-muted-foreground">
          Owner: {property.owner?.fullName || t('common.unknown')}
        </div>
        <div className="flex items-center gap-2">
          {property.dynamicPricingEnabled && (
            <Badge variant="default" className="text-xs">
              Dynamic Pricing
            </Badge>
          )}
          <Button size="sm">Manage</Button>
        </div>
      </CardFooter>
    </Card>
  )
}
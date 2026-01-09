'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
  Power,
  MessageSquare,
  LayoutGrid,
  Table as TableIcon,
  Eye
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { graphqlClient } from '@/lib/graphql'
import { PropertyFormModal } from '@/components/properties/property-form-modal'
import { useI18n } from '@/contexts/i18n-context'
import { ExportButton } from '@/components/ui/export-button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/currency-utils'

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
  const router = useRouter()
  const { t } = useI18n()
  const [properties, setProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterCity, setFilterCity] = useState<string>('')
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null)
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')

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
      console.log('Fetched properties:', data)
      if (data.length > 0) {
        console.log('First property owner:', data[0]?.owner)
      }
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
    
    // Price range filter - removed because pricing is now based on room units
    // If needed in the future, filter by minimum price from room units
    
    return filtered
  }, [properties, searchQuery, filterType, filterCity, filterStartDate, filterEndDate])

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

  const handleChatWithOwner = async (property: any) => {
    if (!property.owner?.id) {
      alert(t('chat.noOwner') || 'Property owner not found')
      return
    }

    try {
      // Create or get existing conversation with owner
      const conversation = await graphqlClient.createConversation({
        propertyId: property.id,
        ownerId: property.owner.id,
      })
      
      // Navigate to chat page with conversation ID
      router.push(`/chat?conversationId=${conversation.id}`)
    } catch (error: any) {
      console.error('Error creating conversation:', error)
      // If conversation already exists, try to find it
      try {
        const conversations = await graphqlClient.getConversations()
        const existingConversation = conversations.find(
          (conv: any) => conv.propertyId === property.id
        )
        if (existingConversation) {
          router.push(`/chat?conversationId=${existingConversation.id}`)
        } else {
          alert(t('chat.createConversationError') || 'Failed to start conversation. Please try again.')
        }
      } catch (err) {
        alert(t('chat.createConversationError') || 'Failed to start conversation. Please try again.')
      }
    }
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
        ) : viewMode === 'card' ? (
          /* Properties Grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => (
              <PropertyCard 
                key={property.id} 
                property={property}
                onEdit={handleEditProperty}
                onDelete={handleDeleteProperty}
                onToggleStatus={handleToggleStatus}
                onChat={handleChatWithOwner}
              />
            ))}
          </div>
        ) : (
          /* Properties Table */
          <Card>
            <CardHeader>
              <CardTitle>{t('properties.title')}</CardTitle>
              <CardDescription>
                {filteredProperties.length} {t('properties.propertiesFound', { defaultValue: 'properties found' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('properties.name', { defaultValue: 'Name' })}</TableHead>
                      <TableHead>{t('properties.type', { defaultValue: 'Type' })}</TableHead>
                      <TableHead>{t('properties.location', { defaultValue: 'Location' })}</TableHead>
                      <TableHead>{t('properties.rooms', { defaultValue: 'Rooms' })}</TableHead>
                      <TableHead>{t('properties.status', { defaultValue: 'Status' })}</TableHead>
                      <TableHead>{t('common.actions', { defaultValue: 'Actions' })}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => {
                      const metrics = getPropertyMetrics(property)
                      return (
                        <TableRow key={property.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {property.imageUrls && property.imageUrls.length > 0 && (
                                <img
                                  src={property.imageUrls[0]}
                                  alt={property.name}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <div className="font-semibold">{property.name}</div>
                                {property.rating && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{property.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{property.propertyType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{property.city}, {property.country}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{metrics.totalRooms} {t('properties.total', { defaultValue: 'total' })}</div>
                              <div className="text-muted-foreground text-xs">
                                {metrics.activeRooms} {t('properties.active', { defaultValue: 'active' })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={property.isActive ? 'default' : 'secondary'}>
                              {property.isActive ? t('common.active') : t('common.inactive')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  router.push(`/properties/${property.id}`)
                                }}
                                title={t('common.view', { defaultValue: 'View' })}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProperty(property)}
                                title={t('common.edit', { defaultValue: 'Edit' })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(property)}
                                title={property.isActive ? t('common.deactivate', { defaultValue: 'Deactivate' }) : t('common.activate', { defaultValue: 'Activate' })}
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => router.push(`/rooms?property=${property.id}`)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t('properties.viewRooms', { defaultValue: 'View Rooms' })}
                                  </DropdownMenuItem>
                                  {property.owner?.id && (
                                    <DropdownMenuItem onClick={() => handleChatWithOwner(property)}>
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      {t('chat.chatOwner')}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteProperty(property)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t('common.delete', { defaultValue: 'Delete' })}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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
  onToggleStatus,
  onChat
}: { 
  property: any
  onEdit: (property: any) => void
  onDelete: (property: any) => void
  onToggleStatus: (property: any) => void
  onChat: (property: any) => void
}) {
  const router = useRouter()
  const { t } = useI18n()
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
            <div className="text-muted-foreground text-xs font-medium">Rooms</div>
            <div className="font-semibold text-foreground">
              {totalRooms} total
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

      <CardFooter className="flex flex-col gap-3 pt-3 border-t">
        {/* Primary Actions */}
        <div className="flex items-center gap-2 w-full">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => {
              // Navigate to rooms page filtered by this property
              router.push(`/rooms?property=${property.id}`)
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            {t('properties.viewRooms', { defaultValue: 'Lihat Kamar' })}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onEdit(property)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit', { defaultValue: 'Kelola' })}
          </Button>
        </div>
        {/* Secondary Actions */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {t('properties.owner', { defaultValue: 'Owner' })}: {property.owner?.fullName || t('common.unknown')}
          </span>
          <div className="flex items-center gap-2">
            {property.dynamicPricingEnabled && (
              <Badge variant="default" className="text-xs">
                {t('properties.dynamicPricing', { defaultValue: 'Dynamic Pricing' })}
              </Badge>
            )}
            {property.owner?.id && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onChat(property)}
                className="h-6 px-2"
                title={t('chat.chatOwner')}
              >
                <MessageSquare className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
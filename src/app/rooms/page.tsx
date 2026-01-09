'use client'

import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Bed, Clock, Loader2, Building, Eye, Edit, Trash2, Power, ArrowUpDown, ArrowUp, ArrowDown, CheckSquare, Square } from 'lucide-react'
import { graphqlClient } from '@/lib/graphql'
import { RoomFormModal } from '@/components/rooms/room-form-modal'
import { formatPricePerNight } from '@/lib/currency-utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { useI18n } from '@/contexts/i18n-context'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'

export default function RoomsPage() {
  const { t } = useI18n()
  const [properties, setProperties] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [rooms, setRooms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isCompactMode, setIsCompactMode] = useState(false)

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    if (selectedProperty) {
      fetchRooms(selectedProperty)
    } else {
      fetchAllRooms()
    }
  }, [selectedProperty])

  const fetchProperties = async () => {
    try {
      const data = await graphqlClient.getProperties()
      setProperties(data)
      if (data.length > 0 && !selectedProperty) {
        setSelectedProperty(data[0].id)
      }
    } catch (err: any) {
      setError(err.message || t('rooms.fetchPropertiesError'))
    }
  }

  const fetchAllRooms = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const allProperties = await graphqlClient.getProperties()
      const allRooms: any[] = []
      allProperties.forEach((property: any) => {
        if (property.rooms) {
          property.rooms.forEach((room: any) => {
            allRooms.push({
              ...room,
              propertyName: property.name,
              propertyId: property.id,
            })
          })
        }
      })
      setRooms(allRooms)
    } catch (err: any) {
      setError(err.message || t('rooms.fetchRoomsError'))
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRooms = async (propertyId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const property = await graphqlClient.getProperty(propertyId)
      const propertyRooms = (property?.rooms || []).map((room: any) => ({
        ...room,
        propertyName: property.name,
        propertyId: property.id,
      }))
      setRooms(propertyRooms)
    } catch (err: any) {
      setError(err.message || t('rooms.fetchRoomsError'))
    } finally {
      setIsLoading(false)
    }
  }

  // Sorting function
  const sortedAndFilteredRooms = useMemo(() => {
    let filtered = rooms.filter((room) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        room.roomNumber?.toLowerCase().includes(query) ||
        room.roomType?.toLowerCase().includes(query) ||
        room.propertyName?.toLowerCase().includes(query) ||
        room.description?.toLowerCase().includes(query)
      )
    })

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any
        let bVal: any

        switch (sortColumn) {
          case 'property':
            aVal = a.propertyName || ''
            bVal = b.propertyName || ''
            break
          case 'roomNumber':
            aVal = a.roomNumber || ''
            bVal = b.roomNumber || ''
            break
          case 'roomType':
            aVal = a.roomType || ''
            bVal = b.roomType || ''
            break
          case 'capacity':
            aVal = a.capacity || 0
            bVal = b.capacity || 0
            break
          case 'price':
            aVal = a.basePricePerNight || 0
            bVal = b.basePricePerNight || 0
            break
          case 'status':
            aVal = a.isActive ? 1 : 0
            bVal = b.isActive ? 1 : 0
            break
          default:
            return 0
        }

        if (typeof aVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        } else {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
        }
      })
    }

    return filtered
  }, [rooms, searchQuery, sortColumn, sortDirection])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleSelectRoom = (roomId: string, selected: boolean) => {
    setSelectedRooms(prev => {
      const next = new Set(prev)
      if (selected) {
        next.add(roomId)
      } else {
        next.delete(roomId)
      }
      return next
    })
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRooms(new Set(sortedAndFilteredRooms.map(r => r.id)))
    } else {
      setSelectedRooms(new Set())
    }
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedRooms.size === 0) return

    const confirmMessage = action === 'delete'
      ? t('rooms.bulkDeleteConfirm', { count: selectedRooms.size, defaultValue: `Delete ${selectedRooms.size} rooms?` })
      : action === 'activate'
      ? t('rooms.bulkActivateConfirm', { count: selectedRooms.size, defaultValue: `Activate ${selectedRooms.size} rooms?` })
      : t('rooms.bulkDeactivateConfirm', { count: selectedRooms.size, defaultValue: `Deactivate ${selectedRooms.size} rooms?` })

    if (!confirm(confirmMessage)) return

    try {
      const promises = Array.from(selectedRooms).map(roomId => {
        const room = rooms.find(r => r.id === roomId)
        if (!room) return Promise.resolve()

        switch (action) {
          case 'activate':
          case 'deactivate':
            return graphqlClient.toggleRoomStatus(roomId)
          case 'delete':
            return graphqlClient.deleteRoomUnit(roomId)
          default:
            return Promise.resolve()
        }
      })

      await Promise.all(promises)
      setSelectedRooms(new Set())
      
      if (selectedProperty) {
        fetchRooms(selectedProperty)
      } else {
        fetchAllRooms()
      }
    } catch (err: any) {
      console.error('Error performing bulk action:', err)
      alert(err.message || t('common.error'))
    }
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />
  }

  const handleAddRoom = () => {
    setSelectedRoom(null)
    setIsModalOpen(true)
  }

  const handleEditRoom = (room: any) => {
    setSelectedRoom(room)
    setIsModalOpen(true)
  }

  const handleDeleteRoom = async (room: any) => {
    if (!confirm(t('rooms.deleteConfirm', { roomNumber: room.roomNumber }))) {
      return
    }

    try {
      const result = await graphqlClient.deleteRoomUnit(room.id)
      if (result.success) {
        if (selectedProperty) {
          fetchRooms(selectedProperty)
        } else {
          fetchAllRooms()
        }
      } else {
        alert(result.message || t('rooms.deleteSuccess'))
      }
    } catch (err: any) {
      console.error('Error deleting room unit:', err)
      alert(err.message || t('common.error'))
    }
  }

  const handleToggleStatus = async (room: any) => {
    try {
      const result = await graphqlClient.toggleRoomStatus(room.id)
      if (result.success) {
        if (selectedProperty) {
          fetchRooms(selectedProperty)
        } else {
          fetchAllRooms()
        }
      } else {
        alert(result.message || t('common.error'))
      }
    } catch (err: any) {
      console.error('Error toggling room status:', err)
      alert(err.message || t('common.error'))
    }
  }

  const handleModalSuccess = () => {
    if (selectedProperty) {
      fetchRooms(selectedProperty)
    } else {
      fetchAllRooms()
    }
  }

  const allSelected = sortedAndFilteredRooms.length > 0 && sortedAndFilteredRooms.every(room => selectedRooms.has(room.id))
  const someSelected = selectedRooms.size > 0 && !allSelected

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: t('dashboard.title', { defaultValue: 'Dashboard' }), href: '/' },
            { label: t('properties.title', { defaultValue: 'Properties' }), href: '/properties' },
            { label: t('rooms.title', { defaultValue: 'Rooms' }) }
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('rooms.management')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('rooms.managementDescription')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Compact Mode Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCompactMode(!isCompactMode)}
              title={isCompactMode ? t('rooms.comfortableMode', { defaultValue: 'Comfortable Mode' }) : t('rooms.compactMode', { defaultValue: 'Compact Mode' })}
            >
              {isCompactMode ? '☰' : '☷'}
            </Button>
            <Button onClick={handleAddRoom}>
              <Plus className="h-4 w-4 mr-2" />
              {t('rooms.addRoomButton')}
            </Button>
          </div>
        </div>

        {/* Property Filter */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t('rooms.filterByProperty')}</CardTitle>
                <CardDescription>
                  {t('rooms.filterDescription')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm min-w-[200px]"
                >
                  <option value="">{t('rooms.allProperties')}</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('rooms.searchPlaceholder')}
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
              <Button onClick={() => selectedProperty ? fetchRooms(selectedProperty) : fetchAllRooms()} variant="outline" className="mt-4">
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bulk Actions Toolbar */}
        {selectedRooms.size > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedRooms.size} {t('rooms.selected', { defaultValue: 'selected' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {t('common.activate', { defaultValue: 'Activate' })}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('deactivate')}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {t('common.deactivate', { defaultValue: 'Deactivate' })}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('common.delete', { defaultValue: 'Delete' })}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRooms(new Set())}
                  >
                    {t('common.clear', { defaultValue: 'Clear' })}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rooms Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('rooms.title')}</CardTitle>
                <CardDescription>
                  {sortedAndFilteredRooms.length} {t('rooms.room')}{sortedAndFilteredRooms.length !== 1 ? 's' : ''} {t('common.found')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sortedAndFilteredRooms.length === 0 ? (
              <div className="text-center py-12">
                <Bed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('rooms.noRoomsFound')}</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? t('rooms.tryAdjustingRooms') : t('rooms.noRoomsMessage')}
                </p>
                <Button onClick={handleAddRoom}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('rooms.addRoomButton')}
                </Button>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('property')}
                          className="flex items-center hover:text-foreground transition-colors"
                        >
                          {t('rooms.propertyName', { defaultValue: 'Property Name' })}
                          {getSortIcon('property')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('roomNumber')}
                          className="flex items-center hover:text-foreground transition-colors"
                        >
                          {t('rooms.roomNumber', { defaultValue: 'Room Number' })}
                          {getSortIcon('roomNumber')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('roomType')}
                          className="flex items-center hover:text-foreground transition-colors"
                        >
                          {t('rooms.roomType', { defaultValue: 'Type' })}
                          {getSortIcon('roomType')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('capacity')}
                          className="flex items-center hover:text-foreground transition-colors"
                        >
                          {t('rooms.guestCapacity', { defaultValue: 'Guest Capacity' })}
                          {getSortIcon('capacity')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('price')}
                          className="flex items-center hover:text-foreground transition-colors"
                        >
                          {t('rooms.pricePerNight', { defaultValue: 'Price per Night' })}
                          {getSortIcon('price')}
                        </button>
                      </TableHead>
                      <TableHead>{t('rooms.hourlyBooking', { defaultValue: 'Hourly Booking' })}</TableHead>
                      <TableHead className="text-center">{t('rooms.status', { defaultValue: 'Status' })}</TableHead>
                      <TableHead className="text-center">{t('common.actions', { defaultValue: 'Actions' })}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredRooms.map((room) => (
                      <TableRow key={room.id} className={isCompactMode ? 'h-12' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRooms.has(room.id)}
                            onCheckedChange={(checked) => handleSelectRoom(room.id, checked as boolean)}
                            aria-label={`Select room ${room.roomNumber}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{room.propertyName}</span>
                          </div>
                        </TableCell>
                        <TableCell className={isCompactMode ? 'font-mono text-sm' : 'font-mono'}>
                          {room.roomNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{room.roomType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{room.capacity}</span>
                            <span className="text-muted-foreground text-xs">{t('rooms.guests', { defaultValue: 'guests' })}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatPricePerNight(room.basePricePerNight)}
                        </TableCell>
                        <TableCell>
                          {room.supportsHourlyBooking ? (
                            <Badge variant="default" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {t('common.yes', { defaultValue: 'Yes' })}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{t('common.no', { defaultValue: 'No' })}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={room.isActive}
                              onCheckedChange={() => handleToggleStatus(room)}
                              aria-label={`Toggle status for ${room.roomNumber}`}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRoom(room)}
                              title={t('common.edit', { defaultValue: 'Edit' })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRoom(room)}
                              title={t('common.delete', { defaultValue: 'Delete' })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Room Form Modal */}
      <RoomFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        room={selectedRoom}
        propertyId={selectedProperty || undefined}
        onSuccess={handleModalSuccess}
      />
    </DashboardLayout>
  )
}



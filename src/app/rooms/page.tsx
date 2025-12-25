'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Bed, Clock, Loader2, Building, Eye, Edit, Trash2, Power } from 'lucide-react'
import { graphqlClient } from '@/lib/graphql'
import { RoomFormModal } from '@/components/rooms/room-form-modal'
import { formatPricePerNight } from '@/lib/currency-utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { useI18n } from '@/contexts/i18n-context'

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

  const filteredRooms = rooms.filter((room) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      room.roomNumber?.toLowerCase().includes(query) ||
      room.roomType?.toLowerCase().includes(query) ||
      room.propertyName?.toLowerCase().includes(query) ||
      room.description?.toLowerCase().includes(query)
    )
  })

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('rooms.management')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('rooms.managementDescription')}
            </p>
          </div>
          <Button onClick={handleAddRoom}>
            <Plus className="h-4 w-4 mr-2" />
            {t('rooms.addRoomButton')}
          </Button>
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

        {/* Rooms Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('rooms.title')}</CardTitle>
            <CardDescription>
              {filteredRooms.length} {t('rooms.room')}{filteredRooms.length !== 1 ? 's' : ''} {t('common.found')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRooms.length === 0 ? (
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
                      <TableHead>{t('rooms.property', { defaultValue: 'Property' })}</TableHead>
                      <TableHead>{t('rooms.roomNumber')}</TableHead>
                      <TableHead>{t('rooms.roomType')}</TableHead>
                      <TableHead>{t('rooms.capacity')}</TableHead>
                      <TableHead>{t('rooms.basePricePerNight')}</TableHead>
                      <TableHead>{t('rooms.supportsHourlyBooking')}</TableHead>
                      <TableHead>{t('rooms.status', { defaultValue: 'Status' })}</TableHead>
                      <TableHead>{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{room.propertyName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{room.roomNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{room.roomType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{room.capacity}</span>
                            <span className="text-muted-foreground text-xs">guests</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatPricePerNight(room.basePricePerNight)}
                        </TableCell>
                        <TableCell>
                          {room.supportsHourlyBooking ? (
                            <Badge variant="default" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {t('common.active')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{t('common.inactive')}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={room.isActive ? 'default' : 'secondary'}>
                            {room.isActive ? t('common.active') : t('common.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditRoom(room)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t('rooms.editRoom')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(room)}>
                                <Power className="h-4 w-4 mr-2" />
                                {room.isActive ? t('common.deactivate', { defaultValue: 'Deactivate' }) : t('common.activate', { defaultValue: 'Activate' })}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteRoom(room)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('rooms.deleteRoom')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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



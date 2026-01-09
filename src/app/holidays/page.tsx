'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Calendar, Edit, Trash2, Power, Loader2, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { graphqlClient } from '@/lib/graphql'
import { useI18n } from '@/contexts/i18n-context'
import { HolidayFormModal } from '@/components/holidays/holiday-form-modal'

export default function HolidaysPage() {
  const { t } = useI18n()
  const [holidays, setHolidays] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedHoliday, setSelectedHoliday] = useState<any>(null)

  useEffect(() => {
    fetchHolidays()
  }, [])

  const fetchHolidays = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await graphqlClient.getHolidays()
      setHolidays(data)
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (holiday?: any) => {
    setSelectedHoliday(holiday || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedHoliday(null)
  }

  const handleModalSuccess = () => {
    fetchHolidays()
    handleCloseModal()
  }

  const handleDeleteHoliday = async (holiday: any) => {
    if (!confirm('Apakah Anda yakin ingin menghapus hari libur ini?')) {
      return
    }

    try {
      await graphqlClient.deleteHoliday(holiday.id)
      fetchHolidays()
    } catch (err: any) {
      console.error('Error deleting holiday:', err)
      alert(err.message || t('common.error'))
    }
  }

  const handleToggleStatus = async (holiday: any) => {
    try {
      await graphqlClient.updateHoliday(holiday.id, { isActive: !holiday.isActive })
      fetchHolidays()
    } catch (err: any) {
      console.error('Error toggling holiday status:', err)
      alert(err.message || t('common.error'))
    }
  }

  const filteredHolidays = holidays.filter((holiday) => {
    if (searchQuery && !holiday.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !holiday.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getDayOfWeekName = (dayOfWeek?: number) => {
    if (dayOfWeek === undefined || dayOfWeek === null) return null
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    return days[dayOfWeek]
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Kelola Hari Libur</h1>
            <p className="text-muted-foreground mt-1">
              Kelola hari libur dan pengaturan multiplier harga
            </p>
          </div>
          <Button onClick={() => handleOpenModal()} className="sm:w-auto w-full">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Hari Libur
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Daftar Hari Libur</CardTitle>
                <CardDescription>
                  {filteredHolidays.length} hari libur ditemukan
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari hari libur..."
                  className="w-full sm:w-[300px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                {error}
              </div>
            ) : filteredHolidays.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Tidak ada hari libur ditemukan
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHolidays.map((holiday) => (
                  <Card key={holiday.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">{holiday.name}</CardTitle>
                            <Badge variant={holiday.isActive ? 'default' : 'secondary'}>
                              {holiday.isActive ? 'Aktif' : 'Tidak Aktif'}
                            </Badge>
                            {holiday.isRecurring && (
                              <Badge variant="outline">Recurring</Badge>
                            )}
                          </div>
                          {holiday.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {holiday.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {holiday.isRecurring ? (
                              <>
                                {holiday.dayOfWeek !== null && holiday.dayOfWeek !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Setiap {getDayOfWeekName(holiday.dayOfWeek)}
                                  </span>
                                )}
                                {holiday.monthDay && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Setiap {holiday.monthDay}
                                  </span>
                                )}
                                {!holiday.dayOfWeek && !holiday.monthDay && holiday.date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(holiday.date)} (Referensi)
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(holiday.date)}
                              </span>
                            )}
                            <span>
                              Multiplier: {holiday.priceMultiplier}x
                            </span>
                            {holiday.priority > 0 && (
                              <span>
                                Prioritas: {holiday.priority}
                              </span>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenModal(holiday)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(holiday)}>
                              <Power className="h-4 w-4 mr-2" />
                              {holiday.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteHoliday(holiday)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <HolidayFormModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          holiday={selectedHoliday}
        />
      </div>
    </DashboardLayout>
  )
}

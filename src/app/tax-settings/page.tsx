'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Power, Loader2, MoreHorizontal, CheckCircle2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { graphqlClient } from '@/lib/graphql'
import { useI18n } from '@/contexts/i18n-context'
import { TaxSettingsFormModal } from '@/components/tax-settings/tax-settings-form-modal'

export default function TaxSettingsPage() {
  const { t } = useI18n()
  const [taxSettings, setTaxSettings] = useState<any[]>([])
  const [activeSettings, setActiveSettings] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSettings, setSelectedSettings] = useState<any>(null)

  useEffect(() => {
    fetchTaxSettings()
  }, [])

  const fetchTaxSettings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [allSettings, active] = await Promise.all([
        graphqlClient.getAllTaxSettings(),
        graphqlClient.getActiveTaxSettings(),
      ])
      setTaxSettings(allSettings)
      setActiveSettings(active)
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (settings?: any) => {
    setSelectedSettings(settings || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedSettings(null)
  }

  const handleModalSuccess = () => {
    fetchTaxSettings()
    handleCloseModal()
  }

  const handleActivate = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin mengaktifkan pengaturan pajak ini? Pengaturan aktif saat ini akan dinonaktifkan.')) {
      return
    }

    try {
      await graphqlClient.activateTaxSettings(id)
      fetchTaxSettings()
    } catch (err: any) {
      console.error('Error activating tax settings:', err)
      alert(err.message || t('common.error'))
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Pengaturan Pajak</h1>
            <p className="text-muted-foreground mt-1">
              Kelola konfigurasi service fee dan tarif PPN (VAT)
            </p>
          </div>
          <Button onClick={() => handleOpenModal()} className="sm:w-auto w-full">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pengaturan
          </Button>
        </div>

        {/* Active Settings Card */}
        {activeSettings && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>Pengaturan Aktif</CardTitle>
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Aktif
                    </Badge>
                  </div>
                  <CardDescription>
                    Pengaturan yang sedang digunakan untuk perhitungan pajak
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Service Fee</p>
                  <p className="text-2xl font-bold">{formatPercentage(activeSettings.serviceFeePercentage)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">VAT Rate (PPN)</p>
                  <p className="text-2xl font-bold">
                    {activeSettings.vatEnabled 
                      ? formatPercentage(activeSettings.vatRate)
                      : 'Nonaktif'}
                  </p>
                  {!activeSettings.vatEnabled && (
                    <p className="text-xs text-muted-foreground mt-1">
                      PPN dinonaktifkan
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Berlaku Dari</p>
                  <p className="text-lg font-medium">{formatDate(activeSettings.effectiveFrom)}</p>
                </div>
              </div>
              {activeSettings.notes && (
                <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Catatan:</p>
                  <p className="text-sm">{activeSettings.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Settings List */}
        <Card>
          <CardHeader>
            <CardTitle>Semua Pengaturan Pajak</CardTitle>
            <CardDescription>
              {taxSettings.length} pengaturan ditemukan
            </CardDescription>
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
            ) : taxSettings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Tidak ada pengaturan pajak ditemukan
              </div>
            ) : (
              <div className="space-y-4">
                {taxSettings.map((settings) => (
                  <Card 
                    key={settings.id} 
                    className={`hover:shadow-lg transition-shadow ${
                      settings.isActive ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">
                              {settings.isActive ? 'Pengaturan Aktif' : 'Pengaturan Tidak Aktif'}
                            </CardTitle>
                            <Badge variant={settings.isActive ? 'default' : 'secondary'}>
                              {settings.isActive ? 'Aktif' : 'Tidak Aktif'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Service Fee</p>
                              <p className="text-lg font-semibold">{formatPercentage(settings.serviceFeePercentage)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">VAT Rate (PPN)</p>
                              <p className="text-lg font-semibold">
                                {settings.vatEnabled 
                                  ? formatPercentage(settings.vatRate)
                                  : 'Nonaktif'}
                              </p>
                              {!settings.vatEnabled && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  PPN dinonaktifkan
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-muted-foreground">Berlaku Dari</p>
                              <p className="font-medium">{formatDate(settings.effectiveFrom)}</p>
                              {settings.effectiveTo && (
                                <>
                                  <p className="text-muted-foreground mt-1">Berlaku Sampai</p>
                                  <p className="font-medium">{formatDate(settings.effectiveTo)}</p>
                                </>
                              )}
                            </div>
                          </div>
                          {settings.notes && (
                            <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded text-sm">
                              <p className="text-muted-foreground mb-1">Catatan:</p>
                              <p>{settings.notes}</p>
                            </div>
                          )}
                          <div className="mt-3 text-xs text-muted-foreground">
                            Dibuat: {formatDate(settings.createdAt)}
                            {settings.updatedAt !== settings.createdAt && (
                              <> • Diperbarui: {formatDate(settings.updatedAt)}</>
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
                            <DropdownMenuItem onClick={() => handleOpenModal(settings)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {!settings.isActive && (
                              <DropdownMenuItem onClick={() => handleActivate(settings.id)}>
                                <Power className="h-4 w-4 mr-2" />
                                Aktifkan
                              </DropdownMenuItem>
                            )}
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

        <TaxSettingsFormModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          taxSettings={selectedSettings}
        />
      </div>
    </DashboardLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalContent, ModalFooter, ModalTitle, ModalDescription } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { graphqlClient } from '@/lib/graphql'
import { useI18n } from '@/contexts/i18n-context'
import { Loader2 } from 'lucide-react'

interface HolidayFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  holiday?: any
}

export function HolidayFormModal({ open, onClose, onSuccess, holiday }: HolidayFormModalProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    isRecurring: false,
    dayOfWeek: '',
    monthDay: '',
    priceMultiplier: '1.5',
    isActive: true,
    priority: '0',
  })

  useEffect(() => {
    if (holiday) {
      setFormData({
        name: holiday.name || '',
        description: holiday.description || '',
        date: holiday.date ? new Date(holiday.date).toISOString().split('T')[0] : '',
        isRecurring: holiday.isRecurring || false,
        dayOfWeek: holiday.dayOfWeek?.toString() || '',
        monthDay: holiday.monthDay || '',
        priceMultiplier: holiday.priceMultiplier?.toString() || '1.5',
        isActive: holiday.isActive !== undefined ? holiday.isActive : true,
        priority: holiday.priority?.toString() || '0',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        date: '',
        isRecurring: false,
        dayOfWeek: '',
        monthDay: '',
        priceMultiplier: '1.5',
        isActive: true,
        priority: '0',
      })
    }
  }, [holiday, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const input: any = {
        name: formData.name,
        description: formData.description || undefined,
        isRecurring: formData.isRecurring,
        priceMultiplier: parseFloat(formData.priceMultiplier),
        isActive: formData.isActive,
        priority: parseInt(formData.priority) || 0,
      }

      if (formData.isRecurring) {
        if (formData.dayOfWeek) {
          input.dayOfWeek = parseInt(formData.dayOfWeek)
        }
        if (formData.monthDay) {
          input.monthDay = formData.monthDay
        }
        // For recurring holidays, date can still be set as reference
        if (formData.date) {
          input.date = formData.date
        }
      } else {
        if (!formData.date) {
          alert('Tanggal harus diisi untuk hari libur non-recurring')
          setLoading(false)
          return
        }
        input.date = formData.date
      }

      if (holiday) {
        await graphqlClient.updateHoliday(holiday.id, input)
      } else {
        await graphqlClient.createHoliday(input)
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error saving holiday:', error)
      alert(error.message || 'Gagal menyimpan hari libur')
    } finally {
      setLoading(false)
    }
  }

  const dayOfWeekOptions = [
    { value: '0', label: 'Minggu' },
    { value: '1', label: 'Senin' },
    { value: '2', label: 'Selasa' },
    { value: '3', label: 'Rabu' },
    { value: '4', label: 'Kamis' },
    { value: '5', label: 'Jumat' },
    { value: '6', label: 'Sabtu' },
  ]

  const handleModalCloseWrapper = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <Modal open={open} onOpenChange={handleModalCloseWrapper} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col" style={{ height: '100%', maxHeight: '90vh' }}>
        <ModalHeader onClose={onClose}>
          <div>
            <ModalTitle>
              {holiday ? 'Edit Hari Libur' : 'Tambah Hari Libur'}
            </ModalTitle>
            <ModalDescription>
              {holiday ? 'Edit informasi hari libur' : 'Tambahkan hari libur baru dengan pengaturan harga'}
            </ModalDescription>
          </div>
        </ModalHeader>

        <ModalContent className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Hari Libur *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Contoh: Hari Raya Idul Fitri, Hari Minggu"
              />
            </div>

            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi hari libur (opsional)"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isRecurring">Hari Libur Berulang (Recurring)</Label>
            </div>

            {formData.isRecurring ? (
              <>
                <div>
                  <Label htmlFor="dayOfWeek">Hari dalam Minggu</Label>
                  <select
                    id="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Pilih hari (opsional)</option>
                    {dayOfWeekOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Atau gunakan format Month-Day di bawah
                  </p>
                </div>

                <div>
                  <Label htmlFor="monthDay">Tanggal Berulang (MM-DD)</Label>
                  <Input
                    id="monthDay"
                    value={formData.monthDay}
                    onChange={(e) => setFormData({ ...formData, monthDay: e.target.value })}
                    placeholder="Contoh: 12-25 untuk Natal setiap tahun"
                    pattern="^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: MM-DD (contoh: 12-25 untuk 25 Desember setiap tahun)
                  </p>
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="date">Tanggal *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required={!formData.isRecurring}
                />
              </div>
            )}

            <div>
              <Label htmlFor="priceMultiplier">Multiplier Harga (Persentase) *</Label>
              <Input
                id="priceMultiplier"
                type="number"
                step="0.01"
                min="0.1"
                value={formData.priceMultiplier}
                onChange={(e) => setFormData({ ...formData, priceMultiplier: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Contoh: 1.5 = 50% lebih mahal, 2.0 = 100% lebih mahal (2x harga normal)
              </p>
            </div>

            <div>
              <Label htmlFor="priority">Prioritas</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Prioritas jika ada multiple holidays di tanggal yang sama (semakin tinggi angkanya, semakin tinggi prioritasnya)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive">Aktif</Label>
            </div>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="relative z-10"
          >
            Batal
          </Button>
          <Button type="submit" disabled={loading} className="relative z-10">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              holiday ? 'Simpan Perubahan' : 'Tambah Hari Libur'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
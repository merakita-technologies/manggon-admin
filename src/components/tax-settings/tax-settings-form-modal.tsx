'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { graphqlClient } from '@/lib/graphql'
import { useI18n } from '@/contexts/i18n-context'

interface TaxSettingsFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  taxSettings?: any
}

export function TaxSettingsFormModal({
  open,
  onClose,
  onSuccess,
  taxSettings,
}: TaxSettingsFormModalProps) {
  const { t } = useI18n()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [serviceFeePercentage, setServiceFeePercentage] = useState('10')
  const [vatRate, setVatRate] = useState('12')
  const [vatEnabled, setVatEnabled] = useState(true)
  const [notes, setNotes] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState('')

  useEffect(() => {
    if (taxSettings) {
      // Edit mode
      setServiceFeePercentage((taxSettings.serviceFeePercentage * 100).toString())
      setVatRate((taxSettings.vatRate * 100).toString())
      setVatEnabled(taxSettings.vatEnabled !== false) // Default true if not set
      setNotes(taxSettings.notes || '')
      setEffectiveFrom(
        taxSettings.effectiveFrom 
          ? new Date(taxSettings.effectiveFrom).toISOString().slice(0, 16)
          : ''
      )
    } else {
      // Create mode - set defaults
      setServiceFeePercentage('10')
      setVatRate('12')
      setVatEnabled(true)
      setNotes('')
      setEffectiveFrom('')
    }
  }, [taxSettings, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const serviceFeeDecimal = parseFloat(serviceFeePercentage) / 100
      const vatDecimal = parseFloat(vatRate) / 100

      if (isNaN(serviceFeeDecimal) || serviceFeeDecimal < 0 || serviceFeeDecimal > 1) {
        throw new Error('Service Fee harus antara 0% dan 100%')
      }

      if (isNaN(vatDecimal) || vatDecimal < 0 || vatDecimal > 1) {
        throw new Error('VAT Rate harus antara 0% dan 100%')
      }

      const input = {
        serviceFeePercentage: serviceFeeDecimal,
        vatRate: vatDecimal,
        vatEnabled: vatEnabled,
        notes: notes || undefined,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : undefined,
      }

      if (taxSettings) {
        // Update
        await graphqlClient.updateTaxSettings(taxSettings.id, input)
      } else {
        // Create
        await graphqlClient.createTaxSettings(input)
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {taxSettings ? 'Edit Pengaturan Pajak' : 'Tambah Pengaturan Pajak'}
          </DialogTitle>
          <DialogDescription>
            {taxSettings 
              ? 'Ubah konfigurasi service fee dan tarif PPN'
              : 'Buat pengaturan pajak baru. Pengaturan baru akan otomatis diaktifkan dan yang lama dinonaktifkan.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="serviceFeePercentage">
              Service Fee Percentage (%)
            </Label>
            <Input
              id="serviceFeePercentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={serviceFeePercentage}
              onChange={(e) => setServiceFeePercentage(e.target.value)}
              placeholder="10"
              required
            />
            <p className="text-xs text-muted-foreground">
              Persentase service fee dari rental price (contoh: 10 = 10%)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatRate">
              VAT Rate / PPN Rate (%)
            </Label>
            <Input
              id="vatRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              placeholder="12"
              required
            />
            <p className="text-xs text-muted-foreground">
              Tarif PPN Indonesia (contoh: 12 = 12%)
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label htmlFor="vatEnabled" className="text-base">
                Aktifkan PPN
              </Label>
              <p className="text-xs text-muted-foreground">
                Jika dinonaktifkan, PPN tidak akan dihitung meskipun tarif sudah diset
              </p>
            </div>
            <Switch
              id="vatEnabled"
              checked={vatEnabled}
              onCheckedChange={setVatEnabled}
              aria-label="Enable/disable VAT"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="effectiveFrom">
              Berlaku Dari (Opsional)
            </Label>
            <Input
              id="effectiveFrom"
              type="datetime-local"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Tanggal mulai berlaku pengaturan ini. Jika kosong, akan menggunakan tanggal saat ini.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Catatan (Opsional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Updated tax rates effective January 2025"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {taxSettings ? 'Simpan Perubahan' : 'Buat Pengaturan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, X } from 'lucide-react'
import { useI18n } from '@/contexts/i18n-context'

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (start: Date | null, end: Date | null) => void
  label?: string
}

export function DateRangePicker({ 
  startDate, 
  endDate, 
  onChange,
  label 
}: DateRangePickerProps) {
  const { t } = useI18n()
  const [showPicker, setShowPicker] = useState(false)

  const formatDate = (date: Date | null): string => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  const handleStartDateChange = (value: string) => {
    if (!value) {
      onChange(null, endDate)
      return
    }
    const date = new Date(value)
    onChange(date, endDate)
  }

  const handleEndDateChange = (value: string) => {
    if (!value) {
      onChange(startDate, null)
      return
    }
    const date = new Date(value)
    // Ensure end date is after start date
    if (startDate && date < startDate) {
      onChange(startDate, startDate)
      return
    }
    onChange(startDate, date)
  }

  const clearDates = () => {
    onChange(null, null)
  }

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm">{label}</Label>}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 min-w-0">
          <Input
            type="date"
            value={formatDate(startDate)}
            onChange={(e) => handleStartDateChange(e.target.value)}
            placeholder={t('common.startDate')}
            className="w-full text-sm"
          />
        </div>
        <span className="text-muted-foreground text-center hidden sm:inline">-</span>
        <div className="flex-1 min-w-0">
          <Input
            type="date"
            value={formatDate(endDate)}
            onChange={(e) => handleEndDateChange(e.target.value)}
            placeholder={t('common.endDate')}
            min={formatDate(startDate)}
            className="w-full text-sm"
          />
        </div>
        {(startDate || endDate) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearDates}
            className="h-9 w-9 p-0 shrink-0"
            aria-label="Clear dates"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

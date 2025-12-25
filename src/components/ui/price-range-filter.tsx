'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/contexts/i18n-context'

interface PriceRangeFilterProps {
  minPrice: number | null
  maxPrice: number | null
  onChange: (min: number | null, max: number | null) => void
  label?: string
  currency?: string
}

export function PriceRangeFilter({ 
  minPrice, 
  maxPrice, 
  onChange,
  label,
  currency = 'IDR'
}: PriceRangeFilterProps) {
  const { t } = useI18n()
  const [minInput, setMinInput] = useState<string>(minPrice?.toString() || '')
  const [maxInput, setMaxInput] = useState<string>(maxPrice?.toString() || '')

  const handleMinChange = (value: string) => {
    setMinInput(value)
    const numValue = value ? parseFloat(value) : null
    if (numValue !== null && isNaN(numValue)) return
    onChange(numValue, maxPrice)
  }

  const handleMaxChange = (value: string) => {
    setMaxInput(value)
    const numValue = value ? parseFloat(value) : null
    if (numValue !== null && isNaN(numValue)) return
    // Ensure max is greater than min
    if (numValue !== null && minPrice !== null && numValue < minPrice) {
      onChange(minPrice, minPrice)
      setMaxInput(minPrice.toString())
      return
    }
    onChange(minPrice, numValue)
  }

  const clearFilter = () => {
    setMinInput('')
    setMaxInput('')
    onChange(null, null)
  }

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm">{label}</Label>}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 min-w-0">
          <Input
            type="number"
            value={minInput}
            onChange={(e) => handleMinChange(e.target.value)}
            placeholder={t('filters.minPrice')}
            min="0"
            step="1000"
            className="w-full text-sm"
          />
        </div>
        <span className="text-muted-foreground text-center hidden sm:inline">-</span>
        <div className="flex-1 min-w-0">
          <Input
            type="number"
            value={maxInput}
            onChange={(e) => handleMaxChange(e.target.value)}
            placeholder={t('filters.maxPrice')}
            min={minPrice?.toString() || '0'}
            step="1000"
            className="w-full text-sm"
          />
        </div>
        {(minPrice !== null || maxPrice !== null) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="h-9 w-9 p-0 shrink-0"
            aria-label="Clear price filter"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

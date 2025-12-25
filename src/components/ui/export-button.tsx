'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react'
import { exportToCSV, exportToExcel, exportToPDF, formatDataForExport } from '@/lib/export-utils'
import { useI18n } from '@/contexts/i18n-context'

interface ExportButtonProps {
  data: any[]
  filename: string
  columns?: Array<{ header: string; dataKey: string; width?: number }>
  title?: string
  formats?: ('csv' | 'excel' | 'pdf')[]
}

export function ExportButton({ 
  data, 
  filename, 
  columns,
  title,
  formats = ['csv', 'excel', 'pdf'] 
}: ExportButtonProps) {
  const { t } = useI18n()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!data || data.length === 0) {
      alert(t('export.noData', { defaultValue: 'No data to export' }))
      return
    }

    setIsExporting(true)
    try {
      const formattedData = formatDataForExport(data)

      switch (format) {
        case 'csv':
          const csvHeaders = columns ? columns.map(c => c.dataKey) : undefined
          exportToCSV(formattedData, filename, csvHeaders)
          break
        case 'excel':
          exportToExcel(formattedData, filename)
          break
        case 'pdf':
          if (!columns) {
            // Auto-generate columns from data
            const autoColumns = Object.keys(data[0] || {}).map(key => ({
              header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
              dataKey: key,
            }))
            exportToPDF(formattedData, filename, autoColumns, title)
          } else {
            exportToPDF(formattedData, filename, columns, title)
          }
          break
      }
    } catch (error: any) {
      console.error('Export error:', error)
      alert(error.message || t('export.error', { defaultValue: 'Failed to export data' }))
    } finally {
      setIsExporting(false)
    }
  }

  if (formats.length === 1) {
    // Single format - show direct button
    return (
      <Button
        variant="outline"
        onClick={() => handleExport(formats[0])}
        disabled={isExporting || data.length === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        {isExporting 
          ? t('export.exporting', { defaultValue: 'Exporting...' })
          : t('export.export', { defaultValue: 'Export' })
        }
      </Button>
    )
  }

  // Multiple formats - show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting || data.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting 
            ? t('export.exporting', { defaultValue: 'Exporting...' })
            : t('export.export', { defaultValue: 'Export' })
          }
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.includes('csv') && (
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <FileText className="h-4 w-4 mr-2" />
            {t('export.exportToCSV', { defaultValue: 'Export to CSV' })}
          </DropdownMenuItem>
        )}
        {formats.includes('excel') && (
          <DropdownMenuItem onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t('export.exportToExcel', { defaultValue: 'Export to Excel' })}
          </DropdownMenuItem>
        )}
        {formats.includes('pdf') && (
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            <File className="h-4 w-4 mr-2" />
            {t('export.exportToPDF', { defaultValue: 'Export to PDF' })}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Export utilities for exporting data to various formats
 */

// @ts-ignore - xlsx doesn't have perfect TypeScript support
import * as XLSX from 'xlsx'
// @ts-ignore - jspdf-autotable doesn't have perfect TypeScript support
import jsPDF from 'jspdf'
// @ts-ignore
import 'jspdf-autotable'

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    csvHeaders.join(','), // Header row
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header] ?? ''
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export data to Excel format
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  
  // Write file
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/**
 * Export data to PDF format
 */
export function exportToPDF(
  data: any[], 
  filename: string, 
  columns: Array<{ header: string; dataKey: string; width?: number }>,
  title?: string
) {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  const doc = new jsPDF()
  
  // Add title if provided
  if (title) {
    doc.setFontSize(16)
    doc.text(title, 14, 15)
    doc.setFontSize(10)
  }

  // Prepare table data
  const tableData = data.map(row => 
    columns.map(col => {
      const value = row[col.dataKey] ?? ''
      return typeof value === 'object' ? JSON.stringify(value) : String(value)
    })
  )

  const tableHeaders = columns.map(col => col.header)

  // Add table
  ;(doc as any).autoTable({
    head: [tableHeaders],
    body: tableData,
    startY: title ? 25 : 15,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [27, 58, 87] }, // Dark blue
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  // Save PDF
  doc.save(`${filename}.pdf`)
}

/**
 * Format data for export (clean up values)
 */
export function formatDataForExport(data: any[]): any[] {
  return data.map(item => {
    const formatted: any = {}
    Object.keys(item).forEach(key => {
      const value = item[key]
      if (value === null || value === undefined) {
        formatted[key] = ''
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        formatted[key] = JSON.stringify(value)
      } else if (Array.isArray(value)) {
        formatted[key] = value.join(', ')
      } else if (value instanceof Date) {
        formatted[key] = value.toLocaleDateString()
      } else {
        formatted[key] = value
      }
    })
    return formatted
  })
}

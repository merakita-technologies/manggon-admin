/**
 * Utility functions for currency formatting
 */

/**
 * Format number as Indonesian Rupiah (IDR)
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "Rp 1.000.000" or "Rp 1.000.000,00")
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options?: {
    showDecimals?: boolean
    showSymbol?: boolean
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }
): string {
  if (amount === null || amount === undefined || amount === '') {
    return 'Rp 0'
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(numAmount)) {
    return 'Rp 0'
  }

  const {
    showDecimals = false,
    showSymbol = true,
    minimumFractionDigits = 0,
    maximumFractionDigits = showDecimals ? 2 : 0,
  } = options || {}

  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numAmount)

  // Remove currency symbol if not needed (Intl.NumberFormat already includes it)
  if (!showSymbol) {
    return formatted.replace('Rp', '').trim()
  }

  return formatted
}

/**
 * Format number as Indonesian Rupiah without currency symbol
 * @param amount - The amount to format
 * @returns Formatted number string (e.g., "1.000.000")
 */
export function formatNumber(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '0'
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(numAmount)) {
    return '0'
  }

  return new Intl.NumberFormat('id-ID').format(numAmount)
}

/**
 * Format price per night with IDR currency
 * @param price - The price to format
 * @returns Formatted price string (e.g., "Rp 500.000/malam")
 */
export function formatPricePerNight(price: number | string | null | undefined): string {
  const formatted = formatCurrency(price, { showDecimals: false })
  return `${formatted}/malam`
}

/**
 * Format price per hour with IDR currency
 * @param price - The price to format
 * @returns Formatted price string (e.g., "Rp 50.000/jam")
 */
export function formatPricePerHour(price: number | string | null | undefined): string {
  const formatted = formatCurrency(price, { showDecimals: false })
  return `${formatted}/jam`
}


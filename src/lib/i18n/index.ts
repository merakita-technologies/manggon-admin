import idTranslations from './locales/id.json'
import enTranslations from './locales/en.json'

export type Locale = 'id' | 'en'

export const locales: Locale[] = ['id', 'en']

export const defaultLocale: Locale = 'id'

export const translations = {
  id: idTranslations,
  en: enTranslations,
} as const

export type TranslationKey = string

/**
 * Get nested translation value by key path (e.g., "common.save" or "dashboard.title")
 */
export function getTranslation(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.')
  let value: any = translations[locale]

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k as keyof typeof value]
    } else {
      // Fallback to default locale if key not found
      value = translations[defaultLocale]
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey as keyof typeof value]
        } else {
          return key // Return key if translation not found
        }
      }
      break
    }
  }

  if (typeof value !== 'string') {
    return key
  }

  // Replace parameters in translation string
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match
    })
  }

  return value
}

/**
 * Check if a translation key exists
 */
export function hasTranslation(locale: Locale, key: TranslationKey): boolean {
  const keys = key.split('.')
  let value: any = translations[locale]

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k as keyof typeof value]
    } else {
      return false
    }
  }

  return typeof value === 'string'
}

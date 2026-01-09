'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type DensityMode = 'comfortable' | 'compact'

interface DensityContextType {
  densityMode: DensityMode
  setDensityMode: (mode: DensityMode) => void
  toggleDensityMode: () => void
}

const DensityContext = createContext<DensityContextType | undefined>(undefined)

export function DensityProvider({ children }: { children: ReactNode }) {
  const [densityMode, setDensityModeState] = useState<DensityMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('density-mode')
      return (saved === 'comfortable' || saved === 'compact') ? saved : 'comfortable'
    }
    return 'comfortable'
  })

  const setDensityMode = (mode: DensityMode) => {
    setDensityModeState(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('density-mode', mode)
      // Apply CSS class to body for global density styling
      document.body.classList.remove('density-comfortable', 'density-compact')
      document.body.classList.add(`density-${mode}`)
    }
  }

  const toggleDensityMode = () => {
    setDensityMode(densityMode === 'comfortable' ? 'compact' : 'comfortable')
  }

  useEffect(() => {
    // Apply initial density mode
    if (typeof window !== 'undefined') {
      document.body.classList.add(`density-${densityMode}`)
    }
  }, [densityMode])

  return (
    <DensityContext.Provider value={{ densityMode, setDensityMode, toggleDensityMode }}>
      {children}
    </DensityContext.Provider>
  )
}

export function useDensityMode() {
  const context = useContext(DensityContext)
  if (context === undefined) {
    throw new Error('useDensityMode must be used within a DensityProvider')
  }
  return context
}

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Safe check for browser environment
    const checkEnvironment = () => {
      if (typeof window === 'undefined') return false
      if (typeof navigator === 'undefined') return false
      return true
    }

    if (!checkEnvironment()) return

    // Check if app is already installed
    const checkInstalledStatus = () => {
      try {
        // Method 1: Check display mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
          setIsInstalled(true)
          return true
        }

        // Method 2: Check for iOS standalone mode
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
        const isStandaloneIOS = ('standalone' in navigator) && (navigator as any).standalone
        
        if (isIOSDevice && isStandaloneIOS) {
          setIsInstalled(true)
          return true
        }

        // Method 3: Check if running as TWA (Trusted Web Activity)
        if (document.referrer.includes('android-app://')) {
          setIsInstalled(true)
          return true
        }

        return false
      } catch (error) {
        console.error('Error checking installed status:', error)
        return false
      }
    }

    // Set platform info
    const checkPlatform = () => {
      try {
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
        setIsIOS(isIOSDevice)
        
        const standaloneMode = ('standalone' in navigator) && (navigator as any).standalone
        setIsInStandaloneMode(standaloneMode)
      } catch (error) {
        console.error('Error checking platform:', error)
      }
    }

    checkPlatform()
    
    if (checkInstalledStatus()) {
      return
    }

    // Check if previously dismissed
    const checkDismissedStatus = () => {
      try {
        const dismissed = localStorage.getItem('pwa-install-dismissed')
        if (dismissed) {
          const dismissedTime = parseInt(dismissed, 10)
          const oneDay = 24 * 60 * 60 * 1000
          if (Date.now() - dismissedTime < oneDay) {
            return true // Don't show if dismissed recently
          }
        }
        return false
      } catch (error) {
        console.error('Error checking dismissed status:', error)
        return false
      }
    }

    // Handle beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsSupported(true)
      
      if (!checkDismissedStatus()) {
        setShowPrompt(true)
      }
      console.log('PWA install prompt available')
    }

    // Handle app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setIsInstalled(true)
      setShowPrompt(false)
    }

    // Verify manifest
    const checkManifest = async () => {
      try {
        const response = await fetch('/manifest.json')
        if (response.ok) {
          console.log('Manifest.json loaded successfully')
        }
      } catch (error) {
        console.warn('Manifest.json not found:', error)
      }
    }

    // Setup event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Initialize checks
    checkManifest()

    // For iOS, show manual install instructions after a delay
    if (isIOS && !isInStandaloneMode && !checkDismissedStatus()) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 5000) // Increased delay to 5 seconds for better UX
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      // Show the install prompt
      deferredPrompt.prompt()

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice

      console.log(`User ${outcome} the install prompt`)
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
        // Don't set showPrompt to false immediately, let appinstalled event handle it
      }

    } catch (error) {
      console.error('Error during installation:', error)
    } finally {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Store dismissal in localStorage to avoid showing again for a while
    try {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    } catch (error) {
      console.warn('Could not access localStorage:', error)
    }
  }

  const handleManualInstall = () => {
    // For iOS, we can't programmatically trigger install
    // Just dismiss the prompt after showing instructions
    handleDismiss()
  }

  // Don't show if already installed or not showing prompt
  if (isInstalled || !showPrompt) {
    return null
  }

  // For iOS, show manual instructions
  if (isIOS && !isInStandaloneMode) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-card border border-border rounded-lg shadow-lg p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1 text-foreground">
                Install Manggon Admin
              </h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Untuk pengalaman terbaik, tambahkan ke home screen:
              </p>
              <ol className="text-xs text-muted-foreground mb-3 space-y-1">
                <li>1. Tap <span className="font-semibold text-foreground">Share</span> button (⎙)</li>
                <li>2. Pilih <span className="font-semibold text-foreground">"Add to Home Screen"</span></li>
                <li>3. Tap <span className="font-semibold text-foreground">"Add"</span></li>
              </ol>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleManualInstall}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Mengerti
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismiss}
                  className="px-3"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // For Android/Chrome with beforeinstallprompt support
  if (isSupported && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-card border border-border rounded-lg shadow-lg p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1 text-foreground">
                Install Manggon Admin
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Install aplikasi untuk akses lebih cepat dan pengalaman offline
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismiss}
                  className="px-3"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
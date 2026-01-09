'use client'

import { AuthGuard } from '@/components/auth/auth-guard'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { ServiceWorkerRegister } from '@/components/service-worker-register'
import { NavigationLoading } from '@/components/ui/navigation-loading'

interface ClientLayoutProps {
  children: React.ReactNode
  requiredRole?: 'owner' | 'admin' | 'user'
}

export function ClientLayout({ children, requiredRole = 'owner' }: ClientLayoutProps) {
  return (
    <AuthGuard requiredRole={requiredRole}>
      <NavigationLoading />
      <div className="min-h-screen bg-background">
        {children}
      </div>
      <PWAInstallPrompt />
      <ServiceWorkerRegister />
    </AuthGuard>
  )
}
















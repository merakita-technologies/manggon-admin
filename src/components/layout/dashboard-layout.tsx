'use client'

import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div className={`
        flex-1 min-w-0 transition-all duration-300
        ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}
      `}>
        <Topbar 
          isSidebarCollapsed={isSidebarCollapsed} 
          onMenuClick={() => setIsMobileOpen(true)}
        />
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
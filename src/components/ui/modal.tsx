'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onOpenChange, children, className }: ModalProps) {
  // Prevent body scroll when modal is open (but allow scroll in modal)
  useEffect(() => {
    if (open) {
      // Save current scroll position
      const scrollY = window.scrollY
      const body = document.body
      const html = document.documentElement
      
      // Prevent body scroll but allow modal scroll
      body.style.position = 'fixed'
      body.style.top = `-${scrollY}px`
      body.style.width = '100%'
      body.style.overflow = 'hidden'
      
      return () => {
        // Restore scroll position
        body.style.position = ''
        body.style.top = ''
        body.style.width = ''
        body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [open])

  if (!open) return null

  return (
    <div 
      className="fixed inset-0 z-50"
      style={{ 
        overflow: 'hidden'
      }}
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        onTouchStart={(e) => {
          // Only close if touching the backdrop directly
          if (e.target === e.currentTarget) {
            onOpenChange(false)
          }
        }}
        style={{ pointerEvents: 'auto' }}
      />
      <div className="flex items-center justify-center h-full p-2 sm:p-4">
        <div
          className={cn(
            'relative z-50 w-full max-w-2xl bg-background rounded-lg shadow-lg border flex flex-col',
            className
          )}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{ 
            pointerEvents: 'auto', 
            maxHeight: '95vh',
            height: 'auto',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

interface ModalHeaderProps {
  children: React.ReactNode
  onClose?: () => void
}

export function ModalHeader({ children, onClose }: ModalHeaderProps) {
  return (
    <div 
      className="flex items-center justify-between p-4 md:p-6 border-b bg-background relative z-10 flex-shrink-0"
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 ml-2 relative z-20"
          type="button"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export function ModalContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={cn('p-4 md:p-6 overflow-y-auto flex-1', className)}
      style={{ 
        minHeight: 0,
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        overscrollBehavior: 'contain',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent'
      }}
    >
      {children}
    </div>
  )
}

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={cn('flex items-center justify-end gap-2 p-4 md:p-6 border-t bg-background relative z-10', className)}
      style={{ 
        touchAction: 'manipulation',
        flexShrink: 0
      }}
    >
      {children}
    </div>
  )
}

export function ModalTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-xl font-semibold', className)}>
      {children}
    </h2>
  )
}

export function ModalDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-sm text-muted-foreground mt-1', className)}>
      {children}
    </p>
  )
}


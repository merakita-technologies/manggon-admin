'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalContent, ModalFooter, ModalTitle, ModalDescription } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { graphqlClient } from '@/lib/graphql'
import { Loader2, AlertCircle } from 'lucide-react'
import { useI18n } from '@/contexts/i18n-context'

interface NotificationFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notification?: any
  onSuccess?: () => void
}

export function NotificationFormModal({ open, onOpenChange, notification, onSuccess }: NotificationFormModalProps) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    userId: '',
    title: '',
    message: '',
    type: 'info',
    link: '',
  })

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  useEffect(() => {
    if (notification) {
      setFormData({
        userId: notification.user?.id || '',
        title: notification.title || '',
        message: notification.message || '',
        type: notification.type || 'info',
        link: notification.link || '',
      })
    } else {
      setFormData({
        userId: '',
        title: '',
        message: '',
        type: 'info',
        link: '',
      })
    }
    setError(null)
  }, [notification, open])

  const fetchUsers = async () => {
    try {
      // Get users from properties (owners)
      const properties = await graphqlClient.getProperties()
      const userMap = new Map()
      properties.forEach((property: any) => {
        if (property.owner && !userMap.has(property.owner.id)) {
          userMap.set(property.owner.id, property.owner)
        }
      })
      setUsers(Array.from(userMap.values()))
    } catch (err: any) {
      console.error('Error fetching users:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!formData.userId) {
        setError(t('notifications.userRequired'))
        setIsLoading(false)
        return
      }

      const input = {
        userId: formData.userId,
        title: formData.title,
        message: formData.message,
        type: formData.type,
        link: formData.link || undefined,
      }

      let result
      if (notification) {
        result = await graphqlClient.updateNotification(notification.id, input)
      } else {
        result = await graphqlClient.createNotification(input)
      }

      if (result.success) {
        onSuccess?.()
        onOpenChange(false)
      } else {
        setError(result.message || t('notifications.saveNotificationError'))
      }
    } catch (err: any) {
      console.error('Error saving notification:', err)
      setError(err.message || t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-2xl">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={() => onOpenChange(false)}>
          <div>
            <ModalTitle>{notification ? t('notifications.editNotificationTitle') : t('notifications.addNotificationTitle')}</ModalTitle>
            <ModalDescription>
              {notification ? t('notifications.editNotificationDescription') : t('notifications.addNotificationDescription')}
            </ModalDescription>
          </div>
        </ModalHeader>

        <ModalContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">{t('notifications.selectUser')} *</Label>
              <select
                id="userId"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                required
                disabled={!!notification}
              >
                <option value="">{t('notifications.selectUser')}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">{t('notifications.notificationType')} *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                required
              >
                <option value="info">{t('common.info')}</option>
                <option value="warning">{t('common.warning')}</option>
                <option value="error">{t('common.error')}</option>
                <option value="success">{t('common.success')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">{t('notifications.titleLabel')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('notifications.titleLabel')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t('notifications.messageLabel')} *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                placeholder={t('notifications.messageLabel')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">{t('notifications.linkLabel')}</Label>
              <Input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder={t('notifications.linkPlaceholder')}
              />
            </div>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="relative z-10"
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="relative z-10"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              notification ? t('notifications.updateNotification') : t('notifications.addNotificationButton')
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}


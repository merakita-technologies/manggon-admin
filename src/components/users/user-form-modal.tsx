'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalContent, ModalFooter, ModalTitle, ModalDescription } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { graphqlClient } from '@/lib/graphql'
import { BACKEND_BASE_URL } from '@/lib/api-config'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useI18n } from '@/contexts/i18n-context'

interface UserFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: any
  onSuccess?: () => void
}

export function UserFormModal({ open, onOpenChange, user, onSuccess }: UserFormModalProps) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'user' as 'admin' | 'owner' | 'user',
    isActive: true,
    emailVerified: false,
    loyaltyPoints: 0,
  })
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        password: '', // Don't pre-fill password
        firstName: user.firstName || user.fullName?.split(' ')[0] || '',
        lastName: user.lastName || user.fullName?.split(' ').slice(1).join(' ') || '',
        phoneNumber: user.phoneNumber || user.phone_number || '',
        role: user.role || 'user',
        isActive: user.isActive !== undefined ? user.isActive : true,
        emailVerified: user.emailVerified !== undefined ? user.emailVerified : false,
        loyaltyPoints: user.loyaltyPoints || user.loyalty_points || 0,
      })
    } else {
      // Reset form for new user
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: 'user',
        isActive: true,
        emailVerified: false,
        loyaltyPoints: 0,
      })
    }
    setPasswordConfirmation('')
    setError(null)
  }, [user, open])

  const validateForm = (): string | null => {
    if (!formData.email.trim()) {
      return 'Email is required'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Invalid email format'
    }
    if (!user && !formData.password) {
      return 'Password is required for new users'
    }
    if (formData.password && formData.password.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (formData.password && formData.password !== passwordConfirmation) {
      return 'Passwords do not match'
    }
    if (!formData.firstName.trim()) {
      return 'First name is required'
    }
    if (!formData.lastName.trim()) {
      return 'Last name is required'
    }
    if (formData.loyaltyPoints < 0) {
      return 'Loyalty points cannot be negative'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)

    try {
      if (user) {
        // Update user - use REST API since GraphQL mutation might not exist
        const updateData: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber || undefined,
          role: formData.role,
          isActive: formData.isActive,
          emailVerified: formData.emailVerified,
          loyaltyPoints: formData.loyaltyPoints,
        }

        // Only include password if provided
        if (formData.password) {
          updateData.password = formData.password
        }

        // Try GraphQL first, fallback to REST
        try {
          const result = await graphqlClient.updateUser(user.id, updateData)
          if (result.success) {
            onSuccess?.()
            onOpenChange(false)
          } else {
            setError(result.message || 'Failed to update user')
          }
        } catch (graphqlError: any) {
          // If GraphQL fails, try REST API
          console.log('GraphQL update failed, trying REST API:', graphqlError)
          const response = await fetch(`${BACKEND_BASE_URL}/users/${user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `JWT ${localStorage.getItem('auth_token')}`,
            },
            body: JSON.stringify(updateData),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to update user')
          }

          onSuccess?.()
          onOpenChange(false)
        }
      } else {
        // Create user
        const result = await graphqlClient.createUser({
          email: formData.email,
          password: formData.password,
          fullName: `${formData.firstName} ${formData.lastName}`,
          phoneNumber: formData.phoneNumber || undefined,
          role: formData.role,
        })

        if (result.success) {
          // Update additional fields via REST API if needed
          if (formData.loyaltyPoints > 0 || !formData.isActive || formData.emailVerified) {
            try {
              await fetch(`${BACKEND_BASE_URL}/users/${result.user.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `JWT ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify({
                  loyaltyPoints: formData.loyaltyPoints,
                  isActive: formData.isActive,
                  emailVerified: formData.emailVerified,
                }),
              })
            } catch (e) {
              console.error('Error updating additional fields:', e)
            }
          }

          onSuccess?.()
          onOpenChange(false)
        } else {
          setError(result.message || 'Failed to create user')
        }
      }
    } catch (err: any) {
      console.error('Error saving user:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <ModalHeader onClose={() => onOpenChange(false)}>
          <div>
            <ModalTitle>{user ? t('users.editUser') : t('users.addUser')}</ModalTitle>
            <ModalDescription>
              {user ? t('users.editUserDescription', { defaultValue: 'Update user information' }) : t('users.addUserDescription', { defaultValue: 'Create a new user account' })}
            </ModalDescription>
          </div>
        </ModalHeader>

        <ModalContent className="flex-1 overflow-y-auto min-h-0">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t('users.basicInformation', { defaultValue: 'Basic Information' })}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('users.firstName', { defaultValue: 'First Name' })} *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    placeholder="John"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('users.lastName', { defaultValue: 'Last Name' })} *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('users.email', { defaultValue: 'Email' })} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!user} // Email cannot be changed for existing users
                  placeholder="user@example.com"
                />
                {user && (
                  <p className="text-xs text-muted-foreground">
                    {t('users.emailCannotBeChanged', { defaultValue: 'Email cannot be changed' })}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">{t('users.phoneNumber', { defaultValue: 'Phone Number' })}</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+6281234567890"
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">{t('users.password', { defaultValue: 'Password' })}</h3>
              
              {!user && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t('users.password', { defaultValue: 'Password' })} *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      placeholder="Minimum 8 characters"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('users.passwordRequirements', { defaultValue: 'Password must be at least 8 characters' })}
                  </p>
                </div>
              )}

              {user && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('users.newPassword', { defaultValue: 'New Password' })}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={t('users.leaveBlankToKeep', { defaultValue: 'Leave blank to keep current password' })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('users.passwordOptional', { defaultValue: 'Leave blank to keep current password' })}
                    </p>
                  </div>

                  {formData.password && (
                    <div className="space-y-2">
                      <Label htmlFor="passwordConfirmation">{t('users.confirmPassword', { defaultValue: 'Confirm Password' })}</Label>
                      <Input
                        id="passwordConfirmation"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        placeholder={t('users.confirmPassword', { defaultValue: 'Confirm password' })}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Account Settings */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">{t('users.accountSettings', { defaultValue: 'Account Settings' })}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">{t('users.role', { defaultValue: 'Role' })} *</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'owner' | 'user' })}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    required
                  >
                    <option value="user">{t('users.user', { defaultValue: 'User' })}</option>
                    <option value="owner">{t('users.owner', { defaultValue: 'Owner' })}</option>
                    <option value="admin">{t('users.admin', { defaultValue: 'Admin' })}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loyaltyPoints">{t('users.loyaltyPoints', { defaultValue: 'Loyalty Points' })}</Label>
                  <Input
                    id="loyaltyPoints"
                    type="number"
                    min="0"
                    value={formData.loyaltyPoints.toString()}
                    onChange={(e) => setFormData({ ...formData, loyaltyPoints: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">{t('users.isActive', { defaultValue: 'Account is active' })}</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.emailVerified}
                    onChange={(e) => setFormData({ ...formData, emailVerified: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">{t('users.emailVerified', { defaultValue: 'Email is verified' })}</span>
                </label>
              </div>
            </div>
          </div>
        </ModalContent>

        <ModalFooter className="border-t bg-background shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              user ? t('users.updateUser', { defaultValue: 'Update User' }) : t('users.createUser', { defaultValue: 'Create User' })
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

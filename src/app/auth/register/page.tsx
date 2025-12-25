'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, Eye, EyeOff, User, Phone, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { graphqlClient } from '@/lib/graphql'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const [resendCount, setResendCount] = useState(0)

  // Timer untuk resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok')
      return
    }

    if (formData.password.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }

    setIsLoading(true)
    try {
      const result = await graphqlClient.createUser({
        email: formData.email,
        password: formData.password,
        fullName: formData.name.trim(),
        phoneNumber: formData.phone,
        role: 'owner', // Default role untuk pemilik yang register dari admin app
      })
      
      if (result.success) {
        setIsRegistered(true)
        setRegisteredEmail(formData.email)
        // Set initial cooldown: 30 detik untuk resend pertama
        setResendCooldown(30)
        setResendCount(0)
      } else {
        setError(result.message || 'Registrasi gagal')
      }
    } catch (error: any) {
      setError(error.message || 'Registrasi gagal')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return
    
    setIsResending(true)
    setError(null)
    
    try {
      const result = await graphqlClient.resendVerificationEmail(registeredEmail)
      
      if (result.success) {
        const newCount = resendCount + 1
        setResendCount(newCount)
        // Set cooldown: 30 detik untuk pertama kali, 1 menit (60 detik) untuk berikutnya
        setResendCooldown(newCount === 0 ? 30 : 60)
      } else {
        setError(result.message || 'Gagal mengirim email verifikasi')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengirim email verifikasi')
    } finally {
      setIsResending(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    return `${secs}s`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // Show success state after registration
  if (isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <Image
                src="/logo1.png"
                alt="Manggon Logo"
                width={64}
                height={64}
                className="w-16 h-16 object-contain"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Manggon Admin</h1>
          </div>

          <Card className="shadow-floating border-0">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-semibold text-center">Registrasi Berhasil!</CardTitle>
              <CardDescription className="text-center">
                Akun Anda telah berhasil dibuat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Verification Notification */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Email Verifikasi Telah Dikirim
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Kami telah mengirimkan link verifikasi ke{' '}
                      <span className="font-semibold">{registeredEmail}</span>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Silakan periksa inbox Anda (dan folder spam) untuk verifikasi akun.
                    </p>
                  </div>
                </div>
              </div>

              {/* Resend Button */}
              <div className="space-y-2">
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  onClick={handleResendVerification}
                  disabled={resendCooldown > 0 || isResending}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Kirim Ulang ({formatTime(resendCooldown)})
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Kirim Ulang Email Verifikasi
                    </>
                  )}
                </Button>
                {resendCount > 0 && (
                  <p className="text-xs text-center text-muted-foreground">
                    Email telah dikirim {resendCount} kali
                  </p>
                )}
              </div>

              <div className="pt-4 border-t">
                <Button asChild className="w-full">
                  <Link href="/auth/login">Kembali ke Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/logo1.png"
              alt="Manggon Logo"
              width={64}
              height={64}
              className="w-16 h-16 object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Manggon Admin</h1>
          <p className="text-muted-foreground">Buat akun baru</p>
        </div>

        <Card className="shadow-floating border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold">Daftar Akun</CardTitle>
            <CardDescription>
              Isi informasi di bawah untuk membuat akun baru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Nama lengkap"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="081234567890"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 8 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-11"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Ulangi password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary mt-0.5"
                  required
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                  Saya menyetujui{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Syarat & Ketentuan
                  </Link>{' '}
                  dan{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Kebijakan Privasi
                  </Link>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Mendaftar...' : 'Daftar'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Sudah punya akun?{' '}
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline font-semibold"
                >
                  Masuk di sini
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2024 Manggon. All rights reserved.
        </p>
      </div>
    </div>
  )
}


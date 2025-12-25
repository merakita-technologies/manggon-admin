'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const [resendCount, setResendCount] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)

  // Timer untuk resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Debug: Log ketika komponen mount
  useEffect(() => {
    console.log('LoginPage mounted')
    return () => {
      console.log('LoginPage unmounted')
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    return `${secs}s`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Form submitted!', { email, password: password ? '***' : 'empty' })
    
    // Validasi manual
    if (!email || !password) {
      setError('Email dan password harus diisi')
      setIsLoading(false)
      return
    }
    
    setError(null)
    setIsLoading(true)
    
    try {
      const { graphqlClient } = await import('@/lib/graphql')
      
      console.log('Attempting login for:', email)
      const result = await graphqlClient.login(email, password)
      
      console.log('Login result:', result)
      
      if (result.success && result.token) {
        // Check if user is owner or admin
        const userRole = result.user?.role
        const emailVerified = result.user?.emailVerified
        
        console.log('User role:', userRole)
        console.log('Email verified:', emailVerified)
        
        // Check email verification first
        if (!emailVerified) {
          setNeedsVerification(true)
          setUserEmail(result.user?.email || email)
          setResendCooldown(30) // Set initial cooldown
          setResendCount(0)
          setError(null)
          setIsLoading(false)
          return
        }
        
        if (userRole === 'owner' || userRole === 'admin') {
          // Verify token is saved
          const savedToken = localStorage.getItem('auth_token')
          const savedUser = localStorage.getItem('user_info')
          
          console.log('Token saved:', !!savedToken)
          console.log('User info saved:', !!savedUser)
          
          if (savedToken && savedUser) {
            // Use Next.js router for better navigation
            router.push('/')
            router.refresh() // Force refresh to update auth state
          } else {
            setError('Gagal menyimpan informasi login. Silakan coba lagi.')
            setIsLoading(false)
          }
        } else {
          // Logout if not owner/admin
          graphqlClient.logout()
          setError('Akses ditolak. Hanya owner dan admin yang dapat mengakses admin panel.')
          setIsLoading(false)
        }
      } else {
        setError(result.message || 'Login gagal. Periksa email dan password Anda.')
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Terjadi kesalahan saat login. Pastikan backend berjalan.')
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (resendCooldown > 0) {
      console.log('Resend masih dalam cooldown:', resendCooldown)
      return
    }
    
    const emailToResend = userEmail || email
    if (!emailToResend) {
      setError('Email tidak ditemukan. Silakan coba login lagi.')
      return
    }
    
    console.log('Memulai resend verification email untuk:', emailToResend)
    setIsResending(true)
    setError(null)
    setResendSuccess(false)
    
    try {
      const { graphqlClient } = await import('@/lib/graphql')
      console.log('GraphQL client loaded, calling resendVerificationEmail...')
      
      const result = await graphqlClient.resendVerificationEmail(emailToResend)
      console.log('Resend verification result:', result)
      
      if (result.success) {
        setResendSuccess(true)
        const newCount = resendCount + 1
        setResendCount(newCount)
        // Set cooldown: 30 detik untuk pertama kali, 1 menit (60 detik) untuk berikutnya
        setResendCooldown(newCount === 0 ? 30 : 60)
        
        console.log('Email verifikasi berhasil dikirim. Cooldown:', newCount === 0 ? 30 : 60)
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          setResendSuccess(false)
        }, 5000)
      } else {
        const errorMsg = result.message || 'Gagal mengirim email verifikasi'
        console.error('Resend verification failed:', errorMsg)
        setError(errorMsg)
      }
    } catch (err: any) {
      console.error('Resend verification error:', err)
      const errorMessage = err.message || 'Terjadi kesalahan saat mengirim email verifikasi'
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        stack: err.stack
      })
      setError(errorMessage)
    } finally {
      setIsResending(false)
    }
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
          <p className="text-muted-foreground">Masuk ke akun Anda</p>
        </div>

        <Card className="shadow-floating border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold">Selamat Datang</CardTitle>
            <CardDescription>
              Masukkan kredensial Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form 
              onSubmit={handleSubmit} 
              className="space-y-4"
              noValidate
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading && !needsVerification) {
                  console.log('Enter key pressed, submitting form...')
                }
              }}
            >
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    autoComplete="email"
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
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    autoComplete="current-password"
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

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Ingat saya
                  </label>
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Lupa password?
                </Link>
              </div>

              {error && !needsVerification && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Verification Notification */}
              {needsVerification && (
                <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg space-y-4 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-full">
                      <AlertCircle className="h-5 w-5 text-white flex-shrink-0" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-base font-bold text-blue-900 dark:text-blue-100">
                        Email Belum Terverifikasi
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Email <span className="font-semibold text-blue-900 dark:text-blue-100">{userEmail || email}</span> belum terverifikasi. 
                        Silakan cek inbox Anda (termasuk folder spam) atau klik tombol di bawah untuk kirim ulang email verifikasi.
                      </p>
                    </div>
                  </div>

                  {/* Success Message */}
                  {resendSuccess && (
                    <div className="flex items-center gap-2 p-3 text-sm text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-950/30 border-2 border-green-300 dark:border-green-700 rounded-md">
                      <CheckCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">Email verifikasi telah dikirim! Silakan cek inbox Anda.</span>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{error}</p>
                        {error.includes('Failed to send') || error.includes('gagal mengirim') ? (
                          <p className="text-xs mt-1 text-destructive/80">
                            Pastikan backend sudah dikonfigurasi dengan MAIL_PASSWORD di file .env. 
                            Cek console browser (F12) untuk detail error.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Resend Button - Made More Prominent */}
                  <div className="space-y-2">
                    <Button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendCooldown > 0 || isResending}
                      variant="default"
                      size="lg"
                      className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-md hover:shadow-lg transition-all"
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                          Mengirim Email Verifikasi...
                        </>
                      ) : resendCooldown > 0 ? (
                        <>
                          <Mail className="h-5 w-5 mr-2" />
                          Tunggu {formatTime(resendCooldown)} untuk Kirim Ulang
                        </>
                      ) : (
                        <>
                          <Mail className="h-5 w-5 mr-2" />
                          Kirim Ulang Email Verifikasi
                        </>
                      )}
                    </Button>
                    {resendCount > 0 && (
                      <p className="text-xs text-center text-blue-700 dark:text-blue-300 font-medium">
                        Email telah dikirim {resendCount} {resendCount === 1 ? 'kali' : 'kali'}
                      </p>
                    )}
                    <p className="text-xs text-center text-blue-600 dark:text-blue-400 mt-2">
                      💡 <strong>Tips:</strong> Jika email tidak masuk, pastikan backend sudah dikonfigurasi dengan benar. 
                      Cek console browser (F12) untuk detail error.
                    </p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={isLoading || needsVerification}
                onClick={(e) => {
                  console.log('Button clicked!', { 
                    email: !!email, 
                    password: !!password, 
                    isLoading, 
                    needsVerification 
                  })
                  // Jangan preventDefault di sini, biarkan form handle submission
                  if (!email || !password) {
                    e.preventDefault()
                    e.stopPropagation()
                    setError('Email dan password harus diisi')
                    setIsLoading(false)
                    return false
                  }
                }}
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Belum punya akun?{' '}
                <Link
                  href="/auth/register"
                  className="text-primary hover:underline font-semibold transition-colors"
                >
                  Daftar sekarang
                </Link>
              </p>
              <div className="pt-3 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-3">
                  Email verifikasi tidak masuk?
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link
                    href="/auth/resend-verification"
                    className="inline-flex items-center justify-center"
                    onClick={() => {
                      console.log('Navigating to resend verification page')
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Kirim Ulang Email Verifikasi
                  </Link>
                </Button>
              </div>
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


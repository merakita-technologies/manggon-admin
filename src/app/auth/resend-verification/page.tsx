'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { graphqlClient } from '@/lib/graphql'

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
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
    setError(null)
    setIsLoading(true)
    
    try {
      const result = await graphqlClient.resendVerificationEmail(email)
      
      if (result.success) {
        setIsSubmitted(true)
        setResendCount(0)
        // Set initial cooldown: 30 detik untuk resend pertama
        setResendCooldown(30)
      } else {
        setError(result.message || 'Gagal mengirim email verifikasi')
      }
    } catch (err: any) {
      console.error('Resend verification error:', err)
      setError(err.message || 'Terjadi kesalahan. Pastikan backend berjalan dan email sudah terdaftar.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendAgain = async () => {
    if (resendCooldown > 0) return
    
    setError(null)
    setIsLoading(true)
    
    try {
      const result = await graphqlClient.resendVerificationEmail(email)
      
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
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
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
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Email Terkirim!</h2>
                  <p className="text-muted-foreground">
                    Kami telah mengirimkan link verifikasi ke email{' '}
                    <span className="font-semibold text-foreground">{email}</span>
                  </p>
                  <p className="text-sm text-muted-foreground pt-2">
                    Silakan periksa inbox Anda (dan folder spam) dan klik link verifikasi.
                  </p>
                </div>

                {/* Resend Button */}
                <div className="pt-4 space-y-2">
                  {error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    onClick={handleResendAgain}
                    disabled={resendCooldown > 0 || isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {isLoading ? (
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
                      Email telah dikirim {resendCount + 1} kali
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <Button asChild className="w-full h-11">
                    <Link href="/auth/login">Kembali ke Login</Link>
                  </Button>
                </div>
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
          <p className="text-muted-foreground">Kirim ulang email verifikasi</p>
        </div>

        <Card className="shadow-floating border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold">Resend Verification Email</CardTitle>
            <CardDescription>
              Masukkan email Anda untuk mengirim ulang link verifikasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    required
                  />
                </div>
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
                {isLoading ? 'Mengirim...' : 'Kirim Email Verifikasi'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-sm text-primary hover:underline font-medium"
              >
                Kembali ke Login
              </Link>
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


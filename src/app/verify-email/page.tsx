'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react'
import { graphqlClient } from '@/lib/graphql'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setStatus('error')
        setError('Token verifikasi tidak ditemukan. Pastikan link verifikasi lengkap.')
        return
      }

      try {
        console.log('Verifying email with token:', token.substring(0, 20) + '...')
        const result = await graphqlClient.verifyEmail(token)
        
        console.log('Verify email result:', result)
        
        if (result.success) {
          setStatus('success')
          setMessage(result.message || 'Email berhasil diverifikasi!')
          
          // Redirect to login after 3 seconds if user is not owner/admin
          const userRole = result.user?.role
          if (userRole === 'owner' || userRole === 'admin') {
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              router.push('/')
            }, 2000)
          } else {
            // Redirect to login for regular users
            setTimeout(() => {
              router.push('/auth/login')
            }, 3000)
          }
        } else {
          setStatus('error')
          setError(result.message || 'Gagal memverifikasi email')
        }
      } catch (err: any) {
        console.error('Verify email error:', err)
        setStatus('error')
        const errorMessage = err.message || 'Terjadi kesalahan saat memverifikasi email'
        setError(errorMessage)
      }
    }

    verifyEmail()
  }, [searchParams, router])

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
          <p className="text-muted-foreground">Verifikasi Email</p>
        </div>

        <Card className="shadow-floating border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">
              {status === 'loading' && 'Memverifikasi Email...'}
              {status === 'success' && 'Email Terverifikasi!'}
              {status === 'error' && 'Verifikasi Gagal'}
            </CardTitle>
            <CardDescription className="text-center">
              {status === 'loading' && 'Mohon tunggu sebentar'}
              {status === 'success' && 'Email Anda telah berhasil diverifikasi'}
              {status === 'error' && 'Terjadi kesalahan saat memverifikasi email'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'loading' && (
              <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <p className="text-muted-foreground">Sedang memverifikasi email Anda...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4 py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">{message}</p>
                  <p className="text-sm text-muted-foreground">
                    Anda akan diarahkan secara otomatis dalam beberapa detik...
                  </p>
                </div>
                <div className="pt-4">
                  <Button asChild className="w-full">
                    <Link href="/">Ke Dashboard</Link>
                  </Button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4 py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-destructive">{error}</p>
                  <p className="text-sm text-muted-foreground">
                    Token mungkin sudah kadaluarsa atau tidak valid. Silakan minta link verifikasi baru.
                  </p>
                </div>
                <div className="pt-4 space-y-2">
                  <Button asChild variant="default" className="w-full">
                    <Link href="/auth/resend-verification">
                      <Mail className="h-4 w-4 mr-2" />
                      Kirim Ulang Email Verifikasi
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/login">Kembali ke Login</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2024 Manggon. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
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
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <p className="text-muted-foreground">Memuat halaman verifikasi...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

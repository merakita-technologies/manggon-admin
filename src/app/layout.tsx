import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google'
import { ClientLayout } from '@/components/layout/client-layout'
import { I18nProvider } from '@/contexts/i18n-context'

const inter = Inter({ subsets: ['latin'] })
import "./globals.css";

export const metadata: Metadata = {
  title: "Manggon Admin - Property Management System",
  description: "Sistem manajemen properti profesional untuk mengelola booking, properti, dan tamu dengan mudah",
  keywords: ["property management", "booking system", "admin dashboard", "manggon"],
  authors: [{ name: "Manggon Team" }],
  creator: "Manggon",
  publisher: "Manggon",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Manggon Admin",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#1B3A57",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1B3A57" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Manggon Admin" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <I18nProvider>
          <ClientLayout requiredRole="owner">
            {children}
          </ClientLayout>
        </I18nProvider>
      </body>
    </html>
  )
}
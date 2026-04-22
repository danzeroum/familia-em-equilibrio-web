export const dynamic = 'force-dynamic'

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from '@/components/ui/Toaster'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { FamilyProvider } from '@/components/providers/FamilyProvider'
import { QuickEntryProvider } from '@/components/quick-entry/QuickEntryProvider'
// No seu layout.tsx raiz, adicionar o componente e o trigger do teclado

import { QuickRegisterModal } from '@/components/quick-register/QuickRegisterModal'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>
        {children}
        <QuickRegisterModal />
      </body>
    </html>
  )
}
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Família em Equilíbrio',
  description: 'Gestão doméstica familiar',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <FamilyProvider>
            <AppShell>{children}</AppShell>
            <Toaster />
            <QuickEntryProvider />
          </FamilyProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

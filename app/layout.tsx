import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { Toaster } from '@/components/ui/Toaster'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { FamilyProvider } from '@/components/providers/FamilyProvider'
import { QuickEntryProvider } from '@/components/quick-entry/QuickEntryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Família em Equilíbrio',
  description: 'Gestão doméstica familiar',
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
            <div className="flex h-screen overflow-hidden bg-background">
              <Sidebar />
              <main className="flex-1 overflow-y-auto">
                <div className="p-6 max-w-[1400px] mx-auto">
                  {children}
                </div>
              </main>
            </div>
            <Toaster />
            <QuickEntryProvider />
          </FamilyProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

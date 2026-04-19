'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { MobileTopBar } from './MobileTopBar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!drawerOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [drawerOpen])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        mobileOpen={drawerOpen}
        onCloseMobile={() => setDrawerOpen(false)}
      />
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileTopBar onOpenMenu={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

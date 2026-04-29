'use client'

import { Menu } from 'lucide-react'
import { useFamilyStore } from '@/store/familyStore'

interface MobileTopBarProps {
  onOpenMenu: () => void
}

export function MobileTopBar({ onOpenMenu }: MobileTopBarProps) {
  const { family } = useFamilyStore()

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-3 bg-card border-b">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menu"
        className="p-2 -ml-1 rounded-md text-foreground hover:bg-accent transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-tight truncate">
          🏠 Família em <span className="text-primary">Equilíbrio</span>
        </p>
        {family && (
          <p className="text-[11px] text-muted-foreground truncate">{family.name}</p>
        )}
      </div>
    </header>
  )
}

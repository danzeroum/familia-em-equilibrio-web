'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useFamilyStore } from '@/store/familyStore'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Home,
  Heart,
  Wallet,
  ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',         label: 'Painel',   icon: LayoutDashboard, emoji: '🎯' },
  { href: '/familia',  label: 'Família',  icon: Users,           emoji: '👨‍👩‍👧‍👦' },
  { href: '/semana',   label: 'Semana',   icon: CalendarDays,    emoji: '📅' },
  { href: '/casa',     label: 'Casa',     icon: Home,            emoji: '🏠' },
  { href: '/saude',    label: 'Saúde',    icon: Heart,           emoji: '🩺' },
  { href: '/agenda',   label: 'Agenda',   icon: Wallet,          emoji: '💰' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { members, family } = useFamilyStore()

  return (
    <aside className="w-56 shrink-0 border-r bg-card flex flex-col h-screen">
      {/* Logo */}
      <div className="px-4 py-5 border-b">
        <h1 className="font-bold text-base leading-tight text-foreground">
          🏠 Família em<br />
          <span className="text-primary">Equilíbrio</span>
        </h1>
        {family && (
          <p className="text-xs text-muted-foreground mt-1">{family.name}</p>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <span className="text-base">{item.emoji}</span>
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
            </Link>
          )
        })}
      </nav>

      {/* Membros da família */}
      {members.length > 0 && (
        <div className="px-3 py-4 border-t">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Membros
          </p>
          <div className="space-y-1.5">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: m.color_hex ?? '#4A90D9' }}
                />
                <span className="text-xs text-foreground truncate">
                  {m.nickname ?? m.name.split(' ')[0]}
                </span>
                <span className="text-xs text-muted-foreground ml-auto capitalize">
                  {m.role === 'adult' ? 'adulto' : m.role === 'child' ? 'criança' : m.role === 'teen' ? 'teen' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

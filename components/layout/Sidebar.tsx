'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useFamilyStore } from '@/store/familyStore'
import { useUIStore } from '@/store/uiStore'
import {
  LayoutDashboard,
  CheckSquare,
  MessageCircle,
  Home,
  BookOpen,
  UtensilsCrossed,
  Car,
  Heart,
  Wallet,
  PartyPopper,
  Settings,
  ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',             label: 'Painel',       icon: LayoutDashboard, emoji: '🎯' },
  { href: '/tarefas',      label: 'Agendamentos',       icon: CheckSquare,     emoji: '✅' },
  { href: '/casa',         label: 'Casa',          icon: Home,            emoji: '🏠' },
  { href: '/alimentacao',  label: 'Alimentação',   icon: UtensilsCrossed, emoji: '🍽️' },
  { href: '/saude',        label: 'Saúde',         icon: Heart,           emoji: '🩺' },
  { href: '/educacao',     label: 'Educação',      icon: BookOpen,        emoji: '📚' },
  { href: '/veiculos',     label: 'Veículos',      icon: Car,             emoji: '🚗' },
  { href: '/financeiro',   label: 'Financeiro',    icon: Wallet,          emoji: '💰' },
  { href: '/social',       label: 'Social',        icon: PartyPopper,     emoji: '🎉' },
  { href: '/configuracoes',label: 'Configurações', icon: Settings,        emoji: '⚙️' },
]

interface SidebarProps {
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps = {}) {
  const pathname = usePathname()
  const { members, family } = useFamilyStore()
  const { openChatbot } = useUIStore()

  return (
    <aside
      className={cn(
        'bg-card flex flex-col border-r',
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:transition-none',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'md:static md:translate-x-0 md:w-56 md:h-screen md:shrink-0 md:z-auto'
      )}
      aria-hidden={!mobileOpen ? undefined : false}
    >
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
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onCloseMobile?.()}
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

      {/* Botão Assistente IA */}
      <div className="px-2 pb-2">
        <button
          onClick={openChatbot}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <span className="text-base">🤖</span>
          <span className="flex-1 text-left">Assistente IA</span>
        </button>
      </div>

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
                  {m.role === 'adult'
                    ? 'adulto'
                    : m.role === 'child'
                    ? 'criança'
                    : m.role === 'teen'
                    ? 'teen'
                    : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

'use client'

import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useQuickEntryStore } from '@/store/quickEntryStore'
import { useFamilyStore } from '@/store/familyStore'
import { useUIStore } from '@/store/uiStore'

export function QuickEntryFAB() {
  const open = useQuickEntryStore((s) => s.open)
  const toggle = useQuickEntryStore((s) => s.toggle)
  const { currentUser } = useFamilyStore()
  const activeSheet = useUIStore((s) => s.activeSheet)

  // Atalho global ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  // Não mostrar se não há sessão/família carregada (utilizador não autenticado ainda)
  if (!currentUser) return null
  // Esconder quando modal já está aberto (evita duplicar CTA) ou um sheet legacy está aberto
  if (open || activeSheet) return null

  return (
    <button
      type="button"
      onClick={() => useQuickEntryStore.getState().openModal()}
      aria-label="Registo rápido"
      className={
        'fixed z-40 right-5 bottom-5 sm:right-6 sm:bottom-6 ' +
        'w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 text-white ' +
        'shadow-lg hover:shadow-xl flex items-center justify-center ' +
        'transition-all active:scale-95'
      }
    >
      <Plus className="w-6 h-6" strokeWidth={2.5} />
    </button>
  )
}

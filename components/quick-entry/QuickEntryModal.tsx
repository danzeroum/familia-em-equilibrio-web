'use client'

import { useEffect, useRef } from 'react'
import { useQuickEntryStore } from '@/store/quickEntryStore'
import { EntityGrid } from './EntityGrid'
import { MiniForm } from './MiniForm'
import { ChatbotSlot } from './ChatbotSlot'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), ' +
  'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function QuickEntryModal() {
  const open = useQuickEntryStore((s) => s.open)
  const entity = useQuickEntryStore((s) => s.entity)
  const savedCount = useQuickEntryStore((s) => s.savedCount)
  const setEntity = useQuickEntryStore((s) => s.setEntity)
  const close = useQuickEntryStore((s) => s.close)
  const incSaved = useQuickEntryStore((s) => s.incSaved)

  const panelRef = useRef<HTMLDivElement>(null)

  // Fechar com Esc + focus trap (Tab/Shift+Tab)
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => !el.hasAttribute('disabled'))
      if (focusables.length === 0) return
      const first = focusables[0]!
      const last = focusables[focusables.length - 1]!
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  // Bloquear scroll do body enquanto o modal está aberto
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-start sm:pt-[10vh] px-0 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Registo rápido"
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Fechar"
        onClick={close}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default"
      />

      {/* Painel */}
      <div
        ref={panelRef}
        className={
          'relative w-full sm:max-w-lg bg-white shadow-2xl ' +
          'rounded-t-2xl sm:rounded-2xl ' +
          'max-h-[90dvh] sm:max-h-[80dvh] overflow-y-auto ' +
          'flex flex-col'
        }
      >
        {/* Header sticky */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <span>⚡</span>
            <span>Registo Rápido</span>
            <span className="hidden sm:inline text-[10px] text-gray-400 font-normal ml-1">
              ⌘K
            </span>
          </h2>
          <div className="flex items-center gap-3">
            {savedCount > 0 && (
              <span className="text-xs text-teal-600 font-semibold">
                ✓ {savedCount} guardado{savedCount > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={close}
              className="text-gray-400 hover:text-gray-700 text-2xl leading-none w-7 h-7 flex items-center justify-center"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-5 space-y-4">
          <ChatbotSlot />

          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
              O que queres registar?
            </p>
            <EntityGrid entity={entity} onSelect={setEntity} />
          </div>

          <div className="pt-1">
            <MiniForm entity={entity} onSaved={incSaved} />
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useFamilyStore } from '@/store/familyStore'
import { useQuickRegister } from '@/hooks/useQuickRegister'
import { QUICK_REGISTER_ITEMS, QuickRegisterType } from '@/types/database'
import { DynamicFields } from './DynamicFields'

function getLabel(type: QuickRegisterType) {
  return QUICK_REGISTER_ITEMS.find((i) => i.type === type)?.label ?? type
}

export function QuickRegisterModal() {
  const { quickRegisterOpen, quickRegisterType, closeQuickRegister, setQuickRegisterType } =
    useUIStore()
  const { members } = useFamilyStore()
  const { save } = useQuickRegister()

  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const wave1Types = QUICK_REGISTER_ITEMS.filter((i) => i.wave === 1)
  const wave2Types = QUICK_REGISTER_ITEMS.filter((i) => i.wave === 2)

  const filteredTypes = search
    ? QUICK_REGISTER_ITEMS.filter((i) =>
        i.label.toLowerCase().includes(search.toLowerCase())
      )
    : null

  const handleChange = useCallback((key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSelectType = (type: QuickRegisterType) => {
    setQuickRegisterType(type)
    setData({})
    setError(null)
    setSuccess(false)
    setSearch('')
  }

  const handleSave = async () => {
    if (!quickRegisterType) return
    setLoading(true)
    setError(null)
    try {
      await save(quickRegisterType, data)
      setSuccess(true)
      setTimeout(() => {
        closeQuickRegister()
        setData({})
        setSuccess(false)
      }, 800)
    } catch (e) {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (quickRegisterOpen) closeQuickRegister()
        else useUIStore.getState().openQuickRegister()
      }
      if (e.key === 'Escape' && quickRegisterOpen) closeQuickRegister()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [quickRegisterOpen])

  useEffect(() => {
    if (quickRegisterOpen && !quickRegisterType) {
      setTimeout(() => searchRef.current?.focus(), 100)
    }
  }, [quickRegisterOpen, quickRegisterType])

  if (!quickRegisterOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onClick={(e) => e.target === e.currentTarget && closeQuickRegister()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Registo Rápido
            </h2>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded border border-zinc-200 dark:border-zinc-700">
              ⌘K
            </kbd>
          </div>
          <button
            onClick={closeQuickRegister}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* NLP Banner */}
        <div className="px-5 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-400 flex items-center gap-1">
            <span>🤖</span>
            Em breve — Registo por linguagem natural
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Search or type selector */}
          {!quickRegisterType ? (
            <>
              <div>
                <input
                  ref={searchRef}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  placeholder="O que queres registar?"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {filteredTypes ? (
                <div className="grid grid-cols-4 gap-2">
                  {filteredTypes.map((item) => (
                    <button
                      key={item.type}
                      onClick={() => handleSelectType(item.type)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-center"
                    >
                      <span className="text-xl">{item.emoji}</span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-tight">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {/* Wave 1 — principais */}
                  <div>
                    <p className="text-xs text-zinc-400 mb-2">Registo rápido</p>
                    <div className="grid grid-cols-4 gap-2">
                      {wave1Types.map((item) => (
                        <button
                          key={item.type}
                          onClick={() => handleSelectType(item.type)}
                          className="flex flex-col items-center gap-1 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-center"
                        >
                          <span className="text-xl">{item.emoji}</span>
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-tight">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wave 2 — menos frequentes */}
                  <div>
                    <p className="text-xs text-zinc-400 mb-2">Outros</p>
                    <div className="grid grid-cols-4 gap-2">
                      {wave2Types.map((item) => (
                        <button
                          key={item.type}
                          onClick={() => handleSelectType(item.type)}
                          className="flex flex-col items-center gap-1 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-center"
                        >
                          <span className="text-xl">{item.emoji}</span>
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-tight">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            /* Formulário dinâmico */
            <>
              {/* Breadcrumb */}
              <button
                onClick={() => {
                  setQuickRegisterType(null)
                  setData({})
                  setError(null)
                }}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                ← Voltar
              </button>

              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">
                  {QUICK_REGISTER_ITEMS.find((i) => i.type === quickRegisterType)?.emoji}
                </span>
                <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                  {getLabel(quickRegisterType)}
                </h3>
              </div>

              <div className="space-y-3">
                <DynamicFields
                  type={quickRegisterType}
                  data={data}
                  onChange={handleChange}
                  members={members}
                />
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={loading || success}
                  className="flex-1 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium py-2 hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors"
                >
                  {success ? '✓ Salvo!' : loading ? 'Salvando…' : 'Salvar'}
                </button>
                <button
                  onClick={closeQuickRegister}
                  className="px-4 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

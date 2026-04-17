'use client'

import { useEffect, useState } from 'react'
import type { BudgetGoal, Bill } from '@/types/database'

const PRESET_CATEGORIES = [
  { value: 'fixed',     label: 'Fixo',        icon: '🏠' },
  { value: 'variable',  label: 'Variável',     icon: '🛍️' },
  { value: 'savings',   label: 'Poupança',    icon: '💰' },
  { value: 'emergency', label: 'Emergência',   icon: '🚨' },
  { value: 'Moradia',   label: 'Moradia',      icon: '🏠' },
  { value: 'Alimentação', label: 'Alimentação', icon: '🍽️' },
  { value: 'Saúde',     label: 'Saúde',        icon: '💪' },
  { value: 'Transporte', label: 'Transporte',  icon: '🚗' },
  { value: 'Educação', label: 'Educação',    icon: '📚' },
  { value: 'Lazer',     label: 'Lazer',        icon: '🎮' },
  { value: 'Serviços',  label: 'Serviços',     icon: '🛠️' },
]

const COLORS = [
  '#01696f', '#437a22', '#a12c7b', '#006494',
  '#7a39bb', '#da7101', '#d19900', '#a13544',
]

interface Props {
  open: boolean
  onClose: () => void
  goal: BudgetGoal | null
  bills: Bill[]
  onSave: (goal: any) => Promise<void>
}

export function BudgetGoalSheet({ open, onClose, goal, bills, onSave }: Props) {
  const [category, setCategory]     = useState('')
  const [customCat, setCustomCat]   = useState('')
  const [monthlyLimit, setMonthlyLimit] = useState('')
  const [icon, setIcon]             = useState('📦')
  const [colorHex, setColorHex]     = useState('#01696f')
  const [alertPct, setAlertPct]     = useState('80')
  const [useCustom, setUseCustom]   = useState(false)
  const [saving, setSaving]         = useState(false)

  // Categorias já usadas em bills (para sugestão)
  const billCats = [...new Set(bills.map(b => b.category).filter(Boolean))] as string[]

  useEffect(() => {
    if (goal) {
      const preset = PRESET_CATEGORIES.find(p => p.value === goal.category)
      setCategory(goal.category)
      setUseCustom(!preset)
      setCustomCat(!preset ? goal.category : '')
      setMonthlyLimit(String(goal.monthly_limit))
      setIcon(goal.icon ?? '📦')
      setColorHex(goal.color_hex ?? '#01696f')
      setAlertPct(String(goal.alert_pct ?? 80))
    } else {
      setCategory('')
      setCustomCat('')
      setMonthlyLimit('')
      setIcon('📦')
      setColorHex('#01696f')
      setAlertPct('80')
      setUseCustom(false)
    }
  }, [goal, open])

  const finalCategory = useCustom ? customCat : category

  async function handleSave() {
    if (!finalCategory || !monthlyLimit) return
    setSaving(true)
    await onSave({
      ...(goal?.id ? { id: goal.id } : {}),
      category: finalCategory,
      monthly_limit: Number(monthlyLimit),
      icon,
      color_hex: colorHex,
      alert_pct: Number(alertPct),
    })
    setSaving(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold">{goal ? 'Editar meta' : 'Nova meta de orçamento'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Categoria */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Categoria *</label>
            {!useCustom ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {PRESET_CATEGORIES.map(p => (
                    <button
                      key={p.value}
                      onClick={() => { setCategory(p.value); setIcon(p.icon) }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                        category === p.value
                          ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
                {/* Sugestões vindas das bills reais */}
                {billCats.filter(c => !PRESET_CATEGORIES.find(p => p.value === c)).length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-400 mb-1">Das suas contas:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {billCats
                        .filter(c => !PRESET_CATEGORIES.find(p => p.value === c))
                        .map(c => (
                          <button
                            key={c}
                            onClick={() => setCategory(c)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                              category === c
                                ? 'border-teal-500 bg-teal-50 text-teal-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setUseCustom(true)}
                  className="text-xs text-teal-600 hover:underline"
                >
                  + Categoria personalizada
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <input
                  value={customCat}
                  onChange={e => setCustomCat(e.target.value)}
                  placeholder="Ex: Delivery, Academia..."
                  className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                  autoFocus
                />
                <button
                  onClick={() => { setUseCustom(false); setCustomCat('') }}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2"
                >
                  ↩
                </button>
              </div>
            )}
          </div>

          {/* Limite mensal */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Limite mensal (R$) *</label>
            <input
              type="number"
              value={monthlyLimit}
              onChange={e => setMonthlyLimit(e.target.value)}
              placeholder="Ex: 800"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Alerta % */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Alertar ao atingir <span className="font-medium text-gray-700">{alertPct}%</span> do limite
            </label>
            <input
              type="range"
              min="50" max="100" step="5"
              value={alertPct}
              onChange={e => setAlertPct(e.target.value)}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>50%</span><span>75%</span><span>100%</span>
            </div>
          </div>

          {/* Ícone customizado */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Ícone</label>
            <input
              value={icon}
              onChange={e => setIcon(e.target.value)}
              placeholder="Emoji"
              className="w-16 border rounded-lg px-3 py-2 text-center text-lg outline-none focus:ring-2 focus:ring-teal-500"
              maxLength={2}
            />
          </div>

          {/* Cor */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColorHex(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    colorHex === c ? 'border-gray-800 scale-110' : 'border-transparent'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-4 py-3">
          <button
            onClick={handleSave}
            disabled={saving || !finalCategory || !monthlyLimit}
            className="w-full bg-teal-600 text-white font-medium py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvando...' : goal ? 'Salvar alterações' : 'Criar meta'}
          </button>
        </div>
      </div>
    </div>
  )
}

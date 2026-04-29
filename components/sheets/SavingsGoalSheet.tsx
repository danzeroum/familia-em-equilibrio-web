'use client'

import { useEffect, useState } from 'react'
import type { SavingsGoal } from '@/types/database'

const ICONS = ['🎯', '✈️', '🏠', '🚗', '💻', '📚', '🏖️', '💍', '🎓', '🐾', '🏋️', '🎸']
const CURRENCIES = [
  { code: 'BRL', label: 'Real (R$)' },
  { code: 'GBP', label: 'Libra (£)' },
  { code: 'USD', label: 'Dólar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
]
const COLORS = [
  '#01696f', '#437a22', '#a12c7b', '#006494',
  '#7a39bb', '#da7101', '#d19900', '#a13544',
]

interface Props {
  open: boolean
  onClose: () => void
  goal: SavingsGoal | null
  onSave: (goal: any) => Promise<void>
}

export function SavingsGoalSheet({ open, onClose, goal, onSave }: Props) {
  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [currency, setCurrency]         = useState('BRL')
  const [deadline, setDeadline]         = useState('')
  const [icon, setIcon]                 = useState('🎯')
  const [colorHex, setColorHex]         = useState('#01696f')
  const [saving, setSaving]             = useState(false)

  useEffect(() => {
    if (goal) {
      setTitle(goal.title)
      setDescription(goal.description ?? '')
      setTargetAmount(String(goal.target_amount))
      setCurrentAmount(String(goal.current_amount))
      setCurrency(goal.currency ?? 'BRL')
      setDeadline(goal.deadline ?? '')
      setIcon(goal.icon ?? '🎯')
      setColorHex(goal.color_hex ?? '#01696f')
    } else {
      setTitle('')
      setDescription('')
      setTargetAmount('')
      setCurrentAmount('0')
      setCurrency('BRL')
      setDeadline('')
      setIcon('🎯')
      setColorHex('#01696f')
    }
  }, [goal, open])

  async function handleSave() {
    if (!title || !targetAmount) return
    setSaving(true)
    await onSave({
      ...(goal?.id ? { id: goal.id } : {}),
      title,
      description: description || null,
      target_amount: Number(targetAmount),
      current_amount: Number(currentAmount || 0),
      currency,
      deadline: deadline || null,
      icon,
      color_hex: colorHex,
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
          <h2 className="font-semibold">{goal ? 'Editar objetivo' : 'Novo objetivo'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Ícone */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                    icon === ic ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Título *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Viagem Inglaterra 2026"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Descrição</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Férias com Ana, Luisa e Benício"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Moeda */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Moeda</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Meta *</label>
              <input
                type="number"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                placeholder="10000"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Já guardado</label>
              <input
                type="number"
                value={currentAmount}
                onChange={e => setCurrentAmount(e.target.value)}
                placeholder="0"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Prazo */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Prazo (opcional)</label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
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
            disabled={saving || !title || !targetAmount}
            className="w-full bg-teal-600 text-white font-medium py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvando...' : goal ? 'Salvar alterações' : 'Criar objetivo'}
          </button>
        </div>
      </div>
    </div>
  )
}

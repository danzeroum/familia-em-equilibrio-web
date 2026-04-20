'use client'
import { useEffect, useState } from 'react'
import { SlideOver, Field, SaveCancel } from './_shared'
import type { EmotionalPractice } from '@/hooks/useEmotionalPractices'

interface Props {
  open: boolean
  onClose: () => void
  practice: EmotionalPractice | null
  onSave: (p: Omit<EmotionalPractice, 'status' | 'lastDoneWeek'>) => void
}

const EMOJIS = ['🗣️','🎈','✏️','🌙','🤗','📓','🧩','🧘','💚','🌟','💪','🎨','🎵','💌','🔥']

const FREQUENCY_OPTIONS = ['Diário', 'Semanal', 'Quinzenal', 'Quando ocorrer', 'Mensal']

const FOR_WHOM_OPTIONS = ['Todos', 'Crianças', 'Pais', 'Cada criança', 'Adultos']

type FormState = Omit<EmotionalPractice, 'status' | 'lastDoneWeek'>

export function EmotionalPracticeSheet({ open, onClose, practice, onSave }: Props) {
  const [form, setForm] = useState<FormState>({
    id: '',
    emoji: '🗣️',
    title: '',
    howTo: '',
    whenToUse: '',
    forWhom: 'Todos',
    frequency: 'Diário',
  })

  useEffect(() => {
    if (practice) {
      const { status, lastDoneWeek, ...rest } = practice
      setForm(rest)
    } else {
      setForm({
        id: String(Date.now()),
        emoji: '🗣️',
        title: '',
        howTo: '',
        whenToUse: '',
        forWhom: 'Todos',
        frequency: 'Diário',
      })
    }
  }, [practice, open])

  const set = (k: keyof FormState, v: any) => setForm(f => ({ ...f, [k]: v }))

  function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    if (!form.howTo?.trim()) { alert('"Como fazer" é obrigatório'); return }
    onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={practice ? 'Editar prática' : 'Nova prática emocional'} onClose={onClose}>

      {/* Emoji */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Ícone</label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => set('emoji', e)}
              className={`text-xl w-9 h-9 rounded-lg border transition-colors ${
                form.emoji === e
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <Field
        label="Título *"
        value={form.title}
        onChange={v => set('title', v)}
        placeholder="Ex: Conversa sobre sentimentos"
      />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Como fazer *</label>
        <textarea
          className="input-base resize-none"
          rows={3}
          value={form.howTo}
          onChange={e => set('howTo', e.target.value)}
          placeholder="Ex: Pergunta aberta na janta, inspirar 4s..."
        />
      </div>

      <Field
        label="Quando usar"
        value={form.whenToUse}
        onChange={v => set('whenToUse', v)}
        placeholder="Ex: Diário, Crise emocional, Noite..."
      />

      {/* Para quem */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Para quem</label>
        <select
          className="input-base"
          value={form.forWhom}
          onChange={e => set('forWhom', e.target.value)}
        >
          {FOR_WHOM_OPTIONS.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* Frequência */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Frequência</label>
        <select
          className="input-base"
          value={form.frequency}
          onChange={e => set('frequency', e.target.value)}
        >
          {FREQUENCY_OPTIONS.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}

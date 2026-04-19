'use client'

import { useEffect, useRef, useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useUIStore } from '@/store/uiStore'
import type { QuickEntryEntity } from '@/store/quickEntryStore'
import { useTasks } from '@/hooks/useTasks'
import { useBills } from '@/hooks/useBills'
import { useMedications } from '@/hooks/useMedications'
import { useVaccines } from '@/hooks/useVaccines'
import { useShoppingItems } from '@/hooks/useShoppingItems'
import { useHomeMaintenance } from '@/hooks/useHomeMaintenance'
import { useFamilyEvents } from '@/hooks/useFamilyEvents'
import { useEmotionalCheckins } from '@/hooks/useEmotionalCheckins'
import { TextField, NumberField, DateField, MemberSelect, SelectField, MoodSlider } from './fields'

const PRACTICES = [
  { value: 'Respiração', label: 'Respiração' },
  { value: 'Gratidão', label: 'Gratidão' },
  { value: 'Exercício', label: 'Exercício' },
  { value: 'Conversa', label: 'Conversa' },
  { value: 'Meditação', label: 'Meditação' },
]

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

type Props = {
  entity: QuickEntryEntity
  onSaved: () => void
}

export function MiniForm({ entity, onSaved }: Props) {
  const { family, currentUser, members } = useFamilyStore()
  const { addToast } = useUIStore()
  const familyId = family?.id ?? null

  const tasks = useTasks()
  const bills = useBills()
  const meds = useMedications()
  const vaccines = useVaccines()
  const shopping = useShoppingItems()
  const maintenance = useHomeMaintenance()
  const events = useFamilyEvents(familyId)
  const checkins = useEmotionalCheckins(familyId)

  const initialMemberId = currentUser?.id ?? members[0]?.id ?? ''

  // Campos partilhados entre entidades
  const [title, setTitle] = useState('')
  const [memberId, setMemberId] = useState(initialMemberId)
  const [date, setDate] = useState(today())

  // Campos específicos
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [quantity, setQuantity] = useState('')
  const [mood, setMood] = useState(3)
  const [practice, setPractice] = useState(PRACTICES[0]!.value)
  const [saving, setSaving] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)

  function focusTitle() {
    titleRef.current?.focus()
    titleRef.current?.select()
  }

  // Reset ao trocar de entidade (evita título de tarefa poluindo form de conta)
  useEffect(() => {
    setTitle('')
    setAmount('')
    setDueDay('')
    setQuantity('')
    setMood(3)
    setPractice(PRACTICES[0]!.value)
    setDate(today())
    setMemberId(initialMemberId)
    // Foco no título ao trocar
    const t = setTimeout(() => titleRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [entity, initialMemberId])

  const canSave = (() => {
    if (saving) return false
    if (entity === 'checkin') return !!memberId && !!practice
    if (entity === 'bill') return title.trim().length > 0
    if (entity === 'event') return title.trim().length > 0 && !!date
    if (entity === 'vaccine' || entity === 'medication') return title.trim().length > 0 && !!memberId
    return title.trim().length > 0
  })()

  const titleLabel =
    entity === 'medication' || entity === 'vaccine' || entity === 'shopping'
      ? 'Nome'
      : entity === 'checkin'
        ? ''
        : 'Título'

  const titlePlaceholder = {
    task: 'Ex: Levar a Ana ao médico',
    bill: 'Ex: Conta de luz',
    medication: 'Ex: Paracetamol',
    vaccine: 'Ex: BCG',
    shopping: 'Ex: Arroz 5kg',
    maintenance: 'Ex: Limpar filtro de ar',
    event: 'Ex: Aniversário da Ana',
    checkin: '',
  }[entity]

  async function save() {
    if (!canSave) return
    setSaving(true)
    try {
      switch (entity) {
        case 'task': {
          await tasks.upsert({
            title: title.trim(),
            assigned_to: memberId || null,
            due_date: date || null,
            priority: 'medium',
            status: 'pending',
            created_by: currentUser?.id ?? null,
          } as any)
          break
        }
        case 'bill': {
          const parsedAmount = amount ? Number(amount) : null
          const parsedDueDay = dueDay ? Number(dueDay) : null
          await bills.upsert({
            title: title.trim(),
            amount: parsedAmount,
            due_day: parsedDueDay,
            status: 'pending',
            is_recurring: false,
            assigned_to: memberId || null,
          } as any)
          break
        }
        case 'medication': {
          await meds.upsert({
            name: title.trim(),
            profile_id: memberId || null,
            is_active: true,
          } as any)
          break
        }
        case 'vaccine': {
          await vaccines.upsert({
            name: title.trim(),
            profile_id: memberId,
            applied_date: date || null,
          } as any)
          break
        }
        case 'shopping': {
          const qty = quantity ? Number(quantity) : 1
          await shopping.upsert({
            name: title.trim(),
            quantity: qty,
            status: 'needed',
            is_recurring: false,
            requested_by: currentUser?.id ?? null,
            domain_id: familyId as any,
          } as any)
          break
        }
        case 'maintenance': {
          await maintenance.upsert({
            title: title.trim(),
            frequency_days: 30,
            frequency_label: 'Mensal',
            responsible_id: memberId || null,
            status: 'pending',
          } as any)
          break
        }
        case 'event': {
          await events.upsert({
            title: title.trim(),
            event_date: date,
            event_type: 'general',
            assigned_to: memberId || null,
          } as any)
          break
        }
        case 'checkin': {
          if (!currentUser?.id) throw new Error('Utilizador não carregado')
          await checkins.addCheckin({
            profile_id: memberId,
            practice,
            mood_level: mood,
            registered_by: currentUser.id,
          })
          break
        }
      }

      // Reset apenas dos campos "de linha" — mantém contexto (membro, data) para cadastro em série
      setTitle('')
      setAmount('')
      setQuantity('')
      onSaved()
      // Devolve foco ao título para fluxo Arroz → Feijão → Detergente
      setTimeout(() => focusTitle(), 0)
    } catch (err: any) {
      addToast({
        title: 'Erro ao guardar',
        description: err?.message ?? 'Tenta novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
      className="space-y-3"
    >
      {entity !== 'checkin' && (
        <TextField
          ref={titleRef}
          label={titleLabel}
          value={title}
          onChange={setTitle}
          placeholder={titlePlaceholder}
          onEnter={save}
        />
      )}

      {/* Membro — aparece em quase todas as entidades */}
      {entity !== 'shopping' && entity !== 'maintenance' && members.length > 0 && (
        <MemberSelect
          label={entity === 'bill' || entity === 'task' || entity === 'event' ? 'Responsável' : 'Para quem'}
          value={memberId}
          onChange={setMemberId}
          members={members}
          includeNone={entity === 'task' || entity === 'bill' || entity === 'event'}
        />
      )}

      {entity === 'maintenance' && members.length > 0 && (
        <MemberSelect
          label="Responsável"
          value={memberId}
          onChange={setMemberId}
          members={members}
          includeNone
        />
      )}

      {/* Campos específicos por entidade */}
      {(entity === 'task' || entity === 'event' || entity === 'vaccine') && (
        <DateField
          label={entity === 'event' ? 'Data do evento' : entity === 'vaccine' ? 'Data da aplicação' : 'Data'}
          value={date}
          onChange={setDate}
        />
      )}

      {entity === 'bill' && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Valor (R$)"
            value={amount}
            onChange={setAmount}
            placeholder="0,00"
            min={0}
            step={0.01}
          />
          <NumberField
            label="Vence dia"
            value={dueDay}
            onChange={setDueDay}
            placeholder="10"
            min={1}
            max={31}
          />
        </div>
      )}

      {entity === 'shopping' && (
        <NumberField
          label="Quantidade"
          value={quantity}
          onChange={setQuantity}
          placeholder="1"
          min={1}
          step={1}
        />
      )}

      {entity === 'checkin' && (
        <>
          <SelectField
            label="Prática"
            value={practice}
            onChange={setPractice}
            options={PRACTICES}
          />
          <MoodSlider value={mood} onChange={setMood} />
        </>
      )}

      <button
        type="submit"
        disabled={!canSave}
        className={
          'w-full rounded-lg py-2.5 font-medium text-sm transition-colors ' +
          (canSave
            ? 'bg-teal-600 hover:bg-teal-700 text-white'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed')
        }
      >
        {saving ? 'A guardar...' : 'Guardar (Enter)'}
      </button>
    </form>
  )
}

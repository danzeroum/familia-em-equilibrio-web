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
// Novos hooks — certifica que existem ou cria seguindo o padrão
import { useSubtasks } from '@/hooks/useSubtasks'
import { useHealthTracking } from '@/hooks/useHealthTracking'
import { useHomework } from '@/hooks/useHomework'
import { useSchoolItems } from '@/hooks/useSchoolItems'
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts'
import { useGratitudeNotes } from '@/hooks/useGratitudeNotes'
import { useMaintenanceCalls } from '@/hooks/useMaintenanceCalls'
import {
  TextField,
  NumberField,
  DateField,
  MemberSelect,
  SelectField,
  MoodSlider,
  TextareaField,   // novo — adicionar em fields.tsx (ver abaixo)
} from './fields'
import { supabase } from '@/lib/supabase'

const PRACTICES = [
  { value: 'Respiração', label: 'Respiração' },
  { value: 'Gratidão', label: 'Gratidão' },
  { value: 'Exercício', label: 'Exercício' },
  { value: 'Conversa', label: 'Conversa' },
  { value: 'Meditação', label: 'Meditação' },
]

const HEALTH_METRICS = [
  { value: 'weight',         label: '⚖️ Peso (kg)' },
  { value: 'temperature',    label: '🌡️ Temperatura (°C)' },
  { value: 'blood_pressure', label: '🩸 Pressão arterial' },
  { value: 'glucose',        label: '🍬 Glicemia (mg/dL)' },
  { value: 'heart_rate',     label: '❤️ Freq. cardíaca (bpm)' },
  { value: 'sleep_hours',    label: '😴 Horas de sono' },
  { value: 'other',          label: '📊 Outro' },
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
  

  // Hooks existentes
  const tasks       = useTasks()
  const bills       = useBills()
  const meds        = useMedications()
  const vaccines    = useVaccines()
  const shopping    = useShoppingItems()
  const maintenance = useHomeMaintenance()
  const events      = useFamilyEvents(familyId)
  const checkins    = useEmotionalCheckins(familyId)

  // Hooks novos
  const subtasks        = useSubtasks()
  const healthTracking  = useHealthTracking()
  const homework        = useHomework()
  const schoolItems     = useSchoolItems()
  const emergencyContacts = useEmergencyContacts(familyId)
  const gratitudeNotes  = useGratitudeNotes()
  const maintenanceCalls = useMaintenanceCalls()

  const initialMemberId = currentUser?.id ?? members[0]?.id ?? ''

  // Campos partilhados
  const [title,    setTitle]    = useState('')
  const [memberId, setMemberId] = useState(initialMemberId)
  const [date,     setDate]     = useState(today())

  // Campos específicos — existentes
  const [amount,   setAmount]   = useState('')
  const [dueDay,   setDueDay]   = useState('')
  const [quantity, setQuantity] = useState('')
  const [mood,     setMood]     = useState(3)
  const [practice, setPractice] = useState(PRACTICES[0]!.value)
  const [saving,   setSaving]   = useState(false)

  // Campos específicos — novos
  const [taskParentId,  setTaskParentId]  = useState('')
  const [parentTasks,   setParentTasks]   = useState<{ id: string; title: string }[]>([])
  const [healthMetric,  setHealthMetric]  = useState(HEALTH_METRICS[0]!.value)
  const [healthValue,   setHealthValue]   = useState('')
  const [subject,       setSubject]       = useState('')
  const [phone,         setPhone]         = useState('')
  const [relation,      setRelation]      = useState('')
  const [gratitudeText, setGratitudeText] = useState('')
  const [provider,      setProvider]      = useState('')

  const titleRef = useRef<HTMLInputElement>(null)

  // Busca tarefas abertas para o select de subtarefa
  useEffect(() => {
    if (entity !== 'subtask' || !familyId) return
    supabase
      .from('tasks')
      .select('id, title')
      .eq('family_id' as any, familyId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setParentTasks(data ?? []))
  }, [entity, familyId])

  function focusTitle() {
    titleRef.current?.focus()
    titleRef.current?.select()
  }

  // Reset ao trocar de entidade
  useEffect(() => {
    setTitle('')
    setAmount('')
    setDueDay('')
    setQuantity('')
    setMood(3)
    setPractice(PRACTICES[0]!.value)
    setDate(today())
    setMemberId(initialMemberId)
    setTaskParentId('')
    setHealthMetric(HEALTH_METRICS[0]!.value)
    setHealthValue('')
    setSubject('')
    setPhone('')
    setRelation('')
    setGratitudeText('')
    setProvider('')
    const t = setTimeout(() => titleRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [entity, initialMemberId])

  const canSave = (() => {
    if (saving) return false
    switch (entity) {
      case 'checkin':           return !!memberId && !!practice
      case 'bill':              return title.trim().length > 0
      case 'event':             return title.trim().length > 0 && !!date
      case 'vaccine':
      case 'medication':        return title.trim().length > 0 && !!memberId
      case 'subtask':           return title.trim().length > 0 && !!taskParentId
      case 'health_tracking':   return !!memberId && !!healthMetric && !!healthValue
      case 'homework':          return title.trim().length > 0 && !!memberId
      case 'school_item':       return title.trim().length > 0 && !!memberId
      case 'emergency_contact': return title.trim().length > 0 && phone.trim().length > 0
      case 'gratitude':         return gratitudeText.trim().length > 0
      case 'maintenance_call':  return title.trim().length > 0
      default:                  return title.trim().length > 0
    }
  })()

  const titleLabel = ({
    task:              'Título',
    bill:              'Título',
    medication:        'Nome',
    vaccine:           'Nome',
    shopping:          'Nome',
    maintenance:       'Título',
    event:             'Título',
    subtask:           'Título',
    homework:          'Título',
    school_item:       'Nome',
    emergency_contact: 'Nome',
    maintenance_call:  'Serviço / problema',
    checkin:           '',
    health_tracking:   '',
    gratitude:         '',
  } as Record<string, string>)[entity] ?? 'Título'

  const titlePlaceholder = {
    task:              'Ex: Levar a Ana ao médico',
    bill:              'Ex: Conta de luz',
    medication:        'Ex: Paracetamol',
    vaccine:           'Ex: BCG',
    shopping:          'Ex: Arroz 5kg',
    maintenance:       'Ex: Limpar filtro de ar',
    event:             'Ex: Aniversário da Ana',
    checkin:           '',
    subtask:           'Ex: Comprar remédio',
    health_tracking:   '',
    homework:          'Ex: Exercícios de matemática',
    school_item:       'Ex: Caderno quadriculado',
    emergency_contact: 'Ex: Dr. João',
    gratitude:         '',
    maintenance_call:  'Ex: Torneira com vazamento',
  }[entity]

  async function save() {
    if (!canSave || !familyId) return
    setSaving(true)
    try {
      switch (entity) {
        // ── existentes ──────────────────────────────────────────────────────
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
          await bills.upsert({
            title: title.trim(),
            amount: amount ? Number(amount) : null,
            due_day: dueDay ? Number(dueDay) : null,
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
          await shopping.upsert({
            name: title.trim(),
            quantity: quantity ? Number(quantity) : 1,
            status: 'needed',
            is_recurring: false,
            requested_by: currentUser?.id ?? null,
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

        // ── novos ────────────────────────────────────────────────────────────
        case 'subtask': {
          await subtasks.upsert({
            title: title.trim(),
            task_id: taskParentId,
            assigned_to: memberId || null,
            status: 'pending',
            family_id: familyId,
          } as any)
          break
        }
        case 'health_tracking': {
          await healthTracking.upsert({
            profile_id: memberId,
            metric: healthMetric,
            value: Number(healthValue),
            recorded_at: date,
            family_id: familyId,
          } as any)
          break
        }
        case 'homework': {
          await homework.upsert({
            title: title.trim(),
            profile_id: memberId,
            due_date: date || null,
            subject: subject.trim() || null,
            status: 'pending',
            family_id: familyId,
          } as any)
          break
        }
        case 'school_item': {
          await schoolItems.upsert({
            name: title.trim(),
            profile_id: memberId,
            quantity: quantity ? Number(quantity) : 1,
            status: 'needed',
            family_id: familyId,
          } as any)
          break
        }
        case 'emergency_contact': {
          await emergencyContacts.upsert({
            name: title.trim(),
            phone: phone.trim(),
            relation: relation.trim() || null,
            family_id: familyId,
          } as any)
          break
        }
        case 'gratitude': {
          await gratitudeNotes.upsert({
            content: gratitudeText.trim(),
            profile_id: memberId || null,
            family_id: familyId,
          } as any)
          break
        }
        case 'maintenance_call': {
          await maintenanceCalls.upsert({
            title: title.trim(),
            provider: provider.trim() || null,
            scheduled_date: date || null,
            status: 'pending',
            family_id: familyId,
          } as any)
          break
        }
      }

      // Reset campos de linha; mantém contexto (membro, data) para série
      setTitle('')
      setAmount('')
      setQuantity('')
      setTaskParentId('')
      setHealthValue('')
      setSubject('')
      setPhone('')
      setRelation('')
      setGratitudeText('')
      setProvider('')
      onSaved()
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

  const showTitleField = !['checkin', 'health_tracking', 'gratitude'].includes(entity)
  const showMemberSelect = !['shopping', 'maintenance', 'emergency_contact'].includes(entity)
  const isChildContext = ['homework', 'school_item'].includes(entity)
  const childrenOnly = isChildContext ? members.filter((m) => m.is_child) : []
  const memberList = childrenOnly.length > 0 ? childrenOnly : members
  const includeNone = ['task', 'bill', 'event', 'maintenance', 'subtask', 'maintenance_call'].includes(entity)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
      className="space-y-3"
    >
      {/* Título / Nome genérico */}
      {showTitleField && (
        <TextField
          ref={titleRef}
          label={titleLabel}
          value={title}
          onChange={setTitle}
          placeholder={titlePlaceholder}
          onEnter={save}
        />
      )}

      {/* Tarefa pai — apenas subtarefa */}
      {entity === 'subtask' && (
        <SelectField
          label="Tarefa pai *"
          value={taskParentId}
          onChange={setTaskParentId}
          options={parentTasks.map((t) => ({ value: t.id, label: t.title }))}
        />
      )}

      {/* Membro */}
      {showMemberSelect && members.length > 0 && (
        <MemberSelect
          label={
            entity === 'bill' || entity === 'task' || entity === 'event' || entity === 'maintenance_call'
              ? 'Responsável'
              : entity === 'checkin' || entity === 'health_tracking'
                ? 'Quem?'
                : 'Para quem'
          }
          value={memberId}
          onChange={setMemberId}
          members={memberList}
          includeNone={includeNone}
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

      {/* ── Campos específicos existentes ── */}
      {(entity === 'task' || entity === 'event' || entity === 'vaccine') && (
        <DateField
          label={entity === 'event' ? 'Data do evento' : entity === 'vaccine' ? 'Data da aplicação' : 'Data'}
          value={date}
          onChange={setDate}
        />
      )}

      {entity === 'bill' && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Valor (R$)" value={amount} onChange={setAmount} placeholder="0,00" min={0} step={0.01} />
          <NumberField label="Vence dia"  value={dueDay} onChange={setDueDay} placeholder="10" min={1} max={31} />
        </div>
      )}

      {entity === 'shopping' && (
        <NumberField label="Quantidade" value={quantity} onChange={setQuantity} placeholder="1" min={1} step={1} />
      )}

      {entity === 'checkin' && (
        <>
          <SelectField label="Prática" value={practice} onChange={setPractice} options={PRACTICES} />
          <MoodSlider value={mood} onChange={setMood} />
        </>
      )}

      {/* ── Campos específicos novos ── */}
      {entity === 'health_tracking' && (
        <>
          <SelectField label="Métrica *" value={healthMetric} onChange={setHealthMetric} options={HEALTH_METRICS} />
          <NumberField label="Valor *" value={healthValue} onChange={setHealthValue} placeholder="Ex: 70" step={0.1} />
          <DateField label="Data" value={date} onChange={setDate} />
        </>
      )}

      {entity === 'homework' && (
        <>
          <TextField label="Disciplina" value={subject} onChange={setSubject} placeholder="Ex: Matemática" />
          <DateField label="Entregar até" value={date} onChange={setDate} />
        </>
      )}

      {entity === 'school_item' && (
        <NumberField label="Quantidade" value={quantity} onChange={setQuantity} placeholder="1" min={1} step={1} />
      )}

      {entity === 'emergency_contact' && (
        <>
          <TextField label="Telefone *" value={phone} onChange={setPhone} placeholder="Ex: +55 11 99999-9999" />
          <TextField label="Relação" value={relation} onChange={setRelation} placeholder="Ex: Médico, Vizinho" />
        </>
      )}

      {entity === 'gratitude' && (
        <>
          <TextareaField
            label="Pelo que és grato hoje? *"
            value={gratitudeText}
            onChange={setGratitudeText}
            placeholder="Ex: Pela saúde da família..."
          />
          {members.length > 0 && (
            <MemberSelect label="Quem regista?" value={memberId} onChange={setMemberId} members={members} includeNone />
          )}
        </>
      )}

      {entity === 'maintenance_call' && (
        <>
          <TextField label="Prestador / empresa" value={provider} onChange={setProvider} placeholder="Ex: Elétrica Silva" />
          <DateField label="Data agendada" value={date} onChange={setDate} />
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

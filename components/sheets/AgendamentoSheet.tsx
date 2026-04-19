'use client'
import { useEffect, useState } from 'react'
import type { ChecklistItem, FamilyEvent, Profile, Task } from '@/types/database'
import type { AgendamentoItem, AgendamentoKind } from '@/types/agendamento'
import { SlideOver, Field, SaveCancel } from './_shared'
import { useCategoryStore } from '@/store/categoryStore'

interface Props {
  open: boolean
  onClose: () => void
  item: AgendamentoItem | null
  defaultKind?: AgendamentoKind
  prefill?: { date?: string; time?: string | null }
  onSaveTask: (t: any) => Promise<void>
  onSaveEvent: (e: any) => Promise<void>
  familyId: string
  members: Profile[]
}

function newItem(text = ''): ChecklistItem {
  return { id: crypto.randomUUID(), text, done: false }
}

export function AgendamentoSheet({
  open, onClose, item, defaultKind = 'task', prefill,
  onSaveTask, onSaveEvent, familyId, members,
}: Props) {
  const { categories, load: loadCategories } = useCategoryStore()

  const isEdit = !!item?.id
  const [kind, setKind] = useState<AgendamentoKind>(defaultKind)

  // Shared
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState<string>('')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  // Task-only
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium')
  const [recurrence, setRecurrence] = useState<'none'|'daily'|'weekly'|'monthly'>('none')
  const [categoryId, setCategoryId] = useState<string>('')
  const [requiresSupervision, setRequiresSupervision] = useState(false)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [newText, setNewText] = useState('')

  // Event-only
  const [eventType, setEventType] = useState<FamilyEvent['event_type']>('general')
  const [participants, setParticipants] = useState<string[]>([])
  const [actionDescription, setActionDescription] = useState('')
  const [budgetEstimate, setBudgetEstimate] = useState<string>('')

  useEffect(() => { loadCategories() }, [])

  useEffect(() => {
    if (!open) return

    if (item?._kind === 'task') {
      const t = item as Task & Record<string, any>
      setKind('task')
      setTitle(t.title ?? '')
      setDescription(t.description ?? '')
      setDate(t.due_date ?? '')
      setTime(t.due_time ? String(t.due_time).slice(0, 5) : '')
      setAssignedTo(t.assigned_to ?? '')
      setLocation((t as any).location ?? '')
      setNotes(t.notes ?? '')
      const p = (t as any).priority
      setPriority(p === 3 || p === 'high' ? 'high' : p === 1 || p === 'low' ? 'low' : 'medium')
      setRecurrence(((t as any).recurrence as any) ?? 'none')
      setCategoryId((t as any).category_id ?? '')
      setRequiresSupervision(!!t.requires_supervision)
      setChecklist(Array.isArray(t.checklist) ? t.checklist : [])
      setEventType('general')
      setParticipants([])
      setActionDescription('')
      setBudgetEstimate('')
    } else if (item?._kind === 'event') {
      const e = item as FamilyEvent
      setKind('event')
      setTitle(e.title ?? '')
      setDescription(e.description ?? '')
      setDate(e.event_date ?? '')
      setTime(e.event_time ? String(e.event_time).slice(0, 5) : '')
      setAssignedTo(e.assigned_to ?? '')
      setLocation(e.location ?? '')
      setNotes(e.notes ?? '')
      setEventType(e.event_type ?? 'general')
      setParticipants(e.participants ?? [])
      setActionDescription(e.action_description ?? '')
      setBudgetEstimate(e.budget_estimate != null ? String(e.budget_estimate) : '')
      setPriority('medium')
      setRecurrence('none')
      setCategoryId('')
      setRequiresSupervision(false)
      setChecklist([])
    } else {
      // Novo
      setKind(defaultKind)
      setTitle('')
      setDescription('')
      setDate(prefill?.date ?? '')
      setTime(prefill?.time ? String(prefill.time).slice(0, 5) : '')
      setAssignedTo('')
      setLocation('')
      setNotes('')
      setPriority('medium')
      setRecurrence('none')
      setCategoryId('')
      setRequiresSupervision(false)
      setChecklist([])
      setEventType('general')
      setParticipants([])
      setActionDescription('')
      setBudgetEstimate('')
    }
    setNewText('')
  }, [open, item, defaultKind, prefill])

  function toggleParticipant(id: string) {
    setParticipants(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  function addChecklistItem() {
    const t = newText.trim()
    if (!t) return
    setChecklist(prev => [...prev, newItem(t)])
    setNewText('')
  }

  function toggleChecklist(id: string) {
    setChecklist(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  function removeChecklist(id: string) {
    setChecklist(prev => prev.filter(i => i.id !== id))
  }

  function updateChecklistText(id: string, text: string) {
    setChecklist(prev => prev.map(i => i.id === id ? { ...i, text } : i))
  }

  async function save() {
    if (!title.trim()) { alert('Título é obrigatório'); return }

    if (kind === 'task') {
      const payload: any = {
        ...(item?._kind === 'task' ? { id: (item as Task).id } : {}),
        title: title.trim(),
        description: description || null,
        due_date: date || null,
        due_time: time || null,
        assigned_to: assignedTo || null,
        priority,
        recurrence,
        category_id: categoryId || null,
        requires_supervision: requiresSupervision,
        location: location || null,
        notes: notes || null,
        checklist,
        status: (item as any)?.status ?? 'pending',
      }
      await onSaveTask(payload)
    } else {
      if (!date) { alert('Data é obrigatória'); return }
      const payload: any = {
        ...(item?._kind === 'event' ? { id: (item as FamilyEvent).id } : {}),
        title: title.trim(),
        description: description || null,
        event_date: date,
        event_time: time || null,
        event_type: eventType,
        location: location || null,
        assigned_to: assignedTo || null,
        participants,
        action_description: actionDescription || null,
        budget_estimate: budgetEstimate ? parseFloat(budgetEstimate) : null,
        notes: notes || null,
        family_id: familyId,
      }
      await onSaveEvent(payload)
    }
    onClose()
  }

  if (!open) return null

  const groups = Array.from(new Set(categories.map(c => c.group_name))).sort()
  const done = checklist.filter(i => i.done).length
  const title_label = isEdit
    ? (kind === 'task' ? 'Editar tarefa' : 'Editar evento')
    : 'Novo agendamento'

  return (
    <SlideOver title={title_label} onClose={onClose}>

      {/* Toggle Tarefa / Evento */}
      <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          disabled={isEdit}
          onClick={() => setKind('task')}
          className={`py-1.5 rounded-md text-sm font-medium transition-colors
            ${kind === 'task' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
            ${isEdit ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          ✅ Tarefa
        </button>
        <button
          type="button"
          disabled={isEdit}
          onClick={() => setKind('event')}
          className={`py-1.5 rounded-md text-sm font-medium transition-colors
            ${kind === 'event' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
            ${isEdit ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          📅 Evento
        </button>
      </div>

      {/* Título */}
      <Field
        label="Título *"
        value={title}
        onChange={setTitle}
        placeholder={kind === 'task' ? 'Ex: Levar Maria ao dentista' : 'Ex: Aniversário da Vovó'}
      />

      {/* Descrição */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Descrição</label>
        <textarea
          className="input-base resize-none"
          rows={2}
          placeholder="Detalhes adicionais..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      {/* Data + Hora */}
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={kind === 'event' ? 'Data *' : 'Prazo'}
          type="date"
          value={date}
          onChange={setDate}
        />
        <div>
          <label className="text-sm text-gray-600 block mb-1">Hora</label>
          <input
            type="time"
            className="input-base"
            value={time}
            onChange={e => setTime(e.target.value)}
          />
        </div>
      </div>

      {/* Responsável */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Responsável</label>
        <select
          className="input-base"
          value={assignedTo}
          onChange={e => setAssignedTo(e.target.value)}
        >
          <option value="">— Selecione —</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.nickname ?? (m as any).name}</option>
          ))}
        </select>
      </div>

      {/* Local */}
      <Field
        label="Local"
        value={location}
        onChange={setLocation}
        placeholder={kind === 'task' ? 'Ex: UBS Centro, Escola...' : 'Ex: Casa da Vovó, Restaurante...'}
      />

      {/* ───── CAMPOS DE TAREFA ───── */}
      {kind === 'task' && (
        <>
          {/* Categoria */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Categoria</label>
            <select
              className="input-base"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
            >
              <option value="">— Sem categoria —</option>
              {groups.map(group => (
                <optgroup key={group} label={group}>
                  {categories
                    .filter(c => c.group_name === group)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Prioridade + Recorrência */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Prioridade</label>
              <select className="input-base" value={priority} onChange={e => setPriority(e.target.value as any)}>
                <option value="low">🟢 Baixa</option>
                <option value="medium">🟡 Média</option>
                <option value="high">🔴 Alta</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Recorrência</label>
              <select className="input-base" value={recurrence} onChange={e => setRecurrence(e.target.value as any)}>
                <option value="none">Sem recorrência</option>
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-600 font-medium">
                ✅ Checklist
                {checklist.length > 0 && (
                  <span className="ml-2 text-xs text-gray-400">{done}/{checklist.length}</span>
                )}
              </label>
              {checklist.length > 0 && done === checklist.length && (
                <span className="text-xs text-green-600 font-medium">Tudo feito! 🎉</span>
              )}
            </div>

            {checklist.length > 0 && (
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                <div
                  className="bg-teal-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(done / checklist.length) * 100}%` }}
                />
              </div>
            )}

            {checklist.length > 0 && (
              <ul className="space-y-1.5 mb-3">
                {checklist.map(ci => (
                  <li key={ci.id} className="flex items-center gap-2 group">
                    <input
                      type="checkbox"
                      checked={ci.done}
                      onChange={() => toggleChecklist(ci.id)}
                      className="w-4 h-4 accent-teal-600 shrink-0"
                    />
                    <input
                      type="text"
                      value={ci.text}
                      onChange={e => updateChecklistText(ci.id, e.target.value)}
                      className={`flex-1 text-sm bg-transparent border-b border-transparent focus:border-gray-300 outline-none py-0.5 ${
                        ci.done ? 'line-through text-gray-400' : 'text-gray-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => removeChecklist(ci.id)}
                      className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem() } }}
                placeholder="+ Adicionar item..."
                className="flex-1 input-base text-sm"
              />
              <button
                type="button"
                onClick={addChecklistItem}
                disabled={!newText.trim()}
                className="px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Validação adulto */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="adult-val"
              checked={requiresSupervision}
              onChange={e => setRequiresSupervision(e.target.checked)}
              className="w-4 h-4 accent-teal-600"
            />
            <label htmlFor="adult-val" className="text-sm text-gray-600">
              👤 Requer validação de adulto
            </label>
          </div>
        </>
      )}

      {/* ───── CAMPOS DE EVENTO ───── */}
      {kind === 'event' && (
        <>
          {/* Tipo */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Tipo</label>
            <select className="input-base" value={eventType} onChange={e => setEventType(e.target.value as any)}>
              <option value="general">📅 Geral</option>
              <option value="birthday">🎂 Aniversário</option>
              <option value="school">🎒 Escola</option>
              <option value="medical">🏥 Médico</option>
              <option value="travel">✈️ Viagem</option>
            </select>
          </div>

          {/* Participantes */}
          {members.length > 0 && (
            <div>
              <label className="text-sm text-gray-600 block mb-2">Participantes</label>
              <div className="flex flex-wrap gap-2">
                {members.map(m => {
                  const selected = participants.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleParticipant(m.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                        ${selected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
                    >
                      {m.nickname ?? (m as any).name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ação necessária */}
          <Field
            label="Ação necessária"
            value={actionDescription}
            onChange={setActionDescription}
            placeholder="Ex: Levar cartão do plano, comprar presente..."
          />

          {/* Orçamento */}
          <Field
            label="Orçamento estimado (R$)"
            type="number"
            value={budgetEstimate}
            onChange={setBudgetEstimate}
            placeholder="0,00"
          />
        </>
      )}

      {/* Observações */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Observações</label>
        <textarea
          className="input-base resize-none"
          rows={2}
          placeholder="Notas rápidas, lembretes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}

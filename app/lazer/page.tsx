'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useLeisureActivities } from '@/hooks/useLeisureActivities'
import { useLeisureRecords } from '@/hooks/useLeisureRecords'
import { useLeisurePlaces } from '@/hooks/useLeisurePlaces'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { LeisureActivitySheet } from '@/components/sheets/LeisureActivitySheet'
import { LeisureRecordSheet } from '@/components/sheets/LeisureRecordSheet'
import { LeisurePlaceSheet } from '@/components/sheets/LeisurePlaceSheet'
import type { LeisureActivity, LeisureRecord, LeisurePlace } from '@/types/database'

type Tab = 'ideias' | 'agenda' | 'registros' | 'lugares'

const CATEGORY_LABEL: Record<string, string> = {
  passeio:       '🚶 Passeio',
  viagem:        '✈️ Viagem',
  esporte:       '⚽ Esporte',
  cultura:       '🎭 Cultura',
  entretenimento:'🎮 Entretenimento',
  natureza:      '🌿 Natureza',
  social:        '👥 Social',
  educativo:     '📚 Educativo',
  outros:        '📦 Outros',
}

const PLACE_CATEGORY_LABEL: Record<string, string> = {
  parque:      '🌳 Parque',
  praia:       '🏖️ Praia',
  restaurante: '🍽️ Restaurante',
  cinema:      '🎬 Cinema',
  teatro:      '🎭 Teatro',
  museu:       '🏛️ Museu',
  esporte:     '⚽ Esporte',
  viagem:      '✈️ Viagem',
  clube:       '🎉 Clube',
  outros:      '📦 Outros',
}

const PRIORITY_BADGE: Record<string, { label: string; cls: string }> = {
  alta:  { label: '🔴 Alta',  cls: 'bg-red-100 text-red-700' },
  media: { label: '🟡 Média', cls: 'bg-yellow-100 text-yellow-700' },
  baixa: { label: '🟢 Baixa', cls: 'bg-green-100 text-green-700' },
}

const STATUS_LABEL: Record<string, string> = {
  wishlist:  '💡 Ideia',
  planejado: '📅 Planejado',
  realizado: '✅ Realizado',
  cancelado: '❌ Cancelado',
}

// ─── STATUS_CYCLE ────────────────────────────────────────────────────────────
const STATUS_CYCLE: LeisureActivity['status'][] = ['wishlist', 'planejado', 'realizado', 'cancelado']
const nextStatus = (s: LeisureActivity['status']) =>
  STATUS_CYCLE[(STATUS_CYCLE.indexOf(s) + 1) % STATUS_CYCLE.length]

// ═══════════════════════════════════════════════════════════════════════════════
export default function LazerPage() {
  const { members } = useFamilyStore()
  const activities = useLeisureActivities()
  const records    = useLeisureRecords()
  const places     = useLeisurePlaces()

  const [tab, setTab] = useState<Tab>('ideias')
  const [filterAudience, setFilterAudience] = useState<'all' | 'adults' | 'children'>('all')

  // ── Sheet states
  const [activitySheetOpen, setActivitySheetOpen] = useState(false)
  const [selectedActivity, setSelectedActivity]   = useState<LeisureActivity | null>(null)

  const [recordSheetOpen, setRecordSheetOpen]   = useState(false)
  const [selectedRecord, setSelectedRecord]     = useState<LeisureRecord | null>(null)
  const [recordDefaults, setRecordDefaults]     = useState<Partial<LeisureRecord> | undefined>()

  const [placeSheetOpen, setPlaceSheetOpen]   = useState(false)
  const [selectedPlace, setSelectedPlace]     = useState<LeisurePlace | null>(null)

  // ── Filtros
  const filteredActivities = activities.items.filter(a => {
    if (filterAudience === 'adults')   return a.for_adults && !a.for_children
    if (filterAudience === 'children') return a.for_children
    return true
  })

  const wishlistItems  = filteredActivities.filter(a => a.status === 'wishlist')
  const plannedItems   = filteredActivities.filter(a => a.status === 'planejado')
  const doneItems      = filteredActivities.filter(a => a.status === 'realizado')

  // ── Stats de registros
  const now       = new Date()
  const thisMonth = records.items.filter(r => {
    const d = new Date(r.date_realized)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const totalCostMonth = thisMonth.reduce((s, r) => s + (r.cost_actual ?? 0), 0)
  const avgRating      = thisMonth.length
    ? (thisMonth.reduce((s, r) => s + (r.rating ?? 0), 0) / thisMonth.length).toFixed(1)
    : null

  const getMemberName = (id: string) =>
    members.find(m => m.id === id)?.nickname ?? members.find(m => m.id === id)?.name ?? id

  const TABS = [
    { id: 'ideias'    as Tab, label: '💡 Ideias',    alerts: wishlistItems.length },
    { id: 'agenda'    as Tab, label: '📅 Agenda',    alerts: plannedItems.length },
    { id: 'registros' as Tab, label: '📸 Registros', alerts: 0 },
    { id: 'lugares'   as Tab, label: '📍 Lugares',   alerts: 0 },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        emoji="🎉"
        title="Lazer"
        description="Ideias, planejamento e registros de lazer da família"
        action={
          tab === 'ideias' ? (
            <button
              className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedActivity(null); setActivitySheetOpen(true) }}
            >+ Ideia</button>
          ) : tab === 'registros' ? (
            <button
              className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedRecord(null); setRecordDefaults(undefined); setRecordSheetOpen(true) }}
            >+ Registro</button>
          ) : tab === 'lugares' ? (
            <button
              className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedPlace(null); setPlaceSheetOpen(true) }}
            >+ Lugar</button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.alerts > 0 && (
              <span className="bg-teal-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {t.alerts}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filtro público x crianças (abas ideias e agenda) */}
      {(tab === 'ideias' || tab === 'agenda') && (
        <div className="flex gap-2">
          {[
            { id: 'all'      as const, label: '👨‍👩‍👧 Todos' },
            { id: 'adults'   as const, label: '🧑 Adultos' },
            { id: 'children' as const, label: '🧒 Crianças' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilterAudience(opt.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                filterAudience === opt.id
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'border-gray-200 text-gray-600 hover:border-teal-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* ══ IDEIAS ══ */}
      {tab === 'ideias' && (
        <div className="space-y-6">
          {activities.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : filteredActivities.length === 0 ? (
            <EmptyState
              emoji="💡"
              title="Nenhuma ideia ainda"
              description="Adicione passeios, viagens e atividades que a família quer fazer."
            />
          ) : (
            <>
              {/* Wishlist */}
              {wishlistItems.length > 0 && (
                <div>
                  <h3 className="text-gray-600 font-medium mb-3 text-sm">💡 Wishlist ({wishlistItems.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {wishlistItems.map(a => (
                      <ActivityCard
                        key={a.id}
                        activity={a}
                        onEdit={() => { setSelectedActivity(a); setActivitySheetOpen(true) }}
                        onRemove={() => { if (confirm('Remover?')) activities.remove(a.id) }}
                        onCycleStatus={() => activities.updateStatus(a.id, nextStatus(a.status))}
                        onConvertToTask={() => activities.convertToTask(a)}
                        onConvertToEvent={(date) => activities.convertToEvent(a, date)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Planejados */}
              {plannedItems.length > 0 && (
                <div>
                  <h3 className="text-gray-600 font-medium mb-3 text-sm">📅 Planejados ({plannedItems.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {plannedItems.map(a => (
                      <ActivityCard
                        key={a.id}
                        activity={a}
                        onEdit={() => { setSelectedActivity(a); setActivitySheetOpen(true) }}
                        onRemove={() => { if (confirm('Remover?')) activities.remove(a.id) }}
                        onCycleStatus={() => activities.updateStatus(a.id, nextStatus(a.status))}
                        onConvertToTask={() => activities.convertToTask(a)}
                        onConvertToEvent={(date) => activities.convertToEvent(a, date)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Realizados */}
              {doneItems.length > 0 && (
                <div className="opacity-80">
                  <h3 className="text-gray-500 font-medium mb-3 text-sm">✅ Realizados ({doneItems.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {doneItems.map(a => (
                      <ActivityCard
                        key={a.id}
                        activity={a}
                        onEdit={() => { setSelectedActivity(a); setActivitySheetOpen(true) }}
                        onRemove={() => { if (confirm('Remover?')) activities.remove(a.id) }}
                        onCycleStatus={() => activities.updateStatus(a.id, nextStatus(a.status))}
                        onConvertToTask={() => activities.convertToTask(a)}
                        onConvertToEvent={(date) => activities.convertToEvent(a, date)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══ AGENDA ══ */}
      {tab === 'agenda' && (
        <div className="space-y-4">
          {plannedItems.length === 0 ? (
            <EmptyState
              emoji="📅"
              title="Nada planejado"
              description="Itens com status Planejado aparecem aqui. Mude o status de uma ideia para Planejado."
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">{plannedItems.length} atividade(s) planejada(s)</p>
              {plannedItems.map(a => (
                <div key={a.id} className="bg-white border rounded-xl p-4 flex items-start justify-between gap-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{a.emoji ?? '🎉'}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{a.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {a.category && <span>{CATEGORY_LABEL[a.category] ?? a.category}</span>}
                        {a.estimated_cost && <span> · R$ {a.estimated_cost.toFixed(2)}</span>}
                        {a.location_name && <span> · 📍 {a.location_name}</span>}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {a.for_children && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">🧒 Crianças</span>}
                        {a.for_adults   && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">🧑 Adultos</span>}
                        {a.task_id  && <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">✅ Tarefa criada</span>}
                        {a.event_id && <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">📅 Agendado</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <button
                      className="text-xs text-teal-600 font-medium hover:underline whitespace-nowrap"
                      onClick={() => {
                        const date = prompt('Data para o evento (AAAA-MM-DD):', new Date().toISOString().split('T')[0])
                        if (date) activities.convertToEvent(a, date)
                      }}
                    >📅 Agendar</button>
                    {!a.task_id && (
                      <button
                        className="text-xs text-gray-500 hover:text-teal-600 whitespace-nowrap"
                        onClick={() => activities.convertToTask(a)}
                      >⚡ Virar Tarefa</button>
                    )}
                    <button
                      className="text-xs text-gray-400 hover:text-gray-600"
                      onClick={() => activities.updateStatus(a.id, 'realizado')}
                    >✔ Marcar Feito</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ REGISTROS ══ */}
      {tab === 'registros' && (
        <div className="space-y-4">
          {/* Stats do mês */}
          {thisMonth.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-teal-700">{thisMonth.length}</p>
                <p className="text-xs text-teal-600 mt-1">lazeres este mês</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-orange-700">R$ {totalCostMonth.toFixed(0)}</p>
                <p className="text-xs text-orange-600 mt-1">custo no mês</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-yellow-700">{avgRating ?? '—'}</p>
                <p className="text-xs text-yellow-600 mt-1">rating médio ⭐</p>
              </div>
            </div>
          )}

          {records.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : records.items.length === 0 ? (
            <EmptyState
              emoji="📸"
              title="Nenhum registro ainda"
              description="Registre os momentos de lazer que a família já viveu."
            />
          ) : (
            <div className="space-y-3">
              {records.items.map(r => (
                <div key={r.id} className="bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{r.emoji ?? '🎉'}</span>
                      <div>
                        <p className="font-semibold text-gray-800">{r.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          📅 {new Date(r.date_realized).toLocaleDateString('pt-BR')}
                          {r.location_name && <span> · 📍 {r.location_name}</span>}
                          {r.cost_actual && <span> · R$ {r.cost_actual.toFixed(2)}</span>}
                        </p>
                        {r.rating && (
                          <p className="text-sm mt-1">{'⭐'.repeat(r.rating)}</p>
                        )}
                        {r.participants.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            👥 {r.participants.map(getMemberName).join(', ')}
                          </p>
                        )}
                        {r.would_repeat && (
                          <span className="inline-block mt-1 text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full">🔄 Repetiria</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="text-xs text-teal-600 hover:underline"
                        onClick={() => { setSelectedRecord(r); setRecordSheetOpen(true) }}
                      >Editar</button>
                      <button
                        className="text-xs text-red-400 hover:text-red-600"
                        onClick={() => { if (confirm('Remover registro?')) records.remove(r.id) }}
                      >×</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ LUGARES ══ */}
      {tab === 'lugares' && (
        <div>
          {places.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : places.items.length === 0 ? (
            <EmptyState
              emoji="📍"
              title="Nenhum lugar salvo"
              description="Salve parques, praias, restaurantes e outros lugares favoritos."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {places.items.map(p => (
                <div key={p.id} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.emoji ?? '📍'}</span>
                      <div>
                        <p className="font-semibold text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.category ? PLACE_CATEGORY_LABEL[p.category] ?? p.category : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => places.toggleFavorite(p.id, !p.is_favorite)}
                      className={`text-xl transition-colors ${p.is_favorite ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                      title="Favorito"
                    >★</button>
                  </div>

                  {p.address && <p className="text-xs text-gray-500">📍 {p.address}</p>}
                  {p.notes   && <p className="text-xs text-gray-500 line-clamp-2">{p.notes}</p>}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {p.visited_count > 0 && <span>🔁 {p.visited_count}x visitado</span>}
                    {p.maps_url    && <a href={p.maps_url}    target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Maps</a>}
                    {p.website_url && <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Site</a>}
                  </div>

                  <div className="flex gap-2 pt-2 border-t mt-auto">
                    <button
                      className="text-xs text-teal-600 hover:underline"
                      onClick={() => {
                        places.incrementVisited(p.id)
                        setSelectedRecord(null)
                        setRecordDefaults({ location_name: p.name, emoji: p.emoji ?? undefined })
                        setRecordSheetOpen(true)
                        setTab('registros')
                      }}
                    >📸 Registrar visita</button>
                    <span className="text-gray-200">|</span>
                    <button
                      className="text-xs text-gray-400 hover:text-gray-600"
                      onClick={() => { setSelectedPlace(p); setPlaceSheetOpen(true) }}
                    >Editar</button>
                    <button
                      className="text-xs text-red-400 hover:text-red-600 ml-auto"
                      onClick={() => { if (confirm('Remover lugar?')) places.remove(p.id) }}
                    >×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sheets */}
      <LeisureActivitySheet
        open={activitySheetOpen}
        onClose={() => setActivitySheetOpen(false)}
        item={selectedActivity}
        onSave={activities.upsert}
        members={members}
        onConvertToTask={activities.convertToTask}
        onConvertToEvent={activities.convertToEvent}
      />
      <LeisureRecordSheet
        open={recordSheetOpen}
        onClose={() => setRecordSheetOpen(false)}
        item={selectedRecord}
        onSave={records.upsert}
        members={members}
        defaults={recordDefaults}
        activities={activities.items}
      />
      <LeisurePlaceSheet
        open={placeSheetOpen}
        onClose={() => setPlaceSheetOpen(false)}
        item={selectedPlace}
        onSave={places.upsert}
        members={members}
      />
    </div>
  )
}

// ─── ActivityCard component ──────────────────────────────────────────────────
function ActivityCard({
  activity: a,
  onEdit,
  onRemove,
  onCycleStatus,
  onConvertToTask,
  onConvertToEvent,
}: {
  activity: LeisureActivity
  onEdit: () => void
  onRemove: () => void
  onCycleStatus: () => void
  onConvertToTask: () => void
  onConvertToEvent: (date: string) => void
}) {
  const pri = PRIORITY_BADGE[a.priority ?? 'media']
  return (
    <div className="bg-white border rounded-xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl flex-shrink-0">{a.emoji ?? '🎉'}</span>
          <p className="font-semibold text-gray-800 truncate">{a.title}</p>
        </div>
        <button
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${pri.cls}`}
          onClick={onCycleStatus}
          title="Clique para avançar status"
        >{pri.label}</button>
      </div>

      {a.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{a.description}</p>
      )}

      <div className="flex flex-wrap gap-1 text-[10px]">
        {a.category && (
          <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            {CATEGORY_LABEL[a.category] ?? a.category}
          </span>
        )}
        {a.for_children && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">🧒 Crianças</span>}
        {a.for_adults   && <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">🧑 Adultos</span>}
        {a.estimated_cost && <span className="bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">R$ {a.estimated_cost.toFixed(0)}</span>}
      </div>

      {/* Badges de conversão */}
      {(a.task_id || a.event_id) && (
        <div className="flex gap-1 flex-wrap">
          {a.task_id  && <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">✅ Tarefa criada</span>}
          {a.event_id && <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">📅 Agendado</span>}
        </div>
      )}

      {/* Status badge clicável */}
      <button
        onClick={onCycleStatus}
        className="text-[10px] text-gray-400 hover:text-teal-600 text-left transition-colors"
        title="Avançar status"
      >
        {STATUS_LABEL[a.status]} →
      </button>

      <div className="flex gap-2 pt-2 border-t mt-auto text-xs">
        {!a.task_id && (
          <button className="text-gray-500 hover:text-teal-600" onClick={onConvertToTask}>⚡ Tarefa</button>
        )}
        {!a.event_id && (
          <button
            className="text-gray-500 hover:text-orange-500"
            onClick={() => {
              const date = prompt('Data (AAAA-MM-DD):', new Date().toISOString().split('T')[0])
              if (date) onConvertToEvent(date)
            }}
          >📅 Evento</button>
        )}
        <button className="text-teal-600 hover:underline ml-auto" onClick={onEdit}>Editar</button>
        <button className="text-red-400 hover:text-red-600" onClick={onRemove}>×</button>
      </div>
    </div>
  )
}

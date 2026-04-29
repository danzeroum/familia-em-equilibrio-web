'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLeisureActivities } from '@/hooks/useLeisureActivities'
import { useLeisureRecords } from '@/hooks/useLeisureRecords'
import { useLeisurePlaces } from '@/hooks/useLeisurePlaces'
import { useFamilyStore } from '@/store/familyStore'
import LeisureActivitySheet from '@/components/sheets/LeisureActivitySheet'
import LeisureRecordSheet from '@/components/sheets/LeisureRecordSheet'
import LeisurePlaceSheet from '@/components/sheets/LeisurePlaceSheet'
import type { LeisureActivity, LeisureRecord, LeisurePlace, LeisureStatus } from '@/types/database'

type Tab = 'ideias' | 'agenda' | 'registros' | 'lugares'

const STATUS_LABELS: Record<LeisureStatus, { label: string; color: string; dot: string }> = {
  wishlist:  { label: 'Wishlist',  color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',  dot: '🌟' },
  planejado: { label: 'Planejado', color: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300',   dot: '📅' },
  realizado: { label: 'Realizado', color: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300', dot: '✅' },
  cancelado: { label: 'Cancelado', color: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400',       dot: '❌' },
}

const PRIORITY_DOT: Record<string, string> = { alta: '🔴', media: '🟡', baixa: '🟢' }

const STATUS_CYCLE: LeisureStatus[] = ['wishlist', 'planejado', 'realizado', 'cancelado']

function nextStatus(current: LeisureStatus): LeisureStatus {
  const idx = STATUS_CYCLE.indexOf(current)
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
}

function formatCurrency(val: number | null) {
  if (val == null) return null
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getWeekDates(offset = 0) {
  const now = new Date()
  const day = now.getDay()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - day + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

export default function LazerPage() {
  const [tab, setTab] = useState<Tab>('ideias')
  const { members } = useFamilyStore()

  const {
    items: activities, isLoading: loadingAct,
    upsert: upsertActivity, remove: removeActivity,
    updateStatus, convertToTask, convertToEvent
  } = useLeisureActivities()

  const {
    items: records, isLoading: loadingRec,
    upsert: upsertRecord, remove: removeRecord
  } = useLeisureRecords()

  const {
    items: places, isLoading: loadingPlaces,
    upsert: upsertPlace, remove: removePlace,
    toggleFavorite, incrementVisited
  } = useLeisurePlaces()

  // Sheet states
  const [actSheet, setActSheet] = useState<{ open: boolean; item: LeisureActivity | null }>({
    open: false, item: null
  })
  const [recSheet, setRecSheet] = useState<{ open: boolean; item: LeisureRecord | null; defaultActivityId?: string }>({
    open: false, item: null
  })
  const [placeSheet, setPlaceSheet] = useState<{ open: boolean; item: LeisurePlace | null }>({
    open: false, item: null
  })

  // Filters
  const [actFilter, setActFilter] = useState<'todos' | 'adultos' | 'criancas'>('todos')
  const [placeFilter, setPlaceFilter] = useState<string>('todos')
  const [weekOffset, setWeekOffset] = useState(0)

  const filteredActivities = activities.filter(a => {
    if (actFilter === 'adultos') return a.for_adults
    if (actFilter === 'criancas') return a.for_children
    return true
  })

  const weekDates = getWeekDates(weekOffset)

  const activitiesThisMonth = records.filter(r => {
    const d = new Date(r.date_realized)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const totalCostMonth = activitiesThisMonth.reduce((s, r) => s + (r.cost_actual || 0), 0)
  const avgRating = activitiesThisMonth.length
    ? (activitiesThisMonth.reduce((s, r) => s + (r.rating || 0), 0) / activitiesThisMonth.length).toFixed(1)
    : null

  const uniquePlaceCategories = ['todos', ...Array.from(new Set(places.map(p => p.category).filter(Boolean)))]

  const filteredPlaces = places.filter(p => placeFilter === 'todos' || p.category === placeFilter)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageHeader emoji="🎉" title="Lazer" description="Planejamento e registro de momentos em família" />

      {/* Tabs */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4">
        <div className="flex gap-0 max-w-4xl mx-auto overflow-x-auto">
          {([
            { id: 'ideias',    label: '💡 Ideias' },
            { id: 'agenda',   label: '📅 Agenda' },
            { id: 'registros',label: '📸 Registros' },
            { id: 'lugares',  label: '📍 Lugares' },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ─── ABA IDEIAS ─────────────────────────────────────────── */}
        {tab === 'ideias' && (
          <div className="space-y-4">
            {/* Filtros + Botão novo */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-2">
                {(['todos', 'adultos', 'criancas'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setActFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      actFilter === f
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {f === 'todos' ? '👨‍👩‍👧 Todos' : f === 'adultos' ? '👨 Adultos' : '👧 Crianças'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setActSheet({ open: true, item: null })}
                className="flex items-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
              >
                + Nova ideia
              </button>
            </div>

            {loadingAct ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <EmptyState
                emoji="🎯"
                title="Nenhuma ideia de lazer ainda"
                description="Adicione atividades que a família quer fazer!"
                action={{ label: '+ Adicionar ideia', onClick: () => setActSheet({ open: true, item: null }) }}
              />
            ) : (
              <div className="space-y-3">
                {filteredActivities.map(act => {
                  const s = STATUS_LABELS[act.status]
                  return (
                    <div
                      key={act.id}
                      className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="text-2xl">{act.emoji || '🎉'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{act.title}</span>
                              {PRIORITY_DOT[act.priority] && (
                                <span className="text-xs">{PRIORITY_DOT[act.priority]}</span>
                              )}
                            </div>
                            {act.description && (
                              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{act.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <button
                                onClick={() => updateStatus(act.id, nextStatus(act.status))}
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}
                              >
                                {s.dot} {s.label}
                              </button>
                              {act.for_children && <span className="text-xs">👧</span>}
                              {act.for_adults && <span className="text-xs">👨</span>}
                              {act.estimated_cost && (
                                <span className="text-xs text-zinc-400">{formatCurrency(act.estimated_cost)}</span>
                              )}
                              {act.duration_hours && (
                                <span className="text-xs text-zinc-400">{act.duration_hours}h</span>
                              )}
                              {act.task_id && (
                                <span className="text-xs bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded-full">✅ Tarefa</span>
                              )}
                              {act.event_id && (
                                <span className="text-xs bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded-full">📅 Evento</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setActSheet({ open: true, item: act })}
                            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => { if (confirm('Remover esta atividade?')) removeActivity(act.id) }}
                            className="p-1.5 text-zinc-400 hover:text-red-500 rounded"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── ABA AGENDA ─────────────────────────────────────────── */}
        {tab === 'agenda' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-50">‹</button>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {weekDates[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} –{' '}
                  {weekDates[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-50">›</button>
              </div>
              <button onClick={() => setWeekOffset(0)} className="text-xs text-teal-600 hover:underline">Hoje</button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date, i) => {
                const iso = date.toISOString().split('T')[0]
                const isToday = iso === new Date().toISOString().split('T')[0]
                // Filtra eventos vinculados (event_id) que batem com a data do family_event
                // Por ora, mostra atividades planejadas na semana (sem data específica)
                const dayActivities = activities.filter(a =>
                  a.status === 'planejado' && !a.event_id
                ).slice(0, 2)

                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-2 min-h-[80px] flex flex-col gap-1 ${
                      isToday
                        ? 'border-teal-400 bg-teal-50 dark:bg-teal-950/30'
                        : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-xs text-zinc-400">{WEEK_DAYS[date.getDay()]}</div>
                      <div className={`text-sm font-semibold ${
                        isToday ? 'text-teal-700 dark:text-teal-400' : 'text-zinc-700 dark:text-zinc-300'
                      }`}>{date.getDate()}</div>
                    </div>
                    {isToday && dayActivities.map(a => (
                      <div key={a.id} className="text-xs bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 rounded px-1 py-0.5 truncate">
                        {a.emoji} {a.title}
                      </div>
                    ))}
                    <button
                      onClick={() => setActSheet({ open: true, item: null })}
                      className="mt-auto text-zinc-300 dark:text-zinc-600 hover:text-teal-500 text-lg leading-none"
                    >+</button>
                  </div>
                )
              })}
            </div>

            {/* Atividades planejadas sem evento vinculado */}
            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-2">📋 Planejadas sem evento agendado</h3>
              <div className="space-y-2">
                {activities.filter(a => a.status === 'planejado' && !a.event_id).length === 0 ? (
                  <p className="text-sm text-zinc-400">Nenhuma atividade planejada sem evento.</p>
                ) : (
                  activities.filter(a => a.status === 'planejado' && !a.event_id).map(act => (
                    <div key={act.id} className="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2">
                      <span>{act.emoji || '🎉'}</span>
                      <span className="text-sm text-zinc-800 dark:text-zinc-200 flex-1">{act.title}</span>
                      <button
                        onClick={() => setActSheet({ open: true, item: act })}
                        className="text-xs text-teal-600 hover:underline"
                      >Editar</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── ABA REGISTROS ──────────────────────────────────────── */}
        {tab === 'registros' && (
          <div className="space-y-4">
            {/* Stats do mês */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 text-center">
                <div className="text-2xl font-bold text-teal-700 dark:text-teal-400">{activitiesThisMonth.length}</div>
                <div className="text-xs text-zinc-500 mt-0.5">lazeres este mês</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 text-center">
                <div className="text-2xl font-bold text-teal-700 dark:text-teal-400">
                  {totalCostMonth > 0 ? formatCurrency(totalCostMonth) : '—'}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">gasto este mês</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 text-center">
                <div className="text-2xl font-bold text-teal-700 dark:text-teal-400">
                  {avgRating ? `⭐ ${avgRating}` : '—'}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">média de avaliação</div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setRecSheet({ open: true, item: null })}
                className="flex items-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
              >
                + Registrar lazer
              </button>
            </div>

            {loadingRec ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}
              </div>
            ) : records.length === 0 ? (
              <EmptyState
                emoji="📸"
                title="Nenhum lazer registrado"
                description="Registre os momentos de diversão da família!"
                action={{ label: '+ Registrar lazer', onClick: () => setRecSheet({ open: true, item: null }) }}
              />
            ) : (
              <div className="space-y-3">
                {[...records].sort((a, b) => b.date_realized.localeCompare(a.date_realized)).map(rec => {
                  const participantMembers = members.filter(m => rec.participants.includes(m.id))
                  return (
                    <div key={rec.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-2xl">{rec.emoji || '📸'}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">{rec.title}</span>
                              {rec.would_repeat && <span className="text-xs">🔄</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-zinc-400">{formatDate(rec.date_realized)}</span>
                              {rec.rating && (
                                <span className="text-xs text-amber-500">
                                  {'⭐'.repeat(rec.rating)}
                                </span>
                              )}
                              {rec.cost_actual && (
                                <span className="text-xs text-zinc-400">{formatCurrency(rec.cost_actual)}</span>
                              )}
                              {rec.location_name && (
                                <span className="text-xs text-zinc-400">📍 {rec.location_name}</span>
                              )}
                            </div>
                            {participantMembers.length > 0 && (
                              <div className="flex gap-1 mt-1.5">
                                {participantMembers.map(m => (
                                  <span key={m.id} className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded-full">
                                    {(m as any).nickname || m.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setRecSheet({ open: true, item: rec })}
                            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded"
                          >✏️</button>
                          <button
                            onClick={() => { if (confirm('Remover este registro?')) removeRecord(rec.id) }}
                            className="p-1.5 text-zinc-400 hover:text-red-500 rounded"
                          >🗑️</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── ABA LUGARES ────────────────────────────────────────── */}
        {tab === 'lugares' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {uniquePlaceCategories.map(cat => (
                  <button
                    key={cat || 'todos'}
                    onClick={() => setPlaceFilter(cat || 'todos')}
                    className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                      placeFilter === (cat || 'todos')
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {cat === 'todos' ? '📍 Todos' : cat}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPlaceSheet({ open: true, item: null })}
                className="flex items-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 whitespace-nowrap"
              >
                + Novo lugar
              </button>
            </div>

            {loadingPlaces ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}
              </div>
            ) : filteredPlaces.length === 0 ? (
              <EmptyState
                emoji="📍"
                title="Nenhum lugar salvo"
                description="Salve parques, praias, restaurantes e outros lugares favoritos!"
                action={{ label: '+ Adicionar lugar', onClick: () => setPlaceSheet({ open: true, item: null }) }}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredPlaces.map(place => (
                  <div key={place.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 shadow-sm flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">{place.emoji || '📍'}</span>
                      <button
                        onClick={() => toggleFavorite(place.id, place.is_favorite)}
                        className={`text-lg transition-transform hover:scale-110 ${
                          place.is_favorite ? 'opacity-100' : 'opacity-30'
                        }`}
                      >
                        ⭐
                      </button>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">{place.name}</p>
                      {place.category && (
                        <p className="text-xs text-zinc-400 capitalize">{place.category}</p>
                      )}
                    </div>
                    {place.visited_count > 0 && (
                      <p className="text-xs text-zinc-400">{place.visited_count}x visitado</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {place.maps_url && (
                        <a href={place.maps_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-teal-600 hover:underline">Maps</a>
                      )}
                      {place.website_url && (
                        <a href={place.website_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-teal-600 hover:underline">Site</a>
                      )}
                    </div>
                    <div className="flex gap-1 mt-auto pt-1 border-t border-zinc-50 dark:border-zinc-800">
                      <button
                        onClick={() => {
                          incrementVisited(place.id, place.visited_count)
                          setRecSheet({ open: true, item: null })
                        }}
                        className="flex-1 text-xs py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100"
                      >
                        ✅ Visita
                      </button>
                      <button
                        onClick={() => setPlaceSheet({ open: true, item: place })}
                        className="px-2 text-xs py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => { if (confirm('Remover este lugar?')) removePlace(place.id) }}
                        className="px-2 text-xs py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-red-50 hover:text-red-500"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sheets */}
      <LeisureActivitySheet
        open={actSheet.open}
        onClose={() => setActSheet({ open: false, item: null })}
        item={actSheet.item}
        onSave={upsertActivity}
        onConvertToTask={convertToTask}
        onConvertToEvent={convertToEvent}
        members={members as any}
      />
      <LeisureRecordSheet
        open={recSheet.open}
        onClose={() => setRecSheet({ open: false, item: null })}
        item={recSheet.item}
        onSave={upsertRecord}
        members={members as any}
        activities={activities}
        defaultActivityId={recSheet.defaultActivityId}
      />
      <LeisurePlaceSheet
        open={placeSheet.open}
        onClose={() => setPlaceSheet({ open: false, item: null })}
        item={placeSheet.item}
        onSave={upsertPlace}
        members={members as any}
      />
    </div>
  )
}

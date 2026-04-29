'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { LeisureActivitySheet } from '@/components/sheets/LeisureActivitySheet'
import { LeisureRecordSheet } from '@/components/sheets/LeisureRecordSheet'
import { LeisurePlaceSheet } from '@/components/sheets/LeisurePlaceSheet'
import { useLeisureActivities } from '@/hooks/useLeisureActivities'
import { useLeisureRecords } from '@/hooks/useLeisureRecords'
import { useLeisurePlaces } from '@/hooks/useLeisurePlaces'
import { useFamilyStore } from '@/store/familyStore'
import type { LeisureActivity, LeisureRecord, LeisurePlace } from '@/types/database'

type Tab = 'ideias' | 'agenda' | 'registros' | 'lugares'

const STATUS_LABELS: Record<LeisureActivity['status'], string> = {
  wishlist: '💭 Wishlist',
  planejado: '📅 Planejado',
  realizado: '✅ Realizado',
  cancelado: '❌ Cancelado',
}

const STATUS_COLORS: Record<LeisureActivity['status'], string> = {
  wishlist: 'bg-zinc-100 text-zinc-600',
  planejado: 'bg-blue-100 text-blue-700',
  realizado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-600',
}

const PRIORITY_BADGE: Record<string, string> = {
  alta: '🔴',
  media: '🟡',
  baixa: '🟢',
}

export default function LazerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ideias')
  const { members } = useFamilyStore()

  // Hooks de dados
  const {
    items: activities, isLoading: loadingAct,
    upsert: upsertActivity, remove: removeActivity,
    cycleStatus, convertToTask, convertToEvent,
  } = useLeisureActivities()

  const {
    items: records, isLoading: loadingRec,
    upsert: upsertRecord, remove: removeRecord, monthStats,
  } = useLeisureRecords()

  const {
    items: places, isLoading: loadingPlaces,
    upsert: upsertPlace, remove: removePlace,
    toggleFavorite, incrementVisited,
  } = useLeisurePlaces()

  // Estado dos sheets
  const [activitySheet, setActivitySheet] = useState<{ open: boolean; item: LeisureActivity | null }>({ open: false, item: null })
  const [recordSheet, setRecordSheet] = useState<{ open: boolean; item: LeisureRecord | null }>({ open: false, item: null })
  const [placeSheet, setPlaceSheet] = useState<{ open: boolean; item: LeisurePlace | null }>({ open: false, item: null })

  // Filtro de público
  const [audienceFilter, setAudienceFilter] = useState<'todos' | 'adultos' | 'criancas'>('todos')

  const filteredActivities = activities.filter(a => {
    if (audienceFilter === 'adultos') return a.for_adults
    if (audienceFilter === 'criancas') return a.for_children
    return true
  })

  const stats = monthStats()

  const TABS: { id: Tab; label: string }[] = [
    { id: 'ideias', label: '💡 Ideias' },
    { id: 'agenda', label: '📅 Agenda' },
    { id: 'registros', label: '📸 Registros' },
    { id: 'lugares', label: '📍 Lugares' },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageHeader
        title="🎉 Lazer"
        subtitle="Levantamento, planejamento e registro de momentos de lazer"
        action={
          <button
            onClick={() => {
              if (activeTab === 'ideias') setActivitySheet({ open: true, item: null })
              else if (activeTab === 'registros') setRecordSheet({ open: true, item: null })
              else if (activeTab === 'lugares') setPlaceSheet({ open: true, item: null })
            }}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
          >
            + Adicionar
          </button>
        }
      />

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── ABA IDEIAS ─────────────────────────────────────── */}
        {activeTab === 'ideias' && (
          <div className="space-y-4">
            {/* Filtro público */}
            <div className="flex gap-2">
              {(['todos', 'adultos', 'criancas'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setAudienceFilter(f)}
                  className={`px-3 py-1 rounded-full text-sm border transition ${
                    audienceFilter === f
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-zinc-200 hover:border-teal-400'
                  }`}
                >
                  {f === 'todos' ? '👨‍👩‍👧 Todos' : f === 'adultos' ? '👨‍👩 Adultos' : '👶 Crianças'}
                </button>
              ))}
            </div>

            {loadingAct ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-200 animate-pulse" />)}
              </div>
            ) : filteredActivities.length === 0 ? (
              <EmptyState
                title="Nenhuma ideia de lazer ainda"
                description="Adicione atividades que sua família quer fazer!"
              />
            ) : (
              <div className="space-y-3">
                {filteredActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">{activity.emoji ?? '🎉'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-800 dark:text-zinc-100 truncate">{activity.title}</p>
                          {activity.description && (
                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{activity.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[activity.status]}`}>
                              {STATUS_LABELS[activity.status]}
                            </span>
                            <span className="text-xs">{PRIORITY_BADGE[activity.priority]}</span>
                            {activity.for_children && <span className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">👶</span>}
                            {activity.task_id && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">✅ Tarefa</span>}
                            {activity.event_id && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">📅 Agendado</span>}
                            {activity.estimated_cost && (
                              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                R$ {Number(activity.estimated_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => cycleStatus(activity)}
                          className="text-xs px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition"
                          title="Avançar status"
                        >
                          →
                        </button>
                        <button
                          onClick={() => setActivitySheet({ open: true, item: activity })}
                          className="text-xs px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => removeActivity(activity.id)}
                          className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ABA AGENDA ─────────────────────────────────────── */}
        {activeTab === 'agenda' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">Atividades com status <strong>Planejado</strong> aparecem aqui.</p>
            {activities.filter(a => a.status === 'planejado').length === 0 ? (
              <EmptyState
                title="Nenhuma atividade planejada"
                description="Vá para a aba Ideias e converta uma atividade em tarefa ou evento!"
              />
            ) : (
              <div className="space-y-3">
                {activities.filter(a => a.status === 'planejado').map(activity => (
                  <div key={activity.id} className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{activity.emoji ?? '🎉'}</span>
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <div className="flex gap-2 mt-1">
                          {activity.task_id && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">✅ Tarefa criada</span>
                          )}
                          {activity.event_id && (
                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">📅 Evento criado</span>
                          )}
                          {activity.location_name && (
                            <span className="text-xs text-zinc-500">📍 {activity.location_name}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setActivitySheet({ open: true, item: activity })}
                        className="text-xs px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ABA REGISTROS ──────────────────────────────────── */}
        {activeTab === 'registros' && (
          <div className="space-y-4">
            {/* Stats do mês */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-100 text-center">
                <p className="text-2xl font-bold text-teal-600">{stats.count}</p>
                <p className="text-xs text-zinc-500 mt-1">Lazeres esse mês</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-100 text-center">
                <p className="text-2xl font-bold text-amber-600">
                  R$ {stats.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Gasto total</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-100 text-center">
                <p className="text-2xl font-bold text-yellow-500">
                  {'⭐'.repeat(Math.round(stats.avgRating)) || '—'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Avaliação média</p>
              </div>
            </div>

            {loadingRec ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-zinc-200 animate-pulse" />)}
              </div>
            ) : records.length === 0 ? (
              <EmptyState
                title="Nenhum registro de lazer"
                description="Registre os momentos de lazer que sua família viveu!"
              />
            ) : (
              <div className="space-y-3">
                {records.map(record => (
                  <div key={record.id} className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{record.emoji ?? '📸'}</span>
                        <div>
                          <p className="font-medium">{record.title}</p>
                          <p className="text-xs text-zinc-500">
                            {new Date(record.date_realized).toLocaleDateString('pt-BR')}
                            {record.location_name && ` · 📍 ${record.location_name}`}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {record.rating && (
                              <span className="text-xs">
                                {'⭐'.repeat(record.rating)}
                              </span>
                            )}
                            {record.would_repeat && (
                              <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">🔄 Faria de novo</span>
                            )}
                            {record.cost_actual != null && (
                              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                R$ {Number(record.cost_actual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setRecordSheet({ open: true, item: record })}
                          className="text-xs px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => removeRecord(record.id)}
                          className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ABA LUGARES ────────────────────────────────────── */}
        {activeTab === 'lugares' && (
          <div className="space-y-4">
            {loadingPlaces ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-xl bg-zinc-200 animate-pulse" />)}
              </div>
            ) : places.length === 0 ? (
              <EmptyState
                title="Nenhum lugar salvo"
                description="Salve parques, praias, restaurantes e outros lugares favoritos!"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {places.map(place => (
                  <div key={place.id} className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{place.emoji ?? '📍'}</span>
                        <div>
                          <p className="font-medium">{place.name}</p>
                          {place.address && (
                            <p className="text-xs text-zinc-500 mt-0.5">{place.address}</p>
                          )}
                          <div className="flex gap-1 mt-2">
                            {place.visited_count > 0 && (
                              <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                                {place.visited_count}x visitado
                              </span>
                            )}
                            {place.maps_url && (
                              <a
                                href={place.maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-100"
                              >
                                🗺️ Maps
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <button
                          onClick={() => toggleFavorite(place)}
                          className="text-lg"
                          title={place.is_favorite ? 'Remover favorito' : 'Adicionar favorito'}
                        >
                          {place.is_favorite ? '⭐' : '☆'}
                        </button>
                        <button
                          onClick={() => {
                            incrementVisited(place)
                            setRecordSheet({ open: true, item: null })
                          }}
                          className="text-xs px-2 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition"
                        >
                          + Visita
                        </button>
                        <button
                          onClick={() => setPlaceSheet({ open: true, item: place })}
                          className="text-xs px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SHEETS ─────────────────────────────────────────── */}
      <LeisureActivitySheet
        open={activitySheet.open}
        onClose={() => setActivitySheet({ open: false, item: null })}
        item={activitySheet.item}
        onSave={upsertActivity}
        members={members}
        onConvertToTask={convertToTask}
        onConvertToEvent={convertToEvent}
      />

      <LeisureRecordSheet
        open={recordSheet.open}
        onClose={() => setRecordSheet({ open: false, item: null })}
        item={recordSheet.item}
        activities={activities}
        onSave={upsertRecord}
        members={members}
      />

      <LeisurePlaceSheet
        open={placeSheet.open}
        onClose={() => setPlaceSheet({ open: false, item: null })}
        item={placeSheet.item}
        onSave={upsertPlace}
        members={members}
      />
    </div>
  )
}

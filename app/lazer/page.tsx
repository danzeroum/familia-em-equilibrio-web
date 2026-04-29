'use client'
import { useState, useMemo } from 'react'
import { useLeisureActivities } from '@/hooks/useLeisureActivities'
import { useLeisureRecords }    from '@/hooks/useLeisureRecords'
import { useLeisurePlaces }     from '@/hooks/useLeisurePlaces'
import { useFamilyStore }       from '@/store/familyStore'
import { LeisureActivitySheet } from '@/components/sheets/LeisureActivitySheet'
import { LeisureRecordSheet }   from '@/components/sheets/LeisureRecordSheet'
import { LeisurePlaceSheet }    from '@/components/sheets/LeisurePlaceSheet'
import { PageHeader }           from '@/components/ui/PageHeader'
import { EmptyState }           from '@/components/ui/EmptyState'
import type { LeisureActivity, LeisureRecord, LeisurePlace } from '@/types/database'

type Tab = 'ideias' | 'agenda' | 'registros' | 'lugares'

const STATUS_LABELS: Record<LeisureActivity['status'], { label: string; color: string }> = {
  wishlist:  { label: '💡 Wishlist', color: 'bg-gray-100 text-gray-700' },
  planejado: { label: '📅 Planejado', color: 'bg-blue-100 text-blue-700' },
  realizado: { label: '✅ Realizado', color: 'bg-green-100 text-green-700' },
  cancelado: { label: '❌ Cancelado', color: 'bg-red-100 text-red-700' },
}

const PRIORITY_BADGE: Record<string, string> = {
  alta:  '🔴',
  media: '🟡',
  baixa: '🟢',
}

export default function LazerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ideias')

  // Hooks de dados
  const activities = useLeisureActivities()
  const records    = useLeisureRecords()
  const places     = useLeisurePlaces()
  const { members } = useFamilyStore()

  // Sheet states
  const [activitySheet, setActivitySheet]  = useState<{ open: boolean; item: LeisureActivity | null }>({ open: false, item: null })
  const [recordSheet, setRecordSheet]      = useState<{ open: boolean; item: LeisureRecord | null }>({ open: false, item: null })
  const [placeSheet, setPlaceSheet]        = useState<{ open: boolean; item: LeisurePlace | null }>({ open: false, item: null })

  // Filtros aba Ideias
  const [audienceFilter, setAudienceFilter] = useState<'todos' | 'adultos' | 'criancas'>('todos')
  const [statusFilter, setStatusFilter]     = useState<LeisureActivity['status'] | 'todos'>('todos')

  // Filtros aba Registros
  const [memberFilter, setMemberFilter] = useState<string>('todos')

  // Filtros aba Lugares
  const [placeCategory, setPlaceCategory] = useState<string>('todos')

  // Stats do mês para aba Registros
  const stats = useMemo(() => records.statsThisMonth(), [records.items])

  const filteredActivities = useMemo(() => {
    let list = activities.items
    if (audienceFilter === 'adultos')  list = list.filter((a) => a.for_adults)
    if (audienceFilter === 'criancas') list = list.filter((a) => a.for_children)
    if (statusFilter !== 'todos')      list = list.filter((a) => a.status === statusFilter)
    return list
  }, [activities.items, audienceFilter, statusFilter])

  const filteredRecords = useMemo(() => {
    if (memberFilter === 'todos') return records.items
    return records.items.filter((r) => r.participants.includes(memberFilter))
  }, [records.items, memberFilter])

  const filteredPlaces = useMemo(() => {
    if (placeCategory === 'todos') return places.items
    return places.items.filter((p) => p.category === placeCategory)
  }, [places.items, placeCategory])

  // Conta atividades wishlist para badge
  const wishlistCount = activities.items.filter((a) => a.status === 'wishlist').length

  const TABS = [
    { id: 'ideias' as Tab,    label: '💡 Ideias',    badge: wishlistCount },
    { id: 'agenda' as Tab,    label: '📅 Agenda',    badge: 0 },
    { id: 'registros' as Tab, label: '📸 Registros', badge: 0 },
    { id: 'lugares' as Tab,   label: '📍 Lugares',   badge: 0 },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageHeader
        title="🎉 Lazer"
        description="Planejamento e registro de momentos de lazer em família"
        action={{
          label: '+ Novo',
          onClick: () => {
            if (activeTab === 'ideias')    setActivitySheet({ open: true, item: null })
            if (activeTab === 'registros') setRecordSheet({ open: true, item: null })
            if (activeTab === 'lugares')   setPlaceSheet({ open: true, item: null })
          },
        }}
      />

      {/* Abas */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span className="ml-1 bg-teal-100 text-teal-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ═══════════════════════════════════════════════════════
            ABA: IDEIAS
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'ideias' && (
          <div>
            {/* Filtros */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(['todos', 'adultos', 'criancas'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setAudienceFilter(f)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    audienceFilter === f
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-gray-300 hover:border-teal-400'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f === 'adultos' ? '👤 Adultos' : '👶 Crianças'}
                </button>
              ))}
              <div className="w-px bg-gray-200 mx-1" />
              {(['todos', 'wishlist', 'planejado', 'realizado', 'cancelado'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    statusFilter === s
                      ? 'bg-gray-700 text-white border-gray-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {s === 'todos' ? 'Todos status' : STATUS_LABELS[s]?.label}
                </button>
              ))}
            </div>

            {activities.isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <EmptyState
                icon="🎉"
                title="Nenhuma atividade ainda"
                description="Adicione ideias de lazer para a família"
                action={{ label: '+ Adicionar ideia', onClick: () => setActivitySheet({ open: true, item: null }) }}
              />
            ) : (
              <div className="space-y-3">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{activity.emoji ?? '🎉'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{activity.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABELS[activity.status]?.color}`}>
                            {STATUS_LABELS[activity.status]?.label}
                          </span>
                          <span className="text-xs" title={activity.priority}>
                            {PRIORITY_BADGE[activity.priority]}
                          </span>
                          {activity.for_children && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">👶</span>}
                          {activity.for_adults && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">👤</span>}
                        </div>
                        {activity.description && (
                          <p className="text-sm text-gray-500 mt-0.5 truncate">{activity.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {activity.estimated_cost != null && (
                            <span className="text-xs text-gray-400">R$ {activity.estimated_cost.toFixed(2)}</span>
                          )}
                          {activity.location_name && (
                            <span className="text-xs text-gray-400">📍 {activity.location_name}</span>
                          )}
                          {activity.task_id && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">✅ Tarefa</span>
                          )}
                          {activity.event_id && (
                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">📅 Evento</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {/* Status cycle */}
                        <button
                          onClick={() => activities.cycleStatus(activity)}
                          title="Avançar status"
                          className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          ▶
                        </button>
                        <button
                          onClick={() => setActivitySheet({ open: true, item: activity })}
                          className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => activities.remove(activity.id)}
                          className="text-xs px-2 py-1 border border-red-100 text-red-400 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            ABA: AGENDA
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'agenda' && (
          <div>
            <p className="text-gray-500 text-sm mb-4">
              Atividades planejadas e eventos de lazer agendados.
            </p>
            {(() => {
              const planejados = activities.items.filter((a) => a.status === 'planejado')
              if (planejados.length === 0) {
                return (
                  <EmptyState
                    icon="📅"
                    title="Nenhuma atividade planejada"
                    description="Acesse a aba Ideias e planeje uma atividade para ela aparecer aqui"
                  />
                )
              }
              return (
                <div className="space-y-3">
                  {planejados.map((activity) => (
                    <div
                      key={activity.id}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-blue-100 dark:border-blue-900/40 p-4 flex gap-3"
                    >
                      <span className="text-2xl">{activity.emoji ?? '🎉'}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold">{activity.title}</h3>
                        {activity.location_name && (
                          <p className="text-sm text-gray-500">📍 {activity.location_name}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          {activity.task_id && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">✅ Tarefa criada</span>
                          )}
                          {activity.event_id && (
                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">📅 Evento criado</span>
                          )}
                          {!activity.task_id && (
                            <button
                              onClick={() => activities.convertToTask(activity)}
                              className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
                            >
                              ⚡ Virar tarefa
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => activities.updateStatus(activity.id, 'realizado')}
                        className="self-center text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        Realizado ✅
                      </button>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            ABA: REGISTROS
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'registros' && (
          <div>
            {/* Stats do mês */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
                <p className="text-2xl font-bold text-teal-600">{stats.count}</p>
                <p className="text-xs text-gray-500">lazeres este mês</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
                <p className="text-2xl font-bold text-teal-600">
                  R$ {stats.totalCost.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500">gasto este mês</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
                <p className="text-2xl font-bold text-yellow-500">
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-gray-500">avaliação média</p>
              </div>
            </div>

            {/* Filtro por membro */}
            {members.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setMemberFilter('todos')}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    memberFilter === 'todos' ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300'
                  }`}
                >
                  Todos
                </button>
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMemberFilter(m.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      memberFilter === m.id ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300'
                    }`}
                  >
                    {m.emoji ?? '👤'} {m.nickname ?? m.name}
                  </button>
                ))}
              </div>
            )}

            {records.isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-xl" />)}
              </div>
            ) : filteredRecords.length === 0 ? (
              <EmptyState
                icon="📸"
                title="Nenhum registro ainda"
                description="Registre os momentos de lazer da família"
                action={{ label: '+ Registrar lazer', onClick: () => setRecordSheet({ open: true, item: null }) }}
              />
            ) : (
              <div className="space-y-3">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{record.emoji ?? '📸'}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{record.title}</h3>
                          {record.would_repeat && (
                            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">🔄 Faria de novo</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(record.date_realized).toLocaleDateString('pt-BR')}
                          {record.location_name && ` • 📍 ${record.location_name}`}
                          {record.cost_actual != null && ` • R$ ${record.cost_actual.toFixed(2)}`}
                        </p>
                        {record.rating && (
                          <p className="text-sm mt-1">
                            {''.repeat(record.rating)}{''.repeat(5 - record.rating)}
                          </p>
                        )}
                        {record.participants.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {record.participants.map((pid) => {
                              const m = members.find((mem) => mem.id === pid)
                              return m ? (
                                <span key={pid} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                  {m.emoji ?? '👤'} {m.nickname ?? m.name}
                                </span>
                              ) : null
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setRecordSheet({ open: true, item: record })}
                          className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => records.remove(record.id)}
                          className="text-xs px-2 py-1 border border-red-100 text-red-400 rounded-lg hover:bg-red-50"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            ABA: LUGARES
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'lugares' && (
          <div>
            {/* Filtro por categoria */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['todos', 'parque', 'praia', 'restaurante', 'cinema', 'teatro', 'museu', 'esporte', 'viagem', 'clube', 'outros'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPlaceCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    placeCategory === cat
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-gray-300 hover:border-teal-400'
                  }`}
                >
                  {cat === 'todos' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {places.isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map((i) => <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />)}
              </div>
            ) : filteredPlaces.length === 0 ? (
              <EmptyState
                icon="📍"
                title="Nenhum lugar salvo"
                description="Salve lugares favoritos para consultar depois"
                action={{ label: '+ Adicionar lugar', onClick: () => setPlaceSheet({ open: true, item: null }) }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="text-xl">{place.emoji ?? '📍'}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{place.name}</h3>
                          {place.address && (
                            <p className="text-xs text-gray-500 truncate">{place.address}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {place.category && (
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full capitalize">{place.category}</span>
                            )}
                            {place.visited_count > 0 && (
                              <span className="text-xs text-gray-400">👣 {place.visited_count}x</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => places.toggleFavorite(place)}
                        className="text-lg transition-transform hover:scale-110"
                        title={place.is_favorite ? 'Remover favorito' : 'Adicionar favorito'}
                      >
                        {place.is_favorite ? '⭐' : '☆'}
                      </button>
                    </div>

                    <div className="flex gap-2 mt-3 flex-wrap">
                      {place.maps_url && (
                        <a
                          href={place.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          🗺️ Maps
                        </a>
                      )}
                      {place.website_url && (
                        <a
                          href={place.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          🌐 Site
                        </a>
                      )}
                      <button
                        onClick={() => {
                          places.incrementVisited(place)
                          setRecordSheet({
                            open: true,
                            item: {
                              id: '',
                              family_id: '',
                              activity_id: null,
                              title: `Visita: ${place.name}`,
                              description: null,
                              date_realized: new Date().toISOString().split('T')[0],
                              emoji: place.emoji,
                              rating: null,
                              participants: [],
                              cost_actual: null,
                              location_name: place.name,
                              notes: null,
                              would_repeat: true,
                              created_at: '',
                            },
                          })
                        }}
                        className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-lg hover:bg-teal-100 transition-colors"
                      >
                        👣 Fui!
                      </button>
                      <button
                        onClick={() => setPlaceSheet({ open: true, item: place })}
                        className="text-xs border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
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
      </div>

      {/* ═══════════════ SHEETS ═══════════════ */}
      <LeisureActivitySheet
        open={activitySheet.open}
        onClose={() => setActivitySheet({ open: false, item: null })}
        item={activitySheet.item}
        onSave={activities.upsert}
        members={members}
        onConvertToTask={activities.convertToTask}
        onConvertToEvent={activities.convertToEvent}
      />

      <LeisureRecordSheet
        open={recordSheet.open}
        onClose={() => setRecordSheet({ open: false, item: null })}
        item={recordSheet.item}
        onSave={records.upsert}
        members={members}
      />

      <LeisurePlaceSheet
        open={placeSheet.open}
        onClose={() => setPlaceSheet({ open: false, item: null })}
        item={placeSheet.item}
        onSave={places.upsert}
        members={members}
      />
    </div>
  )
}

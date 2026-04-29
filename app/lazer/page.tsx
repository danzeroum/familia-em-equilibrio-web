'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLeisureActivities } from '@/hooks/useLeisureActivities'
import { useLeisureRecords } from '@/hooks/useLeisureRecords'
import { useLeisurePlaces } from '@/hooks/useLeisurePlaces'
import { LeisureActivitySheet } from '@/components/sheets/LeisureActivitySheet'
import { LeisureRecordSheet } from '@/components/sheets/LeisureRecordSheet'
import { LeisurePlaceSheet } from '@/components/sheets/LeisurePlaceSheet'
import { useFamilyStore } from '@/store/familyStore'
import type { LeisureActivity, LeisureRecord, LeisurePlace } from '@/types/database'

type Tab = 'ideias' | 'agenda' | 'registros' | 'lugares'

const STATUS_LABELS: Record<LeisureActivity['status'], { label: string; color: string; dot: string }> = {
  wishlist:  { label: 'Wishlist',  color: 'bg-zinc-100 text-zinc-700',     dot: '⚪' },
  planejado: { label: 'Planejado', color: 'bg-blue-50 text-blue-700',      dot: '🔵' },
  realizado: { label: 'Realizado', color: 'bg-green-50 text-green-700',    dot: '🟢' },
  cancelado: { label: 'Cancelado', color: 'bg-red-50 text-red-600',        dot: '🔴' },
}

const PRIORITY_BADGE: Record<LeisureActivity['priority'], string> = {
  alta:  '🔴',
  media: '🟡',
  baixa: '🟢',
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getWeekDates() {
  const now = new Date()
  const day = now.getDay()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - day + i)
    return d
  })
}

export default function LazerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ideias')
  const [filterAudience, setFilterAudience] = useState<'all' | 'adults' | 'children'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPlaceCategory, setFilterPlaceCategory] = useState<string>('all')

  // Activity sheet
  const [activitySheet, setActivitySheet] = useState(false)
  const [editingActivity, setEditingActivity] = useState<LeisureActivity | null>(null)

  // Record sheet
  const [recordSheet, setRecordSheet] = useState(false)
  const [editingRecord, setEditingRecord] = useState<LeisureRecord | null>(null)
  const [prefillFromPlace, setPrefillFromPlace] = useState<Partial<LeisureRecord> | null>(null)

  // Place sheet
  const [placeSheet, setPlaceSheet] = useState(false)
  const [editingPlace, setEditingPlace] = useState<LeisurePlace | null>(null)

  const { members } = useFamilyStore()
  const activities = useLeisureActivities()
  const records = useLeisureRecords()
  const places = useLeisurePlaces()

  const stats = records.statsThisMonth()
  const weekDates = getWeekDates()

  // Filtered activities
  const filteredActivities = activities.items.filter(a => {
    if (filterAudience === 'adults' && !a.for_adults) return false
    if (filterAudience === 'children' && !a.for_children) return false
    if (filterCategory !== 'all' && a.category !== filterCategory) return false
    return true
  })

  const wishlist  = filteredActivities.filter(a => a.status === 'wishlist')
  const planejado = filteredActivities.filter(a => a.status === 'planejado')
  const realizado = filteredActivities.filter(a => a.status === 'realizado')
  const cancelado = filteredActivities.filter(a => a.status === 'cancelado')

  return (
    <div className="min-h-screen bg-zinc-50">
      <PageHeader
        title="🎉 Lazer"
        subtitle="Planeje, registre e curta momentos em família"
        action={
          <button
            onClick={() => {
              if (activeTab === 'ideias')    { setEditingActivity(null); setActivitySheet(true) }
              if (activeTab === 'registros') { setEditingRecord(null);   setRecordSheet(true)   }
              if (activeTab === 'lugares')   { setEditingPlace(null);    setPlaceSheet(true)    }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm hover:bg-teal-700 transition-colors"
          >
            + Adicionar
          </button>
        }
      />

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b px-4">
        <div className="flex gap-1 max-w-4xl mx-auto overflow-x-auto">
          {([
            { id: 'ideias',    label: '💡 Ideias',    count: activities.items.filter(a => a.status === 'wishlist').length },
            { id: 'agenda',    label: '📅 Agenda',    count: 0 },
            { id: 'registros', label: '📸 Registros', count: records.items.length },
            { id: 'lugares',   label: '📍 Lugares',   count: places.items.length },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">

        {/* ───── ABA IDEIAS ───── */}
        {activeTab === 'ideias' && (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex bg-white border rounded-xl overflow-hidden">
                {(['all', 'adults', 'children'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setFilterAudience(v)}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      filterAudience === v ? 'bg-teal-600 text-white' : 'text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {v === 'all' ? '👨‍👩‍👧 Todos' : v === 'adults' ? '👨 Adultos' : '👦 Crianças'}
                  </button>
                ))}
              </div>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="border rounded-xl px-3 py-1.5 text-xs bg-white"
              >
                <option value="all">Todas categorias</option>
                {['passeio','viagem','esporte','cultura','entretenimento','natureza','social','educativo','outros'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            {filteredActivities.length === 0 ? (
              <EmptyState
                icon="🎉"
                title="Nenhuma atividade ainda"
                description="Adicione ideias de passeios, viagens e diversão para a família!"
              />
            ) : (
              <div className="space-y-6">
                {([['wishlist', wishlist], ['planejado', planejado], ['realizado', realizado], ['cancelado', cancelado]] as [LeisureActivity['status'], LeisureActivity[]][]).map(
                  ([status, group]) => group.length === 0 ? null : (
                    <div key={status}>
                      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        {STATUS_LABELS[status].dot} {STATUS_LABELS[status].label} ({group.length})
                      </h3>
                      <div className="space-y-2">
                        {group.map(activity => (
                          <div
                            key={activity.id}
                            className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span className="text-2xl shrink-0">{activity.emoji ?? '🎉'}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm truncate">{activity.title}</span>
                                    <span className="text-xs">{PRIORITY_BADGE[activity.priority]}</span>
                                    {activity.for_children && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">👦 Crianças</span>}
                                    {activity.task_id && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">✅ Tarefa</span>}
                                    {activity.event_id && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">📅 Agendado</span>}
                                  </div>
                                  {activity.description && (
                                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{activity.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    {activity.estimated_cost && (
                                      <span className="text-xs text-zinc-400">💰 R$ {activity.estimated_cost}</span>
                                    )}
                                    {activity.duration_hours && (
                                      <span className="text-xs text-zinc-400">⏱ {activity.duration_hours}h</span>
                                    )}
                                    {activity.location_name && (
                                      <span className="text-xs text-zinc-400">📍 {activity.location_name}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {/* Status cycle */}
                                <button
                                  onClick={() => activities.cycleStatus(activity)}
                                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                                    STATUS_LABELS[activity.status].color
                                  }`}
                                  title="Clique para avançar status"
                                >
                                  {STATUS_LABELS[activity.status].label}
                                </button>
                                <button
                                  onClick={() => { setEditingActivity(activity); setActivitySheet(true) }}
                                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => activities.remove(activity.id)}
                                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* ───── ABA AGENDA ───── */}
        {activeTab === 'agenda' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">Semana atual — atividades planejadas por dia</p>
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
              {weekDates.map((date, i) => {
                const dateStr = date.toISOString().split('T')[0]
                const isToday = date.toDateString() === new Date().toDateString()
                const dayActivities = activities.items.filter(
                  a => a.status === 'planejado' && a.updated_at?.startsWith(dateStr)
                )
                return (
                  <div
                    key={i}
                    className={`bg-white rounded-xl border p-3 min-h-[120px] ${
                      isToday ? 'border-teal-400 ring-1 ring-teal-200' : ''
                    }`}
                  >
                    <div className={`text-xs font-semibold mb-2 ${
                      isToday ? 'text-teal-600' : 'text-zinc-500'
                    }`}>
                      {WEEK_DAYS[i]}
                      <span className={`ml-1 text-base ${
                        isToday ? 'text-teal-700 font-bold' : 'text-zinc-700'
                      }`}>
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayActivities.map(a => (
                        <div key={a.id} className="text-xs bg-teal-50 text-teal-700 rounded-lg px-2 py-1 truncate">
                          {a.emoji} {a.title}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => { setEditingActivity(null); setActivitySheet(true) }}
                      className="mt-2 w-full text-xs text-zinc-400 hover:text-teal-600 text-left"
                    >
                      + adicionar
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ───── ABA REGISTROS ───── */}
        {activeTab === 'registros' && (
          <div className="space-y-4">
            {/* Stats do mês */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border p-3 text-center">
                <p className="text-2xl font-bold text-teal-600">{stats.count}</p>
                <p className="text-xs text-zinc-500 mt-0.5">este mês</p>
              </div>
              <div className="bg-white rounded-xl border p-3 text-center">
                <p className="text-2xl font-bold text-teal-600">
                  {stats.totalCost > 0 ? `R$${stats.totalCost.toFixed(0)}` : '—'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">gasto total</p>
              </div>
              <div className="bg-white rounded-xl border p-3 text-center">
                <p className="text-2xl font-bold text-teal-600">
                  {stats.avgRating > 0 ? `${stats.avgRating}⭐` : '—'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">média rating</p>
              </div>
            </div>

            {records.items.length === 0 ? (
              <EmptyState
                icon="📸"
                title="Nenhum registro ainda"
                description="Registre os momentos de lazer que a família já curtiu!"
              />
            ) : (
              <div className="space-y-3">
                {records.items.map(record => {
                  const participantProfiles = members.filter(m => record.participants?.includes(m.id))
                  return (
                    <div key={record.id} className="bg-white rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-2xl">{record.emoji ?? '📸'}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{record.title}</span>
                              {record.would_repeat && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">🔄 Repetiria</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-xs text-zinc-400">📅 {record.date_realized}</span>
                              {record.rating && <span className="text-xs">{Array(record.rating).fill('⭐').join('')}</span>}
                              {record.cost_actual && <span className="text-xs text-zinc-400">💰 R$ {record.cost_actual}</span>}
                              {record.location_name && <span className="text-xs text-zinc-400">📍 {record.location_name}</span>}
                            </div>
                            {participantProfiles.length > 0 && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {participantProfiles.map(m => (
                                  <span key={m.id} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                                    {m.nickname ?? m.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => { setEditingRecord(record); setRecordSheet(true) }}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => records.remove(record.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
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

        {/* ───── ABA LUGARES ───── */}
        {activeTab === 'lugares' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterPlaceCategory}
                onChange={e => setFilterPlaceCategory(e.target.value)}
                className="border rounded-xl px-3 py-1.5 text-xs bg-white"
              >
                <option value="all">Todas categorias</option>
                {['parque','praia','restaurante','cinema','teatro','museu','esporte','viagem','clube','outros'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            {places.items.length === 0 ? (
              <EmptyState
                icon="📍"
                title="Nenhum lugar salvo"
                description="Salve parques, praias, restaurantes e lugares favoritos da família!"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {places.items
                  .filter(p => filterPlaceCategory === 'all' || p.category === filterPlaceCategory)
                  .map(place => (
                    <div key={place.id} className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-2xl">{place.emoji ?? '📍'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-sm truncate">{place.name}</span>
                              {place.is_favorite && <span title="Favorito">⭐</span>}
                            </div>
                            {place.address && <p className="text-xs text-zinc-400 mt-0.5 truncate">{place.address}</p>}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {place.maps_url && (
                                <a href={place.maps_url} target="_blank" rel="noopener noreferrer"
                                  className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-100">
                                  🗺️ Maps
                                </a>
                              )}
                              {place.website_url && (
                                <a href={place.website_url} target="_blank" rel="noopener noreferrer"
                                  className="text-xs bg-zinc-50 text-zinc-600 px-2 py-1 rounded-lg hover:bg-zinc-100">
                                  🌐 Site
                                </a>
                              )}
                              <button
                                onClick={() => {
                                  places.incrementVisited(place)
                                  setPrefillFromPlace({ location_name: place.name, emoji: place.emoji ?? '📍' })
                                  setEditingRecord(null)
                                  setRecordSheet(true)
                                }}
                                className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-lg hover:bg-teal-100"
                              >
                                ✅ Marcar visita
                              </button>
                            </div>
                            {(place.visited_count ?? 0) > 0 && (
                              <p className="text-xs text-zinc-400 mt-1">{place.visited_count}× visitado</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => places.toggleFavorite(place)}
                            className="p-1.5 hover:scale-110 transition-transform"
                            title={place.is_favorite ? 'Remover favorito' : 'Favoritar'}
                          >
                            {place.is_favorite ? '⭐' : '☆'}
                          </button>
                          <button
                            onClick={() => { setEditingPlace(place); setPlaceSheet(true) }}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => places.remove(place.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
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

      </div>

      {/* Sheets */}
      <LeisureActivitySheet
        open={activitySheet}
        onClose={() => { setActivitySheet(false); setEditingActivity(null) }}
        item={editingActivity}
        onSave={activities.upsert}
        members={members}
        onConvertToTask={activities.convertToTask}
        onConvertToEvent={activities.convertToEvent}
      />

      <LeisureRecordSheet
        open={recordSheet}
        onClose={() => { setRecordSheet(false); setEditingRecord(null); setPrefillFromPlace(null) }}
        item={editingRecord ?? (prefillFromPlace ? { ...prefillFromPlace } as LeisureRecord : null)}
        onSave={records.upsert}
        members={members}
        activities={activities.items}
      />

      <LeisurePlaceSheet
        open={placeSheet}
        onClose={() => { setPlaceSheet(false); setEditingPlace(null) }}
        item={editingPlace}
        onSave={places.upsert}
        members={members}
      />
    </div>
  )
}

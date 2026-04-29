'use client'
import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useLeisureActivities } from '@/hooks/useLeisureActivities'
import { useLeisureRecords } from '@/hooks/useLeisureRecords'
import { useLeisurePlaces } from '@/hooks/useLeisurePlaces'
import { LeisureActivitySheet } from '@/components/sheets/LeisureActivitySheet'
import { LeisureRecordSheet } from '@/components/sheets/LeisureRecordSheet'
import { LeisurePlaceSheet } from '@/components/sheets/LeisurePlaceSheet'
import type { LeisureActivity, LeisureRecord, LeisurePlace, LeisureCategory, LeisurePlaceCategory } from '@/types/database'

type Tab = 'ideias' | 'agenda' | 'registros' | 'lugares'

const STATUS_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  wishlist:  { label: 'Wishlist',  color: 'bg-zinc-100 text-zinc-600',      emoji: '📝' },
  planejado: { label: 'Planejado', color: 'bg-blue-50 text-blue-700',       emoji: '📌' },
  realizado: { label: 'Realizado', color: 'bg-green-50 text-green-700',     emoji: '✅' },
  cancelado: { label: 'Cancelado', color: 'bg-red-50 text-red-500',         emoji: '❌' },
}

const PRIORITY_DOT: Record<string, string> = {
  alta:  'bg-red-500',
  media: 'bg-yellow-400',
  baixa: 'bg-green-500',
}

const CATEGORY_EMOJI: Record<string, string> = {
  passeio: '🏞️', viagem: '✈️', esporte: '⚽', cultura: '🎨',
  entretenimento: '🎬', natureza: '🌳', social: '👥', educativo: '📚', outros: '🎉',
}

const PLACE_CATEGORY_EMOJI: Record<string, string> = {
  parque: '🌳', praia: '🏖️', restaurante: '🍽️', cinema: '🎥',
  teatro: '🎭', museu: '🏛️', esporte: '🏋️', viagem: '✈️', clube: '🏢', outros: '📍',
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getWeekDates(): Date[] {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function fmt(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default function LazerPage() {
  const { members } = useFamilyStore()
  const activities = useLeisureActivities()
  const records    = useLeisureRecords()
  const places     = useLeisurePlaces()

  const [activeTab, setActiveTab] = useState<Tab>('ideias')

  // Sheet states
  const [activitySheet, setActivitySheet] = useState<{ open: boolean; item: LeisureActivity | null }>({
    open: false, item: null
  })
  const [recordSheet, setRecordSheet] = useState<{ open: boolean; item: LeisureRecord | null }>({
    open: false, item: null
  })
  const [placeSheet, setPlaceSheet] = useState<{ open: boolean; item: LeisurePlace | null }>({
    open: false, item: null
  })

  // Filters
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'adults' | 'children'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [placeCategoryFilter, setPlaceCategoryFilter] = useState<string>('all')

  // Computed
  const wishlistCount = activities.items.filter(a => a.status === 'wishlist').length
  const weekDates = getWeekDates()
  const { count: recCount, totalCost: recCost, avgRating } = records.statsThisMonth

  const filteredActivities = activities.items.filter(a => {
    if (audienceFilter === 'adults' && !a.for_adults) return false
    if (audienceFilter === 'children' && !a.for_children) return false
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    return true
  })

  const filteredPlaces = places.items.filter(p =>
    placeCategoryFilter === 'all' || p.category === placeCategoryFilter
  )

  const activitiesOnDay = (date: Date) =>
    activities.items.filter(a => {
      if (a.status !== 'planejado') return false
      return true // TODO: conectar com event_date quando event_id existir
    })

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'ideias',    label: '💡 Ideias',    badge: wishlistCount > 0 ? wishlistCount : undefined },
    { id: 'agenda',   label: '📅 Agenda' },
    { id: 'registros',label: '📸 Registros' },
    { id: 'lugares',  label: '📍 Lugares' },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">🎉 Lazer</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Planejamento e registro de momentos em família</p>
            </div>
            <button
              onClick={() => setActivitySheet({ open: true, item: null })}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              + Nova Atividade
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {tab.label}
                {tab.badge != null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── ABA: IDEIAS ── */}
        {activeTab === 'ideias' && (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
                {(['all', 'adults', 'children'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setAudienceFilter(f)}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      audienceFilter === f ? 'bg-teal-600 text-white' : 'hover:bg-zinc-50'
                    }`}
                  >
                    {f === 'all' ? 'Todos' : f === 'adults' ? '👍 Adultos' : '👶 Crianças'}
                  </button>
                ))}
              </div>
              <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
                {(['all', 'wishlist', 'planejado', 'realizado'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      statusFilter === s ? 'bg-teal-600 text-white' : 'hover:bg-zinc-50'
                    }`}
                  >
                    {s === 'all' ? 'Todos' : STATUS_LABELS[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards */}
            {activities.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-zinc-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-zinc-100 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🎉</p>
                <p className="font-medium text-zinc-700 dark:text-zinc-300">Nenhuma atividade ainda</p>
                <p className="text-sm text-zinc-500 mt-1">Adicione ideias de lazer para a família!</p>
                <button
                  onClick={() => setActivitySheet({ open: true, item: null })}
                  className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
                >
                  + Adicionar Ideia
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredActivities.map(activity => {
                  const st = STATUS_LABELS[activity.status]
                  return (
                    <div
                      key={activity.id}
                      className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="text-2xl mt-0.5 flex-shrink-0">
                            {activity.emoji || CATEGORY_EMOJI[activity.category ?? 'outros'] || '🎉'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {activity.title}
                            </p>
                            {activity.description && (
                              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{activity.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {/* Status badge - clicável para ciclar */}
                              <button
                                onClick={() => activities.cycleStatus(activity)}
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}
                              >
                                {st.emoji} {st.label}
                              </button>
                              {/* Prioridade */}
                              <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[activity.priority]}`} title={`Prioridade ${activity.priority}`} />
                              {/* Para quem */}
                              {activity.for_children && <span className="text-xs">👶</span>}
                              {activity.for_adults && <span className="text-xs">👍</span>}
                              {/* Custo estimado */}
                              {activity.estimated_cost != null && (
                                <span className="text-xs text-zinc-400">
                                  R$ {activity.estimated_cost.toFixed(0)}
                                </span>
                              )}
                            </div>
                            {/* Badges de conversão */}
                            <div className="flex gap-1 mt-1.5">
                              {activity.task_id && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">✅ Tarefa</span>
                              )}
                              {activity.event_id && (
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">📅 Agendado</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Ações */}
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            onClick={() => setActivitySheet({ open: true, item: activity })}
                            className="p-1.5 text-zinc-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          {!activity.task_id && (
                            <button
                              onClick={() => activities.convertToTask(activity)}
                              className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Virar tarefa"
                            >
                              ⚡
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Remover atividade?')) activities.remove(activity.id)
                            }}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover"
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

        {/* ── ABA: AGENDA ── */}
        {activeTab === 'agenda' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-zinc-700 dark:text-zinc-300">Esta semana</h2>
              <button
                onClick={() => setActivitySheet({ open: true, item: null })}
                className="text-sm text-teal-600 hover:underline"
              >
                + Planejar atividade
              </button>
            </div>

            {/* Grade semanal */}
            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((date, i) => {
                const isToday = fmt(date) === fmt(new Date())
                const dayActivities = activities.items.filter(a =>
                  a.status === 'planejado'
                )
                return (
                  <div
                    key={i}
                    className={`rounded-xl p-2 min-h-[100px] border transition-colors ${
                      isToday
                        ? 'bg-teal-50 border-teal-200 dark:bg-teal-950 dark:border-teal-800'
                        : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'
                    }`}
                  >
                    <div className={`text-center mb-1 ${
                      isToday ? 'text-teal-700 dark:text-teal-300' : 'text-zinc-500'
                    }`}>
                      <p className="text-xs font-medium">{DAYS[i]}</p>
                      <p className={`text-sm font-bold ${
                        isToday ? 'text-teal-600' : 'text-zinc-700 dark:text-zinc-300'
                      }`}>
                        {date.getDate()}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      {dayActivities.slice(0, 2).map(a => (
                        <div
                          key={a.id}
                          className="text-xs bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 rounded px-1 py-0.5 truncate"
                        >
                          {a.emoji} {a.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Atividades planejadas */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">Atividades Planejadas</h3>
              {activities.items.filter(a => a.status === 'planejado').length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-sm">Nenhuma atividade planejada ainda.</p>
                  <p className="text-xs mt-1">Vire uma ideia em atividade planejada na aba Ideias.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activities.items.filter(a => a.status === 'planejado').map(a => (
                    <div key={a.id} className="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800">
                      <span className="text-xl">{a.emoji || '🎉'}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{a.title}</p>
                        {a.location_name && <p className="text-xs text-zinc-400">📍 {a.location_name}</p>}
                      </div>
                      <div className="flex gap-1">
                        {a.event_id && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">📅</span>}
                        {a.task_id  && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">⚡</span>}
                      </div>
                      <button
                        onClick={() => activities.updateStatus(a.id, 'realizado')}
                        className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                      >
                        Feito ✅
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ABA: REGISTROS ── */}
        {activeTab === 'registros' && (
          <div className="space-y-4">
            {/* Stats do mês */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 text-center">
                <p className="text-2xl font-bold text-teal-600">{recCount}</p>
                <p className="text-xs text-zinc-500 mt-1">Lazeres este mês</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 text-center">
                <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                  {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">⭐ Média rating</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 text-center">
                <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                  {recCost > 0 ? `R$${recCost.toFixed(0)}` : '—'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Gasto total</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="font-medium text-zinc-700 dark:text-zinc-300">Histórico</h2>
              <button
                onClick={() => setRecordSheet({ open: true, item: null })}
                className="text-sm px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                + Registrar
              </button>
            </div>

            {records.isLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-zinc-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-zinc-100 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : records.items.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📸</p>
                <p className="font-medium text-zinc-700 dark:text-zinc-300">Nenhum registro ainda</p>
                <p className="text-sm text-zinc-500 mt-1">Registre os momentos de lazer da família!</p>
                <button
                  onClick={() => setRecordSheet({ open: true, item: null })}
                  className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
                >
                  + Registrar Lazer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {records.items.map(record => {
                  const participantNames = (record.participants ?? []).map(pid => {
                    const m = members.find(m => m.id === pid)
                    return m?.nickname ?? m?.name.split(' ')[0] ?? ''
                  }).filter(Boolean)
                  return (
                    <div
                      key={record.id}
                      className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{record.emoji || '📸'}</span>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">{record.title}</p>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setRecordSheet({ open: true, item: record })}
                                className="p-1 text-zinc-400 hover:text-teal-600 rounded"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => { if (confirm('Remover registro?')) records.remove(record.id) }}
                                className="p-1 text-zinc-400 hover:text-red-500 rounded"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-400">
                              {new Date(record.date_realized).toLocaleDateString('pt-BR')}
                            </span>
                            {record.rating != null && (
                              <span className="text-xs text-yellow-500">
                                {'\u2605'.repeat(record.rating)}{'\u2606'.repeat(5 - record.rating)}
                              </span>
                            )}
                            {record.would_repeat && (
                              <span className="text-xs bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded">🔄 Repetiria</span>
                            )}
                            {record.cost_actual != null && (
                              <span className="text-xs text-zinc-400">R$ {record.cost_actual.toFixed(0)}</span>
                            )}
                          </div>
                          {participantNames.length > 0 && (
                            <p className="text-xs text-zinc-500 mt-1">
                              👥 {participantNames.join(', ')}
                            </p>
                          )}
                          {record.location_name && (
                            <p className="text-xs text-zinc-400 mt-0.5">📍 {record.location_name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ABA: LUGARES ── */}
        {activeTab === 'lugares' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-1 overflow-x-auto">
                {['all', 'parque', 'praia', 'restaurante', 'cinema', 'teatro', 'esporte', 'clube'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setPlaceCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      placeCategoryFilter === cat
                        ? 'bg-teal-600 text-white'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-teal-400'
                    }`}
                  >
                    {cat === 'all' ? 'Todos' : `${PLACE_CATEGORY_EMOJI[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPlaceSheet({ open: true, item: null })}
                className="flex-shrink-0 text-sm px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 ml-2"
              >
                + Lugar
              </button>
            </div>

            {places.isLoading ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-zinc-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-zinc-100 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📍</p>
                <p className="font-medium text-zinc-700 dark:text-zinc-300">Nenhum lugar salvo</p>
                <p className="text-sm text-zinc-500 mt-1">Salve seus lugares favoritos!</p>
                <button
                  onClick={() => setPlaceSheet({ open: true, item: null })}
                  className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
                >
                  + Adicionar Lugar
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredPlaces.map(place => (
                  <div
                    key={place.id}
                    className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {place.emoji || PLACE_CATEGORY_EMOJI[place.category ?? 'outros'] || '📍'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{place.name}</p>
                          <button
                            onClick={() => places.toggleFavorite(place)}
                            className={`text-lg ml-2 flex-shrink-0 transition-transform hover:scale-110 ${
                              place.is_favorite ? 'text-yellow-400' : 'text-zinc-200'
                            }`}
                          >
                            ⭐
                          </button>
                        </div>
                        {place.address && (
                          <p className="text-xs text-zinc-400 mt-0.5 truncate">{place.address}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-zinc-400">📍 {place.visited_count} visita{place.visited_count !== 1 ? 's' : ''}</span>
                          {place.maps_url && (
                            <a
                              href={place.maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-teal-600 hover:underline"
                            >
                              Maps
                            </a>
                          )}
                          {place.website_url && (
                            <a
                              href={place.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-teal-600 hover:underline"
                            >
                              Site
                            </a>
                          )}
                        </div>
                        {(place.tags ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {place.tags.map(tag => (
                              <span key={tag} className="text-xs bg-zinc-50 text-zinc-500 px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800">
                      <button
                        onClick={() => places.incrementVisited(place)}
                        className="flex-1 text-xs py-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-teal-50 hover:text-teal-700 transition-colors"
                      >
                        + Marcar Visita
                      </button>
                      <button
                        onClick={() => setPlaceSheet({ open: true, item: place })}
                        className="px-3 text-xs py-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => { if (confirm('Remover lugar?')) places.remove(place.id) }}
                        className="px-3 text-xs py-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
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
        activities={activities.items}
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

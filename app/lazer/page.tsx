'use client'
import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useLeisureActivities } from '@/hooks/useLeisureActivities'
import { useLeisureRecords } from '@/hooks/useLeisureRecords'
import { useLeisurePlaces } from '@/hooks/useLeisurePlaces'
import { LeisureActivitySheet } from '@/components/sheets/LeisureActivitySheet'
import { LeisureRecordSheet } from '@/components/sheets/LeisureRecordSheet'
import { LeisurePlaceSheet } from '@/components/sheets/LeisurePlaceSheet'
import type { LeisureActivity, LeisureRecord, LeisurePlace } from '@/types/database'

type Tab = 'ideias' | 'agenda' | 'registros' | 'lugares'

const STATUS_LABEL: Record<LeisureActivity['status'], string> = {
  wishlist: '💡 Wishlist',
  planejado: '📅 Planejado',
  realizado: '✅ Realizado',
  cancelado: '❌ Cancelado',
}

const STATUS_COLOR: Record<LeisureActivity['status'], string> = {
  wishlist:  'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300',
  planejado: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
  realizado: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
  cancelado: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400',
}

const PRIORITY_BADGE: Record<string, string> = {
  alta: '🔴',
  media: '🟡',
  baixa: '🟢',
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getWeekDates() {
  const today = new Date()
  const day = today.getDay()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - day + i)
    return d
  })
}

export default function LazerPage() {
  const { members } = useFamilyStore()
  const activities = useLeisureActivities()
  const records    = useLeisureRecords()
  const places     = useLeisurePlaces()

  const [tab, setTab] = useState<Tab>('ideias')

  // Sheet states
  const [activitySheet, setActivitySheet] = useState<{ open: boolean; item: LeisureActivity | null }>({ open: false, item: null })
  const [recordSheet,   setRecordSheet]   = useState<{ open: boolean; item: LeisureRecord | null }>({ open: false, item: null })
  const [placeSheet,    setPlaceSheet]    = useState<{ open: boolean; item: LeisurePlace | null }>({ open: false, item: null })

  // Filters
  const [audienceFilter, setAudienceFilter] = useState<'todos' | 'adultos' | 'criancas'>('todos')
  const [placeCategory,  setPlaceCategoryFilter] = useState<string>('todos')

  const filteredActivities = activities.items.filter(a => {
    if (audienceFilter === 'adultos')  return a.for_adults
    if (audienceFilter === 'criancas') return a.for_children
    return true
  })

  const filteredPlaces = places.items.filter(p =>
    placeCategory === 'todos' ? true : p.category === placeCategory
  )

  const weekDates = getWeekDates()

  const TABS: { id: Tab; label: string }[] = [
    { id: 'ideias',    label: '💡 Ideias' },
    { id: 'agenda',   label: '📅 Agenda' },
    { id: 'registros',label: '📸 Registros' },
    { id: 'lugares',  label: '📍 Lugares' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">🎉 Lazer</h1>
          <p className="text-sm text-zinc-500">Planeje, registre e aproveite momentos em família</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-w-max text-sm py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              tab === t.id
                ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ──────────── ABA: IDEIAS ──────────── */}
      {tab === 'ideias' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['todos', 'adultos', 'criancas'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setAudienceFilter(f)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    audienceFilter === f
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200'
                  }`}
                >
                  {f === 'todos' ? '👨‍👩‍👧 Todos' : f === 'adultos' ? '👨 Adultos' : '👧 Crianças'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setActivitySheet({ open: true, item: null })}
              className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              + Ideia
            </button>
          </div>

          {activities.isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <div className="text-5xl mb-3">💡</div>
              <p className="font-medium">Nenhuma ideia ainda</p>
              <p className="text-sm mt-1">Adicione atividades que a família quer fazer</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map(a => (
                <div
                  key={a.id}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-2xl">{a.emoji ?? '🎉'}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{a.title}</p>
                        {a.description && <p className="text-xs text-zinc-500 truncate">{a.description}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => setActivitySheet({ open: true, item: a })}
                      className="text-xs text-zinc-400 hover:text-zinc-700 shrink-0"
                    >
                      ✏️
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                    <span className="text-xs">{PRIORITY_BADGE[a.priority]}</span>
                    {a.for_adults   && <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">👨 Adulto</span>}
                    {a.for_children && <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">👧 Criança</span>}
                    {a.estimated_cost && <span className="text-xs text-zinc-500">R$ {Number(a.estimated_cost).toFixed(2)}</span>}
                    {a.task_id  && <span className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 rounded-full">✅ Tarefa</span>}
                    {a.event_id && <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 rounded-full">📅 Evento</span>}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => activities.cycleStatus(a)}
                      className="flex-1 text-xs py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Avançar status →
                    </button>
                    {!a.task_id && (
                      <button
                        onClick={() => activities.convertToTask(a)}
                        className="text-xs py-1.5 px-3 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                      >
                        ⚡ Tarefa
                      </button>
                    )}
                    <button
                      onClick={() => activities.remove(a.id)}
                      className="text-xs py-1.5 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────── ABA: AGENDA ──────────── */}
      {tab === 'agenda' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Semana atual</h2>
            <button
              onClick={() => setActivitySheet({ open: true, item: null })}
              className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              + Atividade
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDates.map((date, i) => {
              const dateStr = date.toISOString().slice(0, 10)
              const isToday = dateStr === new Date().toISOString().slice(0, 10)
              const dayActivities = activities.items.filter(a =>
                a.status === 'planejado'
              )
              return (
                <div
                  key={i}
                  className={`rounded-xl border p-2 min-h-[90px] transition-all ${
                    isToday
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <p className={`text-xs font-semibold text-center mb-1 ${ isToday ? 'text-emerald-700' : 'text-zinc-500' }`}>
                    {WEEK_DAYS[date.getDay()]}
                  </p>
                  <p className={`text-sm font-bold text-center ${ isToday ? 'text-emerald-700' : 'text-zinc-700 dark:text-zinc-200' }`}>
                    {date.getDate()}
                  </p>
                  {dayActivities.slice(0, 2).map(a => (
                    <div key={a.id} className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 truncate">
                      {a.emoji} {a.title}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Planejados</h3>
            {activities.items.filter(a => a.status === 'planejado').length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">Nenhuma atividade planejada. Avance uma ideia para "Planejado"!</p>
            ) : (
              activities.items
                .filter(a => a.status === 'planejado')
                .map(a => (
                  <div key={a.id} className="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
                    <span className="text-xl">{a.emoji ?? '🎉'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      {a.location_name && <p className="text-xs text-zinc-500">📍 {a.location_name}</p>}
                    </div>
                    <button
                      onClick={() => setActivitySheet({ open: true, item: a })}
                      className="text-xs text-zinc-400 hover:text-zinc-700"
                    >✏️</button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ──────────── ABA: REGISTROS ──────────── */}
      {tab === 'registros' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{records.stats.totalThisMonth}</p>
              <p className="text-xs text-zinc-500 mt-1">Este mês</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {records.stats.avgRating > 0 ? `${records.stats.avgRating}⭐` : '—'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Avaliação média</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {records.stats.totalCost > 0 ? `R$${records.stats.totalCost.toFixed(0)}` : 'R$0'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Gasto total</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setRecordSheet({ open: true, item: null })}
              className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              + Registrar lazer
            </button>
          </div>

          {records.isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}
            </div>
          ) : records.items.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <div className="text-5xl mb-3">📸</div>
              <p className="font-medium">Nenhum registro ainda</p>
              <p className="text-sm mt-1">Registre as atividades que a família já fez</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.items.map(r => {
                const participantNames = members
                  .filter(m => (r.participants ?? []).includes(m.id))
                  .map(m => m.emoji ?? m.nickname ?? m.name)
                return (
                  <div
                    key={r.id}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{r.emoji ?? '📸'}</span>
                        <div>
                          <p className="font-medium text-sm">{r.title}</p>
                          <p className="text-xs text-zinc-500">{r.date_realized}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.would_repeat && <span title="Repetiria">🔄</span>}
                        <button
                          onClick={() => setRecordSheet({ open: true, item: r })}
                          className="text-xs text-zinc-400 hover:text-zinc-700"
                        >✏️</button>
                        <button
                          onClick={() => records.remove(r.id)}
                          className="text-xs text-zinc-400 hover:text-red-500"
                        >🗑</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {r.rating && (
                        <span className="text-sm">
                          {'⭐'.repeat(r.rating)}
                        </span>
                      )}
                      {participantNames.length > 0 && (
                        <span className="text-xs text-zinc-500">{participantNames.join(' ')}</span>
                      )}
                      {r.cost_actual && (
                        <span className="text-xs text-zinc-500">R$ {Number(r.cost_actual).toFixed(2)}</span>
                      )}
                      {r.location_name && (
                        <span className="text-xs text-zinc-500">📍 {r.location_name}</span>
                      )}
                    </div>
                    {r.notes && <p className="text-xs text-zinc-500 italic">{r.notes}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ──────────── ABA: LUGARES ──────────── */}
      {tab === 'lugares' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <select
              value={placeCategory}
              onChange={e => setPlaceCategoryFilter(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900"
            >
              <option value="todos">Todas categorias</option>
              {['parque','praia','restaurante','cinema','teatro','museu','esporte','viagem','clube','outros'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <button
              onClick={() => setPlaceSheet({ open: true, item: null })}
              className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              + Lugar
            </button>
          </div>

          {places.isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <div className="text-5xl mb-3">📍</div>
              <p className="font-medium">Nenhum lugar salvo</p>
              <p className="text-sm mt-1">Salve parques, praias e passeios favoritos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredPlaces.map(p => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-2 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl shrink-0">{p.emoji ?? '📍'}</span>
                      <p className="font-medium text-sm truncate">{p.name}</p>
                    </div>
                    <button
                      onClick={() => places.toggleFavorite(p)}
                      className="text-lg shrink-0"
                    >
                      {p.is_favorite ? '⭐' : '☆'}
                    </button>
                  </div>
                  {p.address && <p className="text-xs text-zinc-500 truncate">{p.address}</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.visited_count > 0 && (
                      <span className="text-xs text-zinc-400">{p.visited_count}x visitado</span>
                    )}
                    {p.maps_url && (
                      <a href={p.maps_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">🗺 Maps</a>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { places.incrementVisited(p); setRecordSheet({ open: true, item: { location_name: p.name, emoji: p.emoji, date_realized: new Date().toISOString().slice(0, 10) } as LeisureRecord }) }}
                      className="flex-1 text-xs py-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                    >
                      ✅ Visitei!
                    </button>
                    <button
                      onClick={() => setPlaceSheet({ open: true, item: p })}
                      className="text-xs py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => places.remove(p.id)}
                      className="text-xs py-1.5 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────── SHEETS ──────────── */}
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

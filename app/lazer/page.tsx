'use client'
import { useState, useMemo } from 'react'
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
  wishlist:  { label: 'Wishlist',  color: 'bg-muted text-muted-foreground',            dot: '⚪' },
  planejado: { label: 'Planejado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',   dot: '🔵' },
  realizado: { label: 'Realizado', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300', dot: '🟢' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',       dot: '🔴' },
}

const PRIORITY_COLORS: Record<LeisureActivity['priority'], string> = {
  alta:  'text-red-500',
  media: 'text-yellow-500',
  baixa: 'text-green-500',
}

export default function LazerPage() {
  const [tab, setTab] = useState<Tab>('ideias')
  const { members } = useFamilyStore()

  // Hooks de dados
  const { items: activities, isLoading: loadingAct, upsert: saveActivity, remove: removeActivity,
          cycleStatus, convertToTask, convertToEvent } = useLeisureActivities()
  const { items: records, isLoading: loadingRec, upsert: saveRecord, remove: removeRecord,
          statsThisMonth } = useLeisureRecords()
  const { items: places, isLoading: loadingPlaces, upsert: savePlace, remove: removePlace,
          toggleFavorite, incrementVisited } = useLeisurePlaces()

  // Sheets
  const [activitySheet, setActivitySheet] = useState<{ open: boolean; item: LeisureActivity | null }>({
    open: false, item: null,
  })
  const [recordSheet, setRecordSheet] = useState<{ open: boolean; item: LeisureRecord | null }>({
    open: false, item: null,
  })
  const [placeSheet, setPlaceSheet] = useState<{ open: boolean; item: LeisurePlace | null }>({
    open: false, item: null,
  })

  // Filtros
  const [audienceFilter, setAudienceFilter] = useState<'todos' | 'adultos' | 'criancas'>('todos')
  const [placeCategoryFilter, setPlaceCategoryFilter] = useState('todos')

  const filteredActivities = useMemo(() => {
    if (audienceFilter === 'adultos') return activities.filter(a => a.for_adults)
    if (audienceFilter === 'criancas') return activities.filter(a => a.for_children)
    return activities
  }, [activities, audienceFilter])

  const wishlistItems  = filteredActivities.filter(a => a.status === 'wishlist')
  const planejadoItems = filteredActivities.filter(a => a.status === 'planejado')
  const realizadoItems = filteredActivities.filter(a => a.status === 'realizado')

  const stats = statsThisMonth()

  const filteredPlaces = useMemo(() => {
    if (placeCategoryFilter === 'todos') return places
    return places.filter(p => p.category === placeCategoryFilter)
  }, [places, placeCategoryFilter])

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'ideias',    label: '💡 Ideias',    count: wishlistItems.length || undefined },
    { id: 'agenda',   label: '📅 Agenda',    count: planejadoItems.length || undefined },
    { id: 'registros',label: '📸 Registros', count: records.length || undefined },
    { id: 'lugares',  label: '📍 Lugares',   count: places.length || undefined },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="🎉 Lazer"
        description="Planejamento e registro de atividades de lazer da família"
        action={
          <button
            onClick={() => {
              if (tab === 'ideias' || tab === 'agenda') setActivitySheet({ open: true, item: null })
              else if (tab === 'registros') setRecordSheet({ open: true, item: null })
              else if (tab === 'lugares') setPlaceSheet({ open: true, item: null })
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Adicionar
          </button>
        }
      />

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-background border-b px-4">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {t.count ? (
                <span className="text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-semibold">
                  {t.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 max-w-4xl mx-auto w-full">

        {/* ── ABA IDEIAS ───────────────────────────────────────────────────── */}
        {tab === 'ideias' && (
          <div className="flex flex-col gap-6">
            {/* Filtro audiência */}
            <div className="flex gap-2">
              {(['todos', 'adultos', 'criancas'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setAudienceFilter(f)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    audienceFilter === f
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  {f === 'todos' ? '👪 Todos' : f === 'adultos' ? '👨 Adultos' : '👶 Crianças'}
                </button>
              ))}
            </div>

            {loadingAct ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : filteredActivities.length === 0 ? (
              <EmptyState
                icon="🎉"
                title="Nenhuma ideia ainda"
                description="Adicione atividades de lazer para a família!"
              />
            ) : (
              [['wishlist', '💡 Wishlist', wishlistItems], ['planejado', '🔵 Planejado', planejadoItems], ['realizado', '🟢 Realizado', realizadoItems]] as const
              ).map(([status, heading, group]) =>
                group.length > 0 && (
                  <section key={status}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      {heading} · {group.length}
                    </h3>
                    <div className="flex flex-col gap-2">
                      {group.map(activity => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow"
                        >
                          {/* Emoji */}
                          <button
                            onClick={() => cycleStatus(activity)}
                            className="text-2xl mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
                            title="Avançar status"
                          >
                            {activity.emoji ?? '🎉'}
                          </button>

                          {/* Conteúdo */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{activity.title}</span>
                              <span className={`text-xs font-bold ${PRIORITY_COLORS[activity.priority]}`}>
                                {activity.priority === 'alta' ? '🔴' : activity.priority === 'media' ? '🟡' : '🟢'}
                              </span>
                            </div>
                            {activity.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{activity.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[activity.status].color}`}>
                                {STATUS_LABELS[activity.status].label}
                              </span>
                              {activity.for_children && <span className="text-xs">👶</span>}
                              {activity.for_adults && <span className="text-xs">👨</span>}
                              {activity.estimated_cost && (
                                <span className="text-xs text-muted-foreground">
                                  R$ {activity.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                              {activity.task_id && (
                                <span className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">✅ Tarefa</span>
                              )}
                              {activity.event_id && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">📅 Agendado</span>
                              )}
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <button
                              onClick={() => setActivitySheet({ open: true, item: activity })}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => removeActivity(activity.id)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground"
                              title="Excluir"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )
              )}
          </div>
        )}

        {/* ── ABA AGENDA ──────────────────────────────────────────────────── */}
        {tab === 'agenda' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Atividades planejadas · {planejadoItems.length} pendentes
            </p>
            {planejadoItems.length === 0 ? (
              <EmptyState
                icon="📅"
                title="Nenhum lazer planejado"
                description="Adicione uma atividade e agende para a família!"
              />
            ) : (
              <div className="flex flex-col gap-2">
                {planejadoItems.map(activity => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                    <span className="text-2xl">{activity.emoji ?? '🎉'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {activity.location_name && (
                          <span className="text-xs text-muted-foreground">📍 {activity.location_name}</span>
                        )}
                        {activity.estimated_cost && (
                          <span className="text-xs text-muted-foreground">
                            R$ {activity.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        {activity.duration_hours && (
                          <span className="text-xs text-muted-foreground">⏱ {activity.duration_hours}h</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setRecordSheet({ open: true, item: null })}
                        className="px-2 py-1 rounded-lg bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-medium hover:opacity-80 transition-opacity"
                        title="Registrar realizado"
                      >
                        ✅ Feito
                      </button>
                      <button
                        onClick={() => setActivitySheet({ open: true, item: activity })}
                        className="px-2 py-1 rounded-lg border text-xs hover:bg-muted transition-colors"
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

        {/* ── ABA REGISTROS ────────────────────────────────────────────────── */}
        {tab === 'registros' && (
          <div className="flex flex-col gap-4">
            {/* Estatísticas do mês */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Este mês', value: stats.count, icon: '📅' },
                { label: 'Gasto total', value: `R$ ${stats.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: '💰' },
                { label: 'Média ⭐', value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—', icon: '⭐' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl border bg-card text-center">
                  <p className="text-lg">{s.icon}</p>
                  <p className="font-bold text-base">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {loadingRec ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : records.length === 0 ? (
              <EmptyState
                icon="📸"
                title="Nenhum lazer registrado"
                description="Registre as memórias de lazer da família aqui!"
              />
            ) : (
              <div className="flex flex-col gap-2">
                {records.map(record => {
                  const participantNames = record.participants
                    .map(pid => members.find(m => m.id === pid))
                    .filter(Boolean)
                  return (
                    <div key={record.id} className="p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{record.emoji ?? '📸'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{record.title}</span>
                            {record.would_repeat && (
                              <span className="text-xs" title="Repetiria">🔄</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.date_realized + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          {record.rating ? (
                            <p className="text-xs text-yellow-400 mt-0.5">
                              {'★'.repeat(record.rating)}{'☆'.repeat(5 - record.rating)}
                            </p>
                          ) : null}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {participantNames.map(m => m && (
                              <span key={m.id} className="text-xs bg-muted rounded-full px-2 py-0.5">
                                {(m as any).emoji ?? '👤'} {(m as any).nickname ?? (m as any).name}
                              </span>
                            ))}
                            {record.cost_actual ? (
                              <span className="text-xs text-muted-foreground">
                                R$ {record.cost_actual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            ) : null}
                            {record.location_name && (
                              <span className="text-xs text-muted-foreground">📍 {record.location_name}</span>
                            )}
                          </div>
                          {record.notes && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{record.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            onClick={() => setRecordSheet({ open: true, item: record })}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => removeRecord(record.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground"
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

        {/* ── ABA LUGARES ──────────────────────────────────────────────────── */}
        {tab === 'lugares' && (
          <div className="flex flex-col gap-4">
            {/* Filtro de categoria */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['todos', 'parque', 'praia', 'restaurante', 'cinema', 'teatro', 'museu', 'esporte', 'viagem', 'clube'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setPlaceCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-colors ${
                    placeCategoryFilter === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {loadingPlaces ? (
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : filteredPlaces.length === 0 ? (
              <EmptyState
                icon="📍"
                title="Nenhum lugar salvo"
                description="Salve locais favoritos da família para planejar passeios!"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPlaces.map(place => (
                  <div key={place.id} className="p-3 rounded-xl border bg-card flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-2xl flex-shrink-0">{place.emoji ?? '📍'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm truncate">{place.name}</span>
                          <button
                            onClick={() => toggleFavorite(place)}
                            className="flex-shrink-0 hover:scale-110 transition-transform"
                            title={place.is_favorite ? 'Remover favorito' : 'Favoritar'}
                          >
                            {place.is_favorite ? '⭐' : '☆'}
                          </button>
                        </div>
                        {place.address && (
                          <p className="text-xs text-muted-foreground truncate">📍 {place.address}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          🏁 {place.visited_count} {place.visited_count === 1 ? 'visita' : 'visitas'}
                        </p>
                      </div>
                    </div>

                    {/* Links */}
                    {(place.maps_url || place.website_url) && (
                      <div className="flex gap-2">
                        {place.maps_url && (
                          <a
                            href={place.maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center text-xs py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                          >
                            🗺️ Maps
                          </a>
                        )}
                        {place.website_url && (
                          <a
                            href={place.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center text-xs py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                          >
                            🌐 Site
                          </a>
                        )}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2 border-t pt-2">
                      <button
                        onClick={() => { incrementVisited(place); setRecordSheet({ open: true, item: null }) }}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-medium hover:opacity-80 transition-opacity"
                      >
                        ✅ Marcar visita
                      </button>
                      <button
                        onClick={() => setPlaceSheet({ open: true, item: place })}
                        className="px-3 py-1.5 rounded-lg border text-xs hover:bg-muted transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => removePlace(place.id)}
                        className="px-3 py-1.5 rounded-lg border text-xs hover:bg-destructive/10 transition-colors"
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
        onSave={saveActivity}
        members={members}
        onConvertToTask={convertToTask}
        onConvertToEvent={convertToEvent}
      />
      <LeisureRecordSheet
        open={recordSheet.open}
        onClose={() => setRecordSheet({ open: false, item: null })}
        item={recordSheet.item}
        activities={activities}
        onSave={saveRecord}
        members={members}
      />
      <LeisurePlaceSheet
        open={placeSheet.open}
        onClose={() => setPlaceSheet({ open: false, item: null })}
        item={placeSheet.item}
        onSave={savePlace}
        members={members}
      />
    </div>
  )
}

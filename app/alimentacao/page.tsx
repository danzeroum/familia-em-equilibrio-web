'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useGroceryItems } from '@/hooks/useGroceryItems'
import { useMealPlan } from '@/hooks/useMealPlan'
import { useRecipes } from '@/hooks/useRecipes'
import { usePantryItems } from '@/hooks/usePantryItems'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { QuickAddList } from '@/components/food/QuickAddList'
import { GrocerySheet } from '@/components/sheets/GrocerySheet'
import { MealPlanSheet } from '@/components/sheets/MealPlanSheet'
import { RecipeSheet } from '@/components/sheets/RecipeSheet'
import { PantrySheet } from '@/components/sheets/PantrySheet'
import type { ShoppingItem, MealPlan, Recipe, PantryItem } from '@/types/database'

// ─── helpers ───────────────────────────────────────────────────────────────────
const DAYS = [
  { value: 0, short: 'Dom', full: 'Domingo' },
  { value: 1, short: 'Seg', full: 'Segunda' },
  { value: 2, short: 'Ter', full: 'Terça' },
  { value: 3, short: 'Qua', full: 'Quarta' },
  { value: 4, short: 'Qui', full: 'Quinta' },
  { value: 5, short: 'Sex', full: 'Sexta' },
  { value: 6, short: 'Sáb', full: 'Sábado' },
]

const MEALS: { value: MealPlan['meal_type']; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Café',   emoji: '☕' },
  { value: 'lunch',     label: 'Almoço', emoji: '🍽️' },
  { value: 'snack',     label: 'Lanche', emoji: '🍪' },
  { value: 'dinner',    label: 'Jantar', emoji: '🌙' },
]

const PANTRY_CATEGORY_LABEL: Record<string, string> = {
  graos:      '🌾 Grãos',
  oleos:      '🫒 Óleos',
  temperos:   '🧂 Temperos',
  enlatados:  '🥫 Enlatados',
  laticinios: '🥛 Laticínios',
  congelados: '🧊 Congelados',
  bebidas:    '🥤 Bebidas',
  snacks:     '🍿 Snacks',
  outros:     '📦 Outros',
}

function situationBadge(qty: number | null, min: number | null): { label: string; cls: string } {
  const q = qty ?? 0
  const m = min ?? 1
  if (q >= m) return { label: '🟢 OK',    cls: 'bg-green-100 text-green-700' }
  if (q > 0)  return { label: '🟡 Baixo', cls: 'bg-yellow-100 text-yellow-700' }
  return            { label: '🔴 Falta', cls: 'bg-red-100 text-red-700' }
}

function expiryBadge(expiry: string | null): { label: string; cls: string } {
  if (!expiry) return { label: '—', cls: 'text-gray-400' }
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)
  if (days < 0)   return { label: '🔴 Vencido', cls: 'bg-red-100 text-red-700' }
  if (days <= 30) return { label: `🟡 ${days}d`, cls: 'bg-yellow-100 text-yellow-700' }
  return { label: `🟢 ${new Date(expiry).toLocaleDateString('pt-BR')}`, cls: 'bg-green-100 text-green-700' }
}

type Tab = 'mercado' | 'cardapio' | 'receitas' | 'despensa'

// ═══════════════════════════════════════════════════════════════════════════════
export default function AlimentacaoPage() {
  const { members, currentUser } = useFamilyStore()
  const grocery = useGroceryItems()
  const mealPlan = useMealPlan()
  const recipes = useRecipes()
  const pantry = usePantryItems()

  const [tab, setTab] = useState<Tab>('mercado')
  const [filterMember, setFilterMember] = useState<string>('all')

  const [grocerySheetOpen, setGrocerySheetOpen] = useState(false)
  const [selectedGrocery, setSelectedGrocery] = useState<ShoppingItem | null>(null)

  const [mealSheetOpen, setMealSheetOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null)
  const [mealDefaults, setMealDefaults] = useState<{ day_of_week?: number; meal_type?: MealPlan['meal_type'] } | undefined>(undefined)

  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  const [pantrySheetOpen, setPantrySheetOpen] = useState(false)
  const [selectedPantry, setSelectedPantry] = useState<PantryItem | null>(null)

  const getMemberName = (id: string | null) => {
    if (!id) return 'Família'
    return members.find(m => m.id === id)?.nickname ?? members.find(m => m.id === id)?.name ?? '—'
  }

  // Filtros
  const filterByMember = <T extends { profile_id?: string | null; requested_by?: string | null }>(arr: T[], key: 'profile_id' | 'requested_by' = 'profile_id') => {
    if (filterMember === 'all') return arr
    return arr.filter(i => (i[key] ?? null) === filterMember)
  }

  // Mercado
  const filteredGrocery = filterByMember(grocery.items, 'requested_by')
  const groceryRunningOut = filteredGrocery.filter(i => i.status === 'running_out')
  const groceryNeeded     = filteredGrocery.filter(i => i.status === 'needed')
  const groceryBoughtRec  = filteredGrocery.filter(i => i.status === 'bought' && i.is_recurring)

  const handleToggleBuy = (item: ShoppingItem) => {
    if (item.status === 'needed' || item.status === 'running_out') {
      grocery.updateStatus(item.id, 'bought', currentUser?.id)
    } else {
      grocery.updateStatus(item.id, 'needed')
    }
  }

  // Cardápio
  const filteredMeals = filterByMember(mealPlan.items, 'profile_id')
  const mealByDayType = (day: number, type: MealPlan['meal_type']) =>
    filteredMeals.filter(m => m.day_of_week === day && m.meal_type === type)

  // Despensa
  const pantryAlerts = pantry.items.filter(i => {
    const lowStock = (i.quantity ?? 0) < (i.minimum_quantity ?? 1)
    const expiringSoon = i.expiry_date && Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / 86400000) <= 30
    return lowStock || expiringSoon
  }).length

  const groceryAlerts = grocery.items.filter(i => i.status === 'running_out').length

  const TABS = [
    { id: 'mercado'  as Tab, label: '🛒 Mercado',  alerts: groceryAlerts },
    { id: 'cardapio' as Tab, label: '🍽️ Cardápio', alerts: 0 },
    { id: 'receitas' as Tab, label: '📖 Receitas',  alerts: 0 },
    { id: 'despensa' as Tab, label: '🍎 Despensa',  alerts: pantryAlerts },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        emoji="🍽️"
        title="Alimentação"
        description="Mercado, cardápio, receitas e despensa da família"
        action={
          tab === 'cardapio' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedMeal(null); setMealDefaults(undefined); setMealSheetOpen(true) }}>+ Refeição</button>
          ) : tab === 'receitas' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedRecipe(null); setRecipeSheetOpen(true) }}>+ Receita</button>
          ) : tab === 'despensa' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedPantry(null); setPantrySheetOpen(true) }}>+ Item</button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.alerts > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {t.alerts}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filtro por membro */}
      {members.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {[{ id: 'all', label: 'Todos' }, ...members.map(m => ({ id: m.id, label: m.nickname ?? m.name }))].map(opt => (
            <button key={opt.id}
              onClick={() => setFilterMember(opt.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                filterMember === opt.id
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'border-gray-200 text-gray-600 hover:border-teal-400'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* ══ MERCADO ══ */}
      {tab === 'mercado' && (
        <div className="space-y-5">
          <QuickAddList
            onAdd={grocery.bulkInsert}
            placeholder="Cole sua lista de compras ou digite um item e aperte Enter..."
          />

          {grocery.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : filteredGrocery.length === 0 ? (
            <EmptyState
              emoji="🛒"
              title="Lista vazia"
              description="Adicione itens no campo acima — cole uma lista inteira ou digite um por vez."
            />
          ) : (
            <>
              {groceryRunningOut.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h3 className="text-yellow-800 font-semibold mb-3">⚠️ A Acabar (Prioridade)</h3>
                  <div className="space-y-2">
                    {groceryRunningOut.map(i => (
                      <div key={i.id} className="flex items-center justify-between bg-white p-3 rounded shadow-sm">
                        <label className="flex items-center gap-3 flex-1 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 accent-teal-600" onChange={() => handleToggleBuy(i)} />
                          <div>
                            <p className="font-medium">{i.name}</p>
                            <p className="text-xs text-gray-500">
                              {i.quantity && <span>{i.quantity} · </span>}
                              <span>{getMemberName(i.requested_by)}</span>
                            </p>
                          </div>
                        </label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedGrocery(i); setGrocerySheetOpen(true) }} className="text-gray-400 text-sm hover:text-gray-600">Editar</button>
                          <button onClick={() => { if (confirm('Remover?')) grocery.remove(i.id) }} className="text-red-400 text-sm hover:text-red-600">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {groceryNeeded.length > 0 && (
                <div>
                  <h3 className="text-gray-700 font-medium mb-3">A Comprar ({groceryNeeded.length})</h3>
                  <div className="space-y-2">
                    {groceryNeeded.map(i => (
                      <div key={i.id} className="flex items-center justify-between bg-white border p-3 rounded hover:border-teal-300 transition-colors">
                        <label className="flex items-center gap-3 flex-1 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 accent-teal-600" onChange={() => handleToggleBuy(i)} />
                          <div>
                            <p className="font-medium text-gray-800">{i.name}</p>
                            {(i.quantity || i.requested_by) && (
                              <p className="text-xs text-gray-500">
                                {i.quantity && <span>{i.quantity}</span>}
                                {i.quantity && i.requested_by && <span> · </span>}
                                {i.requested_by && <span>{getMemberName(i.requested_by)}</span>}
                              </p>
                            )}
                          </div>
                        </label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedGrocery(i); setGrocerySheetOpen(true) }} className="text-gray-400 text-sm hover:text-gray-600">Editar</button>
                          <button onClick={() => { if (confirm('Remover?')) grocery.remove(i.id) }} className="text-red-400 text-sm hover:text-red-600">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {groceryBoughtRec.length > 0 && (
                <div className="opacity-70">
                  <h3 className="text-gray-500 font-medium mb-3 text-sm">🔄 Recorrentes em Estoque (Comprados)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {groceryBoughtRec.map(i => (
                      <div key={i.id} className="flex items-center justify-between bg-gray-50 border p-2 rounded text-sm">
                        <span className="text-gray-500 line-through">{i.name}</span>
                        <button
                          onClick={() => handleToggleBuy(i)}
                          className="text-teal-600 font-medium text-xs bg-teal-50 px-2 py-1 rounded hover:bg-teal-100"
                        >Pôr na Lista</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══ CARDÁPIO ══ */}
      {tab === 'cardapio' && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {mealPlan.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-3 text-left">📅 Dia</th>
                    {MEALS.map(m => (
                      <th key={m.value} className="px-3 py-3 text-left">{m.emoji} {m.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {DAYS.map(d => (
                    <tr key={d.value} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 font-medium text-gray-700 whitespace-nowrap">{d.full}</td>
                      {MEALS.map(m => {
                        const slot = mealByDayType(d.value, m.value)
                        return (
                          <td key={m.value} className="px-3 py-2 align-top min-w-[140px]">
                            <div className="space-y-1">
                              {slot.map(s => (
                                <div key={s.id} className="group bg-teal-50 border border-teal-100 rounded px-2 py-1.5 cursor-pointer hover:bg-teal-100 transition-colors"
                                  onClick={() => { setSelectedMeal(s); setMealDefaults(undefined); setMealSheetOpen(true) }}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-teal-900 truncate">{s.title}</p>
                                      {s.profile_id && (
                                        <p className="text-[10px] text-teal-600 truncate">{getMemberName(s.profile_id)}</p>
                                      )}
                                    </div>
                                    <button
                                      className="text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(ev) => { ev.stopPropagation(); if (confirm('Remover?')) mealPlan.remove(s.id) }}
                                    >×</button>
                                  </div>
                                </div>
                              ))}
                              <button
                                className="w-full text-xs text-gray-400 hover:text-teal-600 border border-dashed border-gray-200 hover:border-teal-300 rounded px-2 py-1 transition-colors"
                                onClick={() => {
                                  setSelectedMeal(null)
                                  setMealDefaults({ day_of_week: d.value, meal_type: m.value })
                                  setMealSheetOpen(true)
                                }}
                              >+</button>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ RECEITAS ══ */}
      {tab === 'receitas' && (
        <div>
          {recipes.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : recipes.items.length === 0 ? (
            <EmptyState emoji="📖" title="Nenhuma receita" description="Cadastre as receitas favoritas da família." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recipes.items.map(r => (
                <div key={r.id} className="rounded-xl border bg-white p-4 hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-1">
                      {r.emoji && <span>{r.emoji}</span>}
                      <span>{r.title}</span>
                    </h3>
                    <button
                      onClick={() => recipes.toggleFavorite(r.id, !r.is_favorite)}
                      className={`text-lg ${r.is_favorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'} transition-colors`}
                      title={r.is_favorite ? 'Favorita' : 'Marcar como favorita'}
                    >★</button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    {r.servings != null && <span>🍽️ {r.servings} porções</span>}
                    {r.prep_minutes != null && <span>⏱️ {r.prep_minutes} min</span>}
                  </div>
                  {r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.tags.map(t => (
                        <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">#{t}</span>
                      ))}
                    </div>
                  )}
                  {r.ingredients && (
                    <p className="text-xs text-gray-500 mt-3 line-clamp-3 whitespace-pre-line">{r.ingredients}</p>
                  )}
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <button className="text-xs text-teal-600 hover:underline flex-1 text-left"
                      onClick={() => { setSelectedRecipe(r); setRecipeSheetOpen(true) }}>Ver / Editar</button>
                    <button className="text-xs text-red-400 hover:text-red-600"
                      onClick={() => { if (confirm(`Remover "${r.title}"?`)) recipes.remove(r.id) }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ DESPENSA ══ */}
      {tab === 'despensa' && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {pantry.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : pantry.items.length === 0 ? (
            <EmptyState emoji="🍎" title="Despensa vazia" description="Cadastre itens que você mantém em casa — arroz, óleo, temperos..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">🏷️ Item</th>
                    <th className="px-4 py-3 text-left">📂 Categoria</th>
                    <th className="px-4 py-3 text-left">📦 Qtd / Mín</th>
                    <th className="px-4 py-3 text-left">🚦 Situação</th>
                    <th className="px-4 py-3 text-left">⏳ Validade</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pantry.items.map(i => {
                    const sit = situationBadge(i.quantity, i.minimum_quantity)
                    const exp = expiryBadge(i.expiry_date)
                    return (
                      <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {i.emoji ? `${i.emoji} ` : ''}{i.name}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{i.category ? PANTRY_CATEGORY_LABEL[i.category] ?? i.category : '—'}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold">{i.quantity ?? '—'}</span>
                          <span className="text-gray-400"> {i.unit ?? ''} / {i.minimum_quantity ?? 1}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sit.cls}`}>{sit.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${exp.cls}`}>{exp.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <button className="text-xs text-teal-600 hover:underline"
                              onClick={() => { setSelectedPantry(i); setPantrySheetOpen(true) }}>Editar</button>
                            <button className="text-xs text-red-400 hover:text-red-600"
                              onClick={() => { if (confirm('Remover?')) pantry.remove(i.id) }}>×</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sheets */}
      <GrocerySheet
        open={grocerySheetOpen}
        onClose={() => setGrocerySheetOpen(false)}
        item={selectedGrocery}
        onSave={grocery.upsert}
        members={members}
      />
      <MealPlanSheet
        open={mealSheetOpen}
        onClose={() => setMealSheetOpen(false)}
        item={selectedMeal}
        onSave={mealPlan.upsert}
        members={members}
        recipes={recipes.items}
        defaults={mealDefaults}
      />
      <RecipeSheet
        open={recipeSheetOpen}
        onClose={() => setRecipeSheetOpen(false)}
        item={selectedRecipe}
        onSave={recipes.upsert}
      />
      <PantrySheet
        open={pantrySheetOpen}
        onClose={() => setPantrySheetOpen(false)}
        item={selectedPantry}
        onSave={pantry.upsert}
      />

    </div>
  )
}

'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useWardrobe } from '@/hooks/useWardrobe'
import { useMedications } from '@/hooks/useMedications'
import { useHomeMaintenance } from '@/hooks/useHomeMaintenance'
import { useShoppingItems } from '@/hooks/useShoppingItems'
import { useMaintenanceCalls } from '@/hooks/useMaintenanceCalls'
import type { MaintenanceCall } from '@/hooks/useMaintenanceCalls'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { WardrobeSheet } from '@/components/sheets/WardrobeSheet'
import { MaintenanceSheet } from '@/components/sheets/MaintenanceSheet'
import { MaintenanceCallSheet } from '@/components/sheets/MaintenanceCallSheet'
import { ShoppingSheet } from '@/components/sheets/ShoppingSheet'
import { MedicationSheet } from '@/components/sheets/MedicationSheet'
import type { WardrobeItem, HomeMaintenance, ShoppingItem, Medication } from '@/types/database'

// ─── helpers ───────────────────────────────────────────────────────────────────
const SEASON_LABEL: Record<string, string> = { summer: '☀️ Verão', winter: '❄️ Inverno', all: '🔄 Todas' }
const WARDROBE_STATUS: Record<string, { label: string; cls: string }> = {
  fitting:  { label: '✅ Serve',    cls: 'bg-green-100 text-green-700' },
  outgrown: { label: '📦 Pequeno', cls: 'bg-orange-100 text-orange-700' },
  to_buy:   { label: '🛒 Comprar', cls: 'bg-blue-100 text-blue-700' },
  donate:   { label: '🎁 Doação',  cls: 'bg-purple-100 text-purple-700' },
}

const PRIORITY_BADGE: Record<number, { label: string; cls: string }> = {
  1: { label: '🔴 Crítico',    cls: 'bg-red-100 text-red-700' },
  2: { label: '🟡 Importante', cls: 'bg-yellow-100 text-yellow-700' },
  3: { label: '⚪ Quando puder', cls: 'bg-gray-100 text-gray-600' },
}

const CALL_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: '⏳ Pendente',  cls: 'bg-orange-100 text-orange-700' },
  scheduled: { label: '📅 Agendado',  cls: 'bg-blue-100 text-blue-700' },
  done:      { label: '✅ Resolvido', cls: 'bg-green-100 text-green-700' },
}

function situationBadge(qty: number, min: number): { label: string; cls: string } {
  if (qty >= min) return { label: '🟢 OK',    cls: 'bg-green-100 text-green-700' }
  if (qty > 0)    return { label: '🟡 Baixo', cls: 'bg-yellow-100 text-yellow-700' }
  return            { label: '🔴 Falta', cls: 'bg-red-100 text-red-700' }
}

function expiryBadge(expiry: string | null): { label: string; cls: string } {
  if (!expiry) return { label: '—', cls: 'text-gray-400' }
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)
  if (days < 0)   return { label: '🔴 Vencido', cls: 'bg-red-100 text-red-700' }
  if (days <= 30) return { label: `🟡 ${days}d`, cls: 'bg-yellow-100 text-yellow-700' }
  return { label: `🟢 ${new Date(expiry).toLocaleDateString('pt-BR')}`, cls: 'bg-green-100 text-green-700' }
}

function maintenanceBadge(level: 'ok' | 'due_soon' | 'overdue', days: number | null) {
  if (level === 'overdue')  return { label: '🔴 Atrasado', cls: 'bg-red-100 text-red-700' }
  if (level === 'due_soon') return { label: days !== null ? `🟡 ${days}d` : '🟡 Pendente', cls: 'bg-yellow-100 text-yellow-700' }
  return { label: days !== null ? `🟢 ${days}d` : '🟢 OK', cls: 'bg-green-100 text-green-700' }
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

type Tab = 'vestuario' | 'medicamentos' | 'manutencao' | 'consertos' | 'compras'

// ═══════════════════════════════════════════════════════════════════════════════
export default function CasaPage() {
  const { members, currentUser } = useFamilyStore()
  const wardrobe    = useWardrobe()
  const { medications, isLoading: medLoading, upsert: upsertMed, remove: removeMed } = useMedications()
  const maintenance = useHomeMaintenance()
  const shopping    = useShoppingItems()
  const calls       = useMaintenanceCalls()

  const [tab, setTab] = useState<Tab>('vestuario')
  const [filterMember, setFilterMember] = useState<string>('all')
  const [showDoneCalls, setShowDoneCalls] = useState(false)

  const [wardrobeOpen, setWardrobeOpen]   = useState(false)
  const [selectedWardrobe, setSelectedWardrobe] = useState<WardrobeItem | null>(null)

  const [maintOpen, setMaintOpen]         = useState(false)
  const [selectedMaint, setSelectedMaint] = useState<HomeMaintenance | null>(null)

  const [callOpen, setCallOpen]           = useState(false)
  const [selectedCall, setSelectedCall]   = useState<MaintenanceCall | null>(null)

  const [shoppingOpen, setShoppingOpen]   = useState(false)
  const [selectedItem, setSelectedItem]   = useState<ShoppingItem | null>(null)

  const [medOpen, setMedOpen]             = useState(false)
  const [selectedMed, setSelectedMed]     = useState<Medication | null>(null)

  const filteredWardrobe = filterMember === 'all'
    ? wardrobe.items
    : wardrobe.items.filter(i => i.profile_id === filterMember)

  const wardrobeAlerts  = wardrobe.items.filter(i => i.needsRestock).length
  const medAlerts       = medications.filter(i =>
    (i.stock_quantity < (i.minimum_stock ?? 1)) ||
    (i.expiry_date && Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / 86400000) <= 30)
  ).length
  const maintAlerts     = maintenance.items.filter(i => i.alertLevel !== 'ok').length
  const shoppingAlerts  = shopping.items.filter(i => i.status === 'running_out').length

  const getMemberName = (id: string | null) => {
    if (!id) return 'Família'
    return members.find(m => m.id === id)?.nickname ?? members.find(m => m.id === id)?.name ?? '—'
  }

  const runningOut      = shopping.items.filter(i => i.status === 'running_out')
  const needed          = shopping.items.filter(i => i.status === 'needed')
  const boughtRecurring = shopping.items.filter(i => i.status === 'bought' && i.is_recurring)

  const handleToggleBuy = (item: ShoppingItem) => {
    if (item.status === 'needed' || item.status === 'running_out') {
      shopping.updateStatus(item.id, 'bought', currentUser?.id)
    } else {
      shopping.updateStatus(item.id, 'needed')
    }
  }

  const TABS = [
    { id: 'vestuario'    as Tab, label: '🧥 Vestuário',                 alerts: wardrobeAlerts },
    { id: 'medicamentos' as Tab, label: '💊 Med. & Primeiros Socorros', alerts: medAlerts      },
    { id: 'manutencao'   as Tab, label: '🛠️ Manutenção',               alerts: maintAlerts   },
    { id: 'consertos'    as Tab, label: '🔧 Consertos',                 alerts: calls.alerts  },
    { id: 'compras'      as Tab, label: '🛒 Compras',                   alerts: shoppingAlerts },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        emoji="🏡"
        title="Casa"
        description="Estoque, vestuário, medicamentos e manutenção"
        action={
          tab === 'vestuario' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedWardrobe(null); setWardrobeOpen(true) }}>+ Item</button>
          ) : tab === 'medicamentos' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedMed(null); setMedOpen(true) }}>+ Medicamento</button>
          ) : tab === 'manutencao' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedMaint(null); setMaintOpen(true) }}>+ Manutenção</button>
          ) : tab === 'consertos' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedCall(null); setCallOpen(true) }}>+ Conserto</button>
          ) : tab === 'compras' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedItem(null); setShoppingOpen(true) }}>+ Produto</button>
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

      {/* ══ BLOCO A — VESTUÁRIO ══ */}
      {tab === 'vestuario' && (
        <div className="space-y-4">
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

          <div className="rounded-xl border bg-white overflow-hidden">
            {wardrobe.isLoading ? (
              <div className="p-8 text-center text-gray-400">Carregando...</div>
            ) : filteredWardrobe.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-3xl mb-2">🧥</p>
                <p className="text-gray-500 font-medium">Nenhum item de vestuário</p>
                <p className="text-sm text-gray-400 mt-1">Adicione roupas, calçados e acessórios.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">🏷️ Item</th>
                      <th className="px-4 py-3 text-left">👤 Membro</th>
                      <th className="px-4 py-3 text-left">📦 Qtd / Mín</th>
                      <th className="px-4 py-3 text-left">🚦 Situação</th>
                      <th className="px-4 py-3 text-left">🌤️ Estação</th>
                      <th className="px-4 py-3 text-left">🔘 Status</th>
                      <th className="px-4 py-3 text-left">👤 Responsável</th>
                      <th className="px-4 py-3 text-left">🛒 Ação</th>
                      <th className="px-4 py-3 text-left">📅 Data</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredWardrobe.map(i => {
                      const sit = situationBadge(i.quantity, i.minimum_quantity ?? 1)
                      const st  = WARDROBE_STATUS[i.status] ?? { label: i.status, cls: 'bg-gray-100 text-gray-600' }
                      return (
                        <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{i.item_type}</td>
                          <td className="px-4 py-3 text-gray-600">{getMemberName(i.profile_id)}</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold">{i.quantity}</span>
                            <span className="text-gray-400"> / {i.minimum_quantity ?? 1}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sit.cls}`}>{sit.label}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{SEASON_LABEL[i.season] ?? i.season}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{getMemberName((i as any).responsible_id)}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{(i as any).action_description || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{formatDate((i as any).action_date)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-end">
                              <button className="text-xs text-teal-600 hover:underline"
                                onClick={() => { setSelectedWardrobe(i); setWardrobeOpen(true) }}>Editar</button>
                              <button className="text-xs text-red-400 hover:underline"
                                onClick={() => { if (confirm('Remover item?')) wardrobe.remove(i.id) }}>×</button>
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
        </div>
      )}

      {/* ══ BLOCO B — MEDICAMENTOS ══ */}
      {tab === 'medicamentos' && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white overflow-hidden">
            {medLoading ? (
              <div className="p-8 text-center text-gray-400">Carregando...</div>
            ) : medications.length === 0 ? (
              <EmptyState
                emoji="💊"
                title="Nenhum medicamento cadastrado"
                description="Adicione medicamentos e itens de primeiros socorros da família."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">🏷️ Item</th>
                      <th className="px-4 py-3 text-left">👤 Para</th>
                      <th className="px-4 py-3 text-left">📦 Estoque / Mín</th>
                      <th className="px-4 py-3 text-left">⏳ Validade</th>
                      <th className="px-4 py-3 text-left">🚦 Situação</th>
                      <th className="px-4 py-3 text-left">🔘 Forma</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {medications.map(i => {
                      const sit = situationBadge(i.stock_quantity ?? 0, i.minimum_stock ?? 1)
                      const exp = expiryBadge(i.expiry_date)
                      return (
                        <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{i.name}</td>
                          <td className="px-4 py-3 text-gray-600">{getMemberName(i.profile_id)}</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold">{i.stock_quantity ?? '—'}</span>
                            <span className="text-gray-400"> / {i.minimum_stock ?? 1}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${exp.cls}`}>{exp.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sit.cls}`}>{sit.label}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{i.form ?? '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-end">
                              <button className="text-xs text-teal-600 hover:underline"
                                onClick={() => { setSelectedMed(i); setMedOpen(true) }}>Editar</button>
                              <button className="text-xs text-red-400 hover:text-red-600"
                                onClick={() => { if (confirm('Remover medicamento?')) removeMed(i.id) }}>×</button>
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
          <p className="text-xs text-gray-400">💡 Estes dados são compartilhados com a aba Medicamentos em <strong>Saúde</strong>.</p>
        </div>
      )}

      {/* ══ BLOCO C — MANUTENÇÃO PROGRAMADA ══ */}
      {tab === 'manutencao' && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white overflow-hidden">
            {maintenance.isLoading ? (
              <div className="p-8 text-center text-gray-400">Carregando...</div>
            ) : maintenance.items.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-3xl mb-2">🛠️</p>
                <p className="text-gray-500 font-medium">Nenhuma manutenção cadastrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">🏷️ Item</th>
                      <th className="px-4 py-3 text-left">🔁 Frequência</th>
                      <th className="px-4 py-3 text-left">👤 Responsável</th>
                      <th className="px-4 py-3 text-left">📅 Última vez</th>
                      <th className="px-4 py-3 text-left">📅 Próxima</th>
                      <th className="px-4 py-3 text-left">⏳ Dias</th>
                      <th className="px-4 py-3 text-left">🚦 Alerta</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {maintenance.items.map(i => {
                      const badge = maintenanceBadge(i.alertLevel, i.daysRemaining)
                      return (
                        <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{i.emoji} {i.title}</td>
                          <td className="px-4 py-3 text-gray-500">{i.frequency_label}</td>
                          <td className="px-4 py-3 text-gray-600">{getMemberName(i.responsible_id)}</td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(i.last_done_at)}</td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(i.next_due_at)}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {i.daysRemaining !== null ? (
                              <span className={i.daysRemaining < 0 ? 'text-red-600 font-semibold' : ''}>
                                {i.daysRemaining < 0 ? `${Math.abs(i.daysRemaining)}d atrás` : `${i.daysRemaining}d`}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-end">
                              <button
                                className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded hover:bg-teal-100 transition-colors"
                                onClick={() => maintenance.markDone(i.id)}
                              >✓ Feito</button>
                              <button className="text-xs text-gray-400 hover:text-teal-600"
                                onClick={() => { setSelectedMaint(i); setMaintOpen(true) }}>✏️</button>
                              <button className="text-xs text-red-400 hover:text-red-600"
                                onClick={() => { if (confirm('Remover?')) maintenance.remove(i.id) }}>×</button>
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
        </div>
      )}

      {/* ══ BLOCO D — CONSERTOS PONTUAIS ══ */}
      {tab === 'consertos' && (
        <div className="space-y-5">
          {calls.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : calls.items.length === 0 ? (
            <EmptyState
              emoji="🔧"
              title="Nenhum conserto registado"
              description="Registe problemas pontuais da casa para não perder o rastro — mesmo sem data de resolução."
            />
          ) : (
            <>
              {/* Pendentes */}
              {calls.pending.length > 0 && (
                <div className="rounded-xl border bg-white overflow-hidden">
                  <div className="px-4 py-3 bg-orange-50 border-b">
                    <h3 className="text-sm font-semibold text-orange-800">⏳ Pendentes — sem data marcada ({calls.pending.length})</h3>
                  </div>
                  <div className="divide-y">
                    {calls.pending.map(c => {
                      const prio = PRIORITY_BADGE[c.priority ?? 2]
                      return (
                        <div key={c.id} className="flex items-start justify-between px-4 py-3 hover:bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-800">{c.title}</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prio.cls}`}>{prio.label}</span>
                            </div>
                            {c.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{c.description}</p>}
                            {c.professional_name && (
                              <p className="text-xs text-gray-400 mt-0.5">👷 {c.professional_name}{c.professional_phone ? ` · ${c.professional_phone}` : ''}</p>
                            )}
                            {c.estimated_cost != null && (
                              <p className="text-xs text-gray-400">💰 Estimado: R$ {c.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-3 shrink-0">
                            <button
                              className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded hover:bg-teal-100"
                              onClick={() => calls.markDone(c.id)}>✓ Resolvido</button>
                            <button className="text-xs text-gray-400 hover:text-teal-600"
                              onClick={() => { setSelectedCall(c); setCallOpen(true) }}>✏️</button>
                            <button className="text-xs text-red-400 hover:text-red-600"
                              onClick={() => { if (confirm('Remover conserto?')) calls.remove(c.id) }}>×</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Agendados */}
              {calls.scheduled.length > 0 && (
                <div className="rounded-xl border bg-white overflow-hidden">
                  <div className="px-4 py-3 bg-blue-50 border-b">
                    <h3 className="text-sm font-semibold text-blue-800">📅 Agendados ({calls.scheduled.length})</h3>
                  </div>
                  <div className="divide-y">
                    {calls.scheduled.map(c => {
                      const prio = PRIORITY_BADGE[c.priority ?? 2]
                      return (
                        <div key={c.id} className="flex items-start justify-between px-4 py-3 hover:bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-800">{c.title}</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prio.cls}`}>{prio.label}</span>
                              {c.scheduled_date && (
                                <span className="text-xs text-blue-600 font-medium">📅 {formatDate(c.scheduled_date)}</span>
                              )}
                            </div>
                            {c.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{c.description}</p>}
                            {c.professional_name && (
                              <p className="text-xs text-gray-400 mt-0.5">👷 {c.professional_name}{c.professional_phone ? ` · ${c.professional_phone}` : ''}</p>
                            )}
                            {c.estimated_cost != null && (
                              <p className="text-xs text-gray-400">💰 R$ {c.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-3 shrink-0">
                            <button
                              className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded hover:bg-teal-100"
                              onClick={() => calls.markDone(c.id)}>✓ Resolvido</button>
                            <button className="text-xs text-gray-400 hover:text-teal-600"
                              onClick={() => { setSelectedCall(c); setCallOpen(true) }}>✏️</button>
                            <button className="text-xs text-red-400 hover:text-red-600"
                              onClick={() => { if (confirm('Remover conserto?')) calls.remove(c.id) }}>×</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Resolvidos — colapsável */}
              {calls.done.length > 0 && (
                <div className="rounded-xl border bg-white overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => setShowDoneCalls(v => !v)}
                  >
                    <h3 className="text-sm font-semibold text-gray-600">✅ Resolvidos ({calls.done.length})</h3>
                    <span className="text-gray-400 text-xs">{showDoneCalls ? '▲ Ocultar' : '▼ Ver histórico'}</span>
                  </button>
                  {showDoneCalls && (
                    <div className="divide-y">
                      {calls.done.map(c => (
                        <div key={c.id} className="flex items-start justify-between px-4 py-3 opacity-60">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-700 line-through">{c.title}</p>
                            {c.completed_at && (
                              <p className="text-xs text-gray-400">Resolvido em {formatDate(c.completed_at)}</p>
                            )}
                            {c.professional_name && (
                              <p className="text-xs text-gray-400">👷 {c.professional_name}</p>
                            )}
                          </div>
                          <button className="text-xs text-red-400 hover:text-red-600 ml-3"
                            onClick={() => { if (confirm('Remover do histórico?')) calls.remove(c.id) }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══ BLOCO E — COMPRAS ══ */}
      {tab === 'compras' && (
        <div className="space-y-6">
          {shopping.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : shopping.items.length === 0 ? (
            <EmptyState emoji="🛒" title="Lista Vazia" description="Adicione os produtos que estão a acabar em casa." />
          ) : (
            <>
              {runningOut.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h3 className="text-yellow-800 font-semibold mb-3">⚠️ A Acabar (Prioridade)</h3>
                  <div className="space-y-2">
                    {runningOut.map(i => (
                      <div key={i.id} className="flex items-center justify-between bg-white p-3 rounded shadow-sm">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="w-5 h-5 accent-teal-600" onChange={() => handleToggleBuy(i)} />
                          <div>
                            <p className="font-medium">{i.name}</p>
                            {i.quantity && <p className="text-xs text-gray-500">{i.quantity}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedItem(i); setShoppingOpen(true) }} className="text-gray-400 text-sm hover:text-gray-600">Editar</button>
                          <button onClick={() => shopping.remove(i.id)} className="text-red-400 text-sm hover:text-red-600">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {needed.length > 0 && (
                <div>
                  <h3 className="text-gray-700 font-medium mb-3">A Comprar</h3>
                  <div className="space-y-2">
                    {needed.map(i => (
                      <div key={i.id} className="flex items-center justify-between bg-white border p-3 rounded">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="w-5 h-5 accent-teal-600" onChange={() => handleToggleBuy(i)} />
                          <div>
                            <p className="font-medium text-gray-800">{i.name}</p>
                            {i.quantity && <p className="text-xs text-gray-500">{i.quantity}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedItem(i); setShoppingOpen(true) }} className="text-gray-400 text-sm hover:text-gray-600">Editar</button>
                          <button onClick={() => shopping.remove(i.id)} className="text-red-400 text-sm hover:text-red-600">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {boughtRecurring.length > 0 && (
                <div className="opacity-70">
                  <h3 className="text-gray-500 font-medium mb-3 text-sm">🔄 Recorrentes em Stock (Comprados)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {boughtRecurring.map(i => (
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

      {/* Sheets */}
      <WardrobeSheet
        open={wardrobeOpen}
        onClose={() => setWardrobeOpen(false)}
        item={selectedWardrobe}
        onSave={wardrobe.upsert}
        members={members}
      />
      <MaintenanceSheet
        open={maintOpen}
        onClose={() => setMaintOpen(false)}
        item={selectedMaint}
        onSave={maintenance.upsert}
        members={members}
      />
      <MaintenanceCallSheet
        open={callOpen}
        onClose={() => setCallOpen(false)}
        call={selectedCall}
        onSave={calls.upsert}
        members={members}
      />
      <ShoppingSheet
        open={shoppingOpen}
        onClose={() => setShoppingOpen(false)}
        item={selectedItem}
        onSave={shopping.upsert}
      />
      <MedicationSheet
        open={medOpen}
        onClose={() => setMedOpen(false)}
        medication={selectedMed}
        onSave={upsertMed}
        members={members}
      />
    </div>
  )
}

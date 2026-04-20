'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useSchoolCommunications } from '@/hooks/useSchoolCommunications'
import { useSchoolHomework } from '@/hooks/useSchoolHomework'
import { useSchoolSupplies } from '@/hooks/useSchoolSupplies'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { SchoolCommunicationSheet } from '@/components/sheets/SchoolCommunicationSheet'
import { SchoolHomeworkSheet } from '@/components/sheets/SchoolHomeworkSheet'
import { SchoolSupplySheet } from '@/components/sheets/SchoolSupplySheet'
import type { SchoolCommunication, SchoolHomework, SchoolSupply } from '@/types/database'

// ─── helpers ────────────────────────────────────────────────────────────────
const COMM_TYPE_LABEL: Record<string, string> = {
  whatsapp: '💬 WhatsApp',
  email:    '📧 E-mail',
  reuniao:  '🗓️ Reunião',
  telefone: '📞 Telefone',
  outro:    '📝 Outro',
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:     { label: '⏳ Pendente',    cls: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: '🔄 Andamento',  cls: 'bg-blue-100 text-blue-700' },
  done:        { label: '✅ Concluído',  cls: 'bg-green-100 text-green-700' },
}

const SUPPLY_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  needed:      { label: '🛒 A comprar',  cls: 'bg-blue-100 text-blue-700' },
  running_out: { label: '⚠️ Acabando',  cls: 'bg-yellow-100 text-yellow-700' },
  bought:      { label: '✅ Comprado',   cls: 'bg-green-100 text-green-700' },
}

const SUPPLY_CATEGORY_LABEL: Record<string, string> = {
  material: '📦 Material',
  uniforme: '👕 Uniforme',
  livro:    '📚 Livro',
  sazonal:  '🍂 Sazonal',
  outro:    '📝 Outro',
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function dueBadge(due: string | null): { label: string; cls: string } | null {
  if (!due) return null
  const days = Math.ceil((new Date(due + 'T00:00:00').getTime() - Date.now()) / 86400000)
  if (days < 0)   return { label: `🔴 Atrasado ${Math.abs(days)}d`, cls: 'bg-red-100 text-red-700' }
  if (days === 0) return { label: '🟠 Hoje',                        cls: 'bg-orange-100 text-orange-700' }
  if (days <= 3)  return { label: `🟡 ${days}d`,                    cls: 'bg-yellow-100 text-yellow-700' }
  return            { label: `🟢 ${formatDate(due)}`,               cls: 'bg-green-100 text-green-700' }
}

function supplySituation(have: number, need: number) {
  if (have >= need) return { label: '🟢 OK',   cls: 'bg-green-100 text-green-700' }
  if (have > 0)     return { label: '🟡 Parcial', cls: 'bg-yellow-100 text-yellow-700' }
  return              { label: '🔴 Falta',   cls: 'bg-red-100 text-red-700' }
}

type Tab = 'comunicacao' | 'material' | 'licoes' | 'compras'

// ════════════════════════════════════════════════════════════════════════════
export default function EducacaoPage() {
  const { members } = useFamilyStore()
  const communications = useSchoolCommunications()
  const homework       = useSchoolHomework()
  const supplies       = useSchoolSupplies()

  const [tab, setTab] = useState<Tab>('comunicacao')
  const [filterMember, setFilterMember] = useState<string>('all')

  const [commOpen, setCommOpen]       = useState(false)
  const [selectedComm, setSelectedComm] = useState<SchoolCommunication | null>(null)

  const [hwOpen, setHwOpen]           = useState(false)
  const [selectedHw, setSelectedHw]   = useState<SchoolHomework | null>(null)

  const [supplyOpen, setSupplyOpen]   = useState(false)
  const [selectedSupply, setSelectedSupply] = useState<SchoolSupply | null>(null)
  const [supplyDefaultCategory, setSupplyDefaultCategory] = useState<SchoolSupply['category']>('material')

  const getMemberName = (id: string | null) => {
    if (!id) return 'Família'
    const m = members.find(x => x.id === id)
    return m?.nickname ?? m?.name ?? '—'
  }

  const filterByMember = <T extends { profile_id: string | null }>(list: T[]) =>
    filterMember === 'all' ? list : list.filter(i => i.profile_id === filterMember)

  const filteredComms = filterByMember(communications.items)
  const filteredHw    = filterByMember(homework.items)

  // Material tab = inventário completo (todos os itens da família).
  // Compras tab = mesmos itens, agrupados por status (lista de compras).
  const allSupplies   = filterByMember(supplies.items)
  const runningOut    = allSupplies.filter(i => i.status === 'running_out')
  const needed        = allSupplies.filter(i => i.status === 'needed')
  const boughtCompras = allSupplies.filter(i => i.status === 'bought')

  // Alert counts per tab
  const commAlerts = communications.items.filter(i => {
    if (i.status === 'done') return false
    if (!i.due_date) return false
    const days = Math.ceil((new Date(i.due_date + 'T00:00:00').getTime() - Date.now()) / 86400000)
    return days <= 3
  }).length
  const hwAlerts = homework.items.filter(i => {
    if (i.status === 'done') return false
    if (!i.due_date) return false
    const days = Math.ceil((new Date(i.due_date + 'T00:00:00').getTime() - Date.now()) / 86400000)
    return days <= 3
  }).length
  const materialAlerts = supplies.items.filter(i =>
    i.status !== 'bought' && (i.quantity_have ?? 0) < (i.quantity_need ?? 1)
  ).length
  const comprasAlerts = supplies.items.filter(i => i.status === 'running_out').length

  const TABS: { id: Tab; label: string; alerts: number }[] = [
    { id: 'comunicacao', label: '💬 Comunicação',       alerts: commAlerts },
    { id: 'material',    label: '📦 Material',           alerts: materialAlerts },
    { id: 'licoes',      label: '✏️ Lições',            alerts: hwAlerts },
    { id: 'compras',     label: '🛒 Compras Escolares', alerts: comprasAlerts },
  ]

  const handleToggleBuy = (item: SchoolSupply) => {
    if (item.status === 'needed' || item.status === 'running_out') {
      supplies.updateStatus(item.id, 'bought')
    } else {
      supplies.updateStatus(item.id, 'needed')
    }
  }

  const openNewSupply = (category: SchoolSupply['category']) => {
    setSelectedSupply(null)
    setSupplyDefaultCategory(category)
    setSupplyOpen(true)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        emoji="📚"
        title="Educação"
        description="Comunicação, material, lições e compras escolares das crianças"
        action={
          tab === 'comunicacao' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedComm(null); setCommOpen(true) }}>+ Comunicação</button>
          ) : tab === 'material' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => openNewSupply('material')}>+ Item</button>
          ) : tab === 'licoes' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedHw(null); setHwOpen(true) }}>+ Lição</button>
          ) : tab === 'compras' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => openNewSupply('material')}>+ Compra</button>
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

      {/* Filter member */}
      {(
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

      {/* ══ BLOCO A — COMUNICAÇÃO ══ */}
      {tab === 'comunicacao' && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {communications.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : filteredComms.length === 0 ? (
            <EmptyState
              emoji="💬"
              title="Nenhuma comunicação registrada"
              description="Grupos WhatsApp, e-mails de professores, reuniões — tudo num lugar só."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">📝 Assunto</th>
                    <th className="px-4 py-3 text-left">👤 Criança</th>
                    <th className="px-4 py-3 text-left">📡 Canal</th>
                    <th className="px-4 py-3 text-left">📅 Prazo</th>
                    <th className="px-4 py-3 text-left">🚦 Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredComms.map(i => {
                    const st = STATUS_BADGE[i.status] ?? { label: i.status, cls: 'bg-gray-100 text-gray-600' }
                    const due = dueBadge(i.due_date)
                    return (
                      <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{i.title}</div>
                          {i.description && <div className="text-xs text-gray-500 truncate max-w-[280px]">{i.description}</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{getMemberName(i.profile_id)}</td>
                        <td className="px-4 py-3 text-gray-600">{COMM_TYPE_LABEL[i.type] ?? i.type}</td>
                        <td className="px-4 py-3">
                          {due ? <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${due.cls}`}>{due.label}</span> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            {i.status !== 'done' && (
                              <button className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded hover:bg-teal-100 transition-colors"
                                onClick={() => communications.markDone(i.id)}>✓ Feito</button>
                            )}
                            <button className="text-xs text-teal-600 hover:underline"
                              onClick={() => { setSelectedComm(i); setCommOpen(true) }}>Editar</button>
                            <button className="text-xs text-red-400 hover:text-red-600"
                              onClick={() => { if (confirm('Remover comunicação?')) communications.remove(i.id) }}>×</button>
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

      {/* ══ BLOCO B — MATERIAL ══ */}
      {tab === 'material' && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {supplies.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : allSupplies.length === 0 ? (
            <EmptyState
              emoji="📦"
              title="Nenhum material cadastrado"
              description="Cadastre a lista inicial, reposições e uniformes para etiquetar."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">🏷️ Item</th>
                    <th className="px-4 py-3 text-left">📚 Categoria</th>
                    <th className="px-4 py-3 text-left">👤 Criança</th>
                    <th className="px-4 py-3 text-left">📦 Tem / Precisa</th>
                    <th className="px-4 py-3 text-left">🚦 Situação</th>
                    <th className="px-4 py-3 text-left">🔘 Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allSupplies.map(i => {
                    const sit = supplySituation(i.quantity_have ?? 0, i.quantity_need ?? 1)
                    const st  = SUPPLY_STATUS_BADGE[i.status] ?? { label: i.status, cls: 'bg-gray-100 text-gray-600' }
                    return (
                      <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{i.name}</td>
                        <td className="px-4 py-3 text-gray-500">{SUPPLY_CATEGORY_LABEL[i.category] ?? i.category}</td>
                        <td className="px-4 py-3 text-gray-600">{getMemberName(i.profile_id)}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold">{i.quantity_have ?? 0}</span>
                          <span className="text-gray-400"> / {i.quantity_need ?? 1}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sit.cls}`}>{sit.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <button className="text-xs text-teal-600 hover:underline"
                              onClick={() => { setSelectedSupply(i); setSupplyDefaultCategory(i.category); setSupplyOpen(true) }}>Editar</button>
                            <button className="text-xs text-red-400 hover:text-red-600"
                              onClick={() => { if (confirm('Remover item?')) supplies.remove(i.id) }}>×</button>
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

      {/* ══ BLOCO C — LIÇÕES ══ */}
      {tab === 'licoes' && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {homework.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : filteredHw.length === 0 ? (
            <EmptyState
              emoji="✏️"
              title="Nenhuma lição cadastrada"
              description="Tarefas diárias, projetos e prazos das crianças."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">📝 Título</th>
                    <th className="px-4 py-3 text-left">📚 Disciplina</th>
                    <th className="px-4 py-3 text-left">👤 Criança</th>
                    <th className="px-4 py-3 text-left">📅 Prazo</th>
                    <th className="px-4 py-3 text-left">🏷️ Tipo</th>
                    <th className="px-4 py-3 text-left">🚦 Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredHw.map(i => {
                    const st = STATUS_BADGE[i.status] ?? { label: i.status, cls: 'bg-gray-100 text-gray-600' }
                    const due = dueBadge(i.due_date)
                    return (
                      <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{i.title}</div>
                          {i.description && <div className="text-xs text-gray-500 truncate max-w-[280px]">{i.description}</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{i.subject}</td>
                        <td className="px-4 py-3 text-gray-600">{getMemberName(i.profile_id)}</td>
                        <td className="px-4 py-3">
                          {due ? <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${due.cls}`}>{due.label}</span> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {i.is_project && <span className="mr-1 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">🎨 Projeto</span>}
                          {i.needs_help && <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">🆘 Ajuda</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            {i.status !== 'done' && (
                              <button className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded hover:bg-teal-100 transition-colors"
                                onClick={() => homework.markDone(i.id)}>✓ Feito</button>
                            )}
                            <button className="text-xs text-teal-600 hover:underline"
                              onClick={() => { setSelectedHw(i); setHwOpen(true) }}>Editar</button>
                            <button className="text-xs text-red-400 hover:text-red-600"
                              onClick={() => { if (confirm('Remover lição?')) homework.remove(i.id) }}>×</button>
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

      {/* ══ BLOCO D — COMPRAS ESCOLARES ══ */}
      {tab === 'compras' && (
        <div className="space-y-6">
          {supplies.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : allSupplies.length === 0 ? (
            <EmptyState emoji="🛒" title="Lista vazia" description="Adicione itens escolares (material básico, uniformes, livros, sazonais)." />
          ) : runningOut.length + needed.length + boughtCompras.length === 0 ? (
            <EmptyState emoji="✅" title="Nada pendente" description="Todos os itens já estão resolvidos para essa seleção." />
          ) : (
            <>
              {runningOut.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h3 className="text-yellow-800 font-semibold mb-3">⚠️ Acabando (prioridade)</h3>
                  <div className="space-y-2">
                    {runningOut.map(i => (
                      <div key={i.id} className="flex items-center justify-between bg-white p-3 rounded shadow-sm">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="w-5 h-5 accent-teal-600" onChange={() => handleToggleBuy(i)} />
                          <div>
                            <p className="font-medium">{i.name}</p>
                            <p className="text-xs text-gray-500">
                              {SUPPLY_CATEGORY_LABEL[i.category] ?? i.category} · {getMemberName(i.profile_id)}
                              {i.season ? ` · 🌤️ ${i.season}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedSupply(i); setSupplyDefaultCategory(i.category); setSupplyOpen(true) }} className="text-gray-400 text-sm hover:text-gray-600">Editar</button>
                          <button onClick={() => supplies.remove(i.id)} className="text-red-400 text-sm hover:text-red-600">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {needed.length > 0 && (
                <div>
                  <h3 className="text-gray-700 font-medium mb-3">A comprar</h3>
                  <div className="space-y-2">
                    {needed.map(i => (
                      <div key={i.id} className="flex items-center justify-between bg-white border p-3 rounded">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="w-5 h-5 accent-teal-600" onChange={() => handleToggleBuy(i)} />
                          <div>
                            <p className="font-medium text-gray-800">{i.name}</p>
                            <p className="text-xs text-gray-500">
                              {SUPPLY_CATEGORY_LABEL[i.category] ?? i.category} · {getMemberName(i.profile_id)}
                              {i.season ? ` · 🌤️ ${i.season}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedSupply(i); setSupplyDefaultCategory(i.category); setSupplyOpen(true) }} className="text-gray-400 text-sm hover:text-gray-600">Editar</button>
                          <button onClick={() => supplies.remove(i.id)} className="text-red-400 text-sm hover:text-red-600">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {boughtCompras.length > 0 && (
                <div className="opacity-70">
                  <h3 className="text-gray-500 font-medium mb-3 text-sm">✅ Comprados</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {boughtCompras.map(i => (
                      <div key={i.id} className="flex items-center justify-between bg-gray-50 border p-2 rounded text-sm">
                        <span className="text-gray-500 line-through truncate">{i.name}</span>
                        <button
                          onClick={() => handleToggleBuy(i)}
                          className="text-teal-600 font-medium text-xs bg-teal-50 px-2 py-1 rounded hover:bg-teal-100"
                        >Repor</button>
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
      <SchoolCommunicationSheet
        open={commOpen}
        onClose={() => setCommOpen(false)}
        item={selectedComm}
        onSave={communications.upsert}
        members={members}
      />
      <SchoolHomeworkSheet
        open={hwOpen}
        onClose={() => setHwOpen(false)}
        item={selectedHw}
        onSave={homework.upsert}
        members={members}
      />
      <SchoolSupplySheet
        open={supplyOpen}
        onClose={() => setSupplyOpen(false)}
        item={selectedSupply}
        defaultCategory={supplyDefaultCategory}
        onSave={supplies.upsert}
        members={members}
      />
    </div>
  )
}

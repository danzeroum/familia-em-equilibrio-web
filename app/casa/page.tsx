'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useWardrobe } from '@/hooks/useWardrobe'
import { useMedications } from '@/hooks/useMedications'
import { useHomeMaintenance } from '@/hooks/useHomeMaintenance'
import { PageHeader } from '@/components/ui/PageHeader'
import { WardrobeSheet } from '@/components/sheets/WardrobeSheet'
import { MaintenanceSheet } from '@/components/sheets/MaintenanceSheet'
import type { WardrobeItem, Medication, HomeMaintenance } from '@/types/database'

// ─── helpers ───────────────────────────────────────────────────────────────
const SEASON_LABEL: Record<string, string> = { summer: '☀️ Verão', winter: '❄️ Inverno', all: '🔄 Todas' }
const WARDROBE_STATUS: Record<string, { label: string; cls: string }> = {
  fitting:  { label: '✅ Serve',    cls: 'bg-green-100 text-green-700' },
  outgrown: { label: '📦 Pequeno', cls: 'bg-orange-100 text-orange-700' },
  to_buy:   { label: '🛒 Comprar', cls: 'bg-blue-100 text-blue-700' },
  donate:   { label: '🎁 Doação',  cls: 'bg-purple-100 text-purple-700' },
}

function situationBadge(qty: number, min: number): { label: string; cls: string } {
  if (qty >= min) return { label: '🟢 OK', cls: 'bg-green-100 text-green-700' }
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

// ─── tab types ──────────────────────────────────────────────────────────────
type Tab = 'vestuario' | 'medicamentos' | 'manutencao'

// ═══════════════════════════════════════════════════════════════════════════
export default function CasaPage() {
  const { members } = useFamilyStore()
  const wardrobe = useWardrobe()
  const medications = useMedications()
  const maintenance = useHomeMaintenance()

  const [tab, setTab] = useState<Tab>('vestuario')
  const [filterMember, setFilterMember] = useState<string>('all')

  // wardrobe sheet
  const [wardrobeOpen, setWardrobeOpen] = useState(false)
  const [selectedWardrobe, setSelectedWardrobe] = useState<WardrobeItem | null>(null)

  // maintenance sheet
  const [maintOpen, setMaintOpen] = useState(false)
  const [selectedMaint, setSelectedMaint] = useState<HomeMaintenance | null>(null)

  // derived
  const filteredWardrobe = filterMember === 'all'
    ? wardrobe.items
    : wardrobe.items.filter(i => i.profile_id === filterMember)

  const wardrobeAlerts = wardrobe.items.filter(i => i.needsRestock).length
  const medAlerts = medications.items.filter(i =>
    (i.stock_quantity < (i.minimum_stock ?? 1)) ||
    (i.expiry_date && Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / 86400000) <= 30)
  ).length
  const maintAlerts = maintenance.items.filter(i => i.alertLevel !== 'ok').length

  const getMemberName = (id: string | null) => {
    if (!id) return 'Família'
    return members.find(m => m.id === id)?.nickname ?? members.find(m => m.id === id)?.name ?? '—'
  }

  const TABS = [
    { id: 'vestuario' as Tab,    label: '🧥 Vestuário',       alerts: wardrobeAlerts },
    { id: 'medicamentos' as Tab, label: '💊 Med. & Primeiros Socorros', alerts: medAlerts },
    { id: 'manutencao' as Tab,   label: '🛠️ Manutenção',     alerts: maintAlerts },
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
          ) : tab === 'manutencao' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedMaint(null); setMaintOpen(true) }}>+ Manutenção</button>
          ) : null
        }
      />

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b">
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.alerts > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{t.alerts}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          BLOCO A — VESTUÁRIO
      ══════════════════════════════════════════════════════ */}
      {tab === 'vestuario' && (
        <div className="space-y-4">
          {/* Filtro membro */}
          <div className="flex gap-2 flex-wrap">
            {[{ id: 'all', label: 'Todos' }, ...members.map(m => ({ id: m.id, label: m.nickname ?? m.name }))].map(opt => (
              <button key={opt.id}
                onClick={() => setFilterMember(opt.id)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  filterMember === opt.id ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 text-gray-600 hover:border-teal-400'
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
                      <th className="px-4 py-3 text-left">📦 Qtd / Mínimo</th>
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
                      const st = WARDROBE_STATUS[i.status] ?? { label: i.status, cls: 'bg-gray-100 text-gray-600' }
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

      {/* ══════════════════════════════════════════════════════
          BLOCO B — MEDICAMENTOS & PRIMEIROS SOCORROS
      ══════════════════════════════════════════════════════ */}
      {tab === 'medicamentos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Medicamentos e itens de primeiros socorros da família.</p>
            <a href="/saude" className="text-sm text-teal-600 hover:underline font-medium">Gerenciar em Saúde →</a>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden">
            {medications.isLoading ? (
              <div className="p-8 text-center text-gray-400">Carregando...</div>
            ) : medications.items.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-3xl mb-2">💊</p>
                <p className="text-gray-500 font-medium">Nenhum medicamento cadastrado</p>
                <p className="text-sm text-gray-400 mt-1">Acesse a seção Saúde para adicionar.</p>
              </div>
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
                      <th className="px-4 py-3 text-left">🔘 Condição</th>
                      <th className="px-4 py-3 text-left">🛒 Ação</th>
                      <th className="px-4 py-3 text-left">📅 Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {medications.items.map(i => {
                      const sit = situationBadge(i.stock_quantity ?? 0, i.minimum_stock ?? 1)
                      const exp = expiryBadge(i.expiry_date)
                      const condMap: Record<string, string> = {
                        ok: '✅ OK', broken: '❌ Quebrado', missing: '⚠️ Falta', needs_check: '🔍 Verificar'
                      }
                      const cond = condMap[(i as any).item_condition ?? 'ok'] ?? '✅ OK'
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
                          <td className="px-4 py-3 text-gray-600">{cond}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{(i as any).action_description || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{formatDate((i as any).action_date)}</td>
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

      {/* ══════════════════════════════════════════════════════
          BLOCO C — MANUTENÇÃO PROGRAMADA
      ══════════════════════════════════════════════════════ */}
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
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {i.emoji} {i.title}
                          </td>
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

      {/* ── Sheets ── */}
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
    </div>
  )
}

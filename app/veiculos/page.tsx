'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useVehicles } from '@/hooks/useVehicles'
import { useVehicleDocuments } from '@/hooks/useVehicleDocuments'
import { useVehicleMaintenance } from '@/hooks/useVehicleMaintenance'
import { useVehicleCalls } from '@/hooks/useVehicleCalls'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { VehicleSheet } from '@/components/sheets/VehicleSheet'
import { VehicleDocumentSheet } from '@/components/sheets/VehicleDocumentSheet'
import { VehicleMaintenanceSheet } from '@/components/sheets/VehicleMaintenanceSheet'
import { VehicleCallSheet } from '@/components/sheets/VehicleCallSheet'
import type { Vehicle, VehicleDocument, VehicleMaintenance, VehicleCall } from '@/types/database'

// ─── helpers ───────────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  car:        '🚗 Carro',
  motorcycle: '🏍️ Moto',
  ebike:      '⚡ Bike elétrica',
  bike:       '🚲 Bicicleta',
  scooter:    '🛴 Patinete',
}

const FUEL_LABEL: Record<string, string> = {
  gasoline: '⛽ Gasolina',
  ethanol:  '🌽 Etanol',
  flex:     '🔀 Flex',
  diesel:   '🛢️ Diesel',
  electric: '⚡ Elétrico',
  hybrid:   '🔋 Híbrido',
  none:     '—',
}

const DOC_TYPE_LABEL: Record<string, string> = {
  ipva:          '🧾 IPVA',
  licenciamento: '📄 Licenciamento',
  seguro:        '🛡️ Seguro',
  dpvat:         '🚑 DPVAT',
  vistoria:      '🔍 Vistoria',
  crlv:          '📋 CRLV',
  outro:         '📎 Outro',
}

const DOC_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: '⏳ Pendente', cls: 'bg-orange-100 text-orange-700' },
  paid:    { label: '✅ Pago',     cls: 'bg-green-100 text-green-700' },
  overdue: { label: '⚠️ Vencido',  cls: 'bg-red-100 text-red-700' },
  renewed: { label: '🔄 Renovado', cls: 'bg-blue-100 text-blue-700' },
}

const MAINT_STATUS: Record<string, { label: string; cls: string }> = {
  ok:       { label: '✅ Em dia',     cls: 'bg-green-100 text-green-700' },
  due_soon: { label: '🟡 Próximo',    cls: 'bg-yellow-100 text-yellow-700' },
  overdue:  { label: '🔴 Vencido',    cls: 'bg-red-100 text-red-700' },
  done:     { label: '✔️ Feito',      cls: 'bg-gray-100 text-gray-600' },
}

const CALL_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: '⏳ Pendente',  cls: 'bg-orange-100 text-orange-700' },
  scheduled: { label: '📅 Agendado',  cls: 'bg-blue-100 text-blue-700' },
  done:      { label: '✅ Resolvido', cls: 'bg-green-100 text-green-700' },
}

const PRIORITY_BADGE: Record<number, { label: string; cls: string }> = {
  1: { label: '🔴 Crítico',      cls: 'bg-red-100 text-red-700' },
  2: { label: '🟡 Importante',   cls: 'bg-yellow-100 text-yellow-700' },
  3: { label: '⚪ Quando puder', cls: 'bg-gray-100 text-gray-600' },
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function dueBadge(due: string | null): { label: string; cls: string } {
  if (!due) return { label: '—', cls: 'text-gray-400' }
  const days = Math.ceil((new Date(due).getTime() - Date.now()) / 86400000)
  if (days < 0)   return { label: `🔴 ${Math.abs(days)}d atrás`, cls: 'bg-red-100 text-red-700' }
  if (days <= 30) return { label: `🟡 ${days}d`,                 cls: 'bg-yellow-100 text-yellow-700' }
  return { label: `🟢 ${formatDate(due)}`, cls: 'bg-green-100 text-green-700' }
}

type Tab = 'frota' | 'documentos' | 'manutencao' | 'reparos'

// ═══════════════════════════════════════════════════════════════════════════════
export default function VeiculosPage() {
  const { members } = useFamilyStore()
  const vehicles    = useVehicles()
  const documents   = useVehicleDocuments()
  const maintenance = useVehicleMaintenance()
  const calls       = useVehicleCalls()

  const [tab, setTab] = useState<Tab>('frota')
  const [filterVehicle, setFilterVehicle] = useState<string>('all')
  const [showDoneCalls, setShowDoneCalls] = useState(false)

  const [vehicleOpen, setVehicleOpen]     = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  const [docOpen, setDocOpen]             = useState(false)
  const [selectedDoc, setSelectedDoc]     = useState<VehicleDocument | null>(null)

  const [maintOpen, setMaintOpen]         = useState(false)
  const [selectedMaint, setSelectedMaint] = useState<VehicleMaintenance | null>(null)

  const [callOpen, setCallOpen]           = useState(false)
  const [selectedCall, setSelectedCall]   = useState<VehicleCall | null>(null)

  const getMemberName = (id: string | null) => {
    if (!id) return 'Família'
    return members.find(m => m.id === id)?.nickname ?? members.find(m => m.id === id)?.name ?? '—'
  }
  const getVehicleName = (id: string) => vehicles.items.find(v => v.id === id)?.nickname ?? '—'

  const byVehicle = <T extends { vehicle_id?: string }>(arr: T[]) =>
    filterVehicle === 'all' ? arr : arr.filter(i => i.vehicle_id === filterVehicle)

  const filteredDocs   = byVehicle(documents.items)
  const filteredMaint  = byVehicle(maintenance.items)
  const filteredCalls  = byVehicle(calls.items)

  const docAlerts   = documents.items.filter(i =>
    i.status !== 'paid' && i.status !== 'renewed' && i.due_date &&
    Math.ceil((new Date(i.due_date).getTime() - Date.now()) / 86400000) <= 30
  ).length
  const maintAlerts = maintenance.items.filter(i => i.status === 'due_soon' || i.status === 'overdue').length
  const callAlerts  = calls.items.filter(c => c.status !== 'done').length

  const TABS = [
    { id: 'frota'      as Tab, label: '🚗 Frota',      alerts: 0 },
    { id: 'documentos' as Tab, label: '📄 Documentos', alerts: docAlerts },
    { id: 'manutencao' as Tab, label: '🔧 Manutenção', alerts: maintAlerts },
    { id: 'reparos'    as Tab, label: '🛠️ Reparos',   alerts: callAlerts },
  ]

  const noVehicles = vehicles.items.length === 0

  const pendingCalls   = filteredCalls.filter(c => c.status === 'pending')
  const scheduledCalls = filteredCalls.filter(c => c.status === 'scheduled')
  const doneCalls      = filteredCalls.filter(c => c.status === 'done')

  return (
    <div className="space-y-5">
      <PageHeader
        emoji="🚗"
        title="Veículos"
        description="Carros, motos e bikes: documentos, manutenção e reparos"
        action={
          tab === 'frota' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedVehicle(null); setVehicleOpen(true) }}>+ Veículo</button>
          ) : tab === 'documentos' ? (
            <button
              className="text-sm text-teal-600 font-medium hover:underline disabled:opacity-40 disabled:no-underline"
              disabled={noVehicles}
              onClick={() => { setSelectedDoc(null); setDocOpen(true) }}
            >+ Documento</button>
          ) : tab === 'manutencao' ? (
            <button
              className="text-sm text-teal-600 font-medium hover:underline disabled:opacity-40 disabled:no-underline"
              disabled={noVehicles}
              onClick={() => { setSelectedMaint(null); setMaintOpen(true) }}
            >+ Manutenção</button>
          ) : tab === 'reparos' ? (
            <button
              className="text-sm text-teal-600 font-medium hover:underline disabled:opacity-40 disabled:no-underline"
              disabled={noVehicles}
              onClick={() => { setSelectedCall(null); setCallOpen(true) }}
            >+ Reparo</button>
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

      {/* Filtro por veículo (não aparece na aba Frota) */}
      {tab !== 'frota' && vehicles.items.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {[{ id: 'all', label: 'Todos' }, ...vehicles.items.map(v => ({ id: v.id, label: v.nickname }))].map(opt => (
            <button key={opt.id}
              onClick={() => setFilterVehicle(opt.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                filterVehicle === opt.id
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'border-gray-200 text-gray-600 hover:border-teal-400'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* ══ FROTA ══ */}
      {tab === 'frota' && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {vehicles.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : vehicles.items.length === 0 ? (
            <EmptyState
              emoji="🚗"
              title="Nenhum veículo cadastrado"
              description="Adicione carros, motos ou bikes da família para gerenciar documentos e manutenções."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">🏷️ Apelido</th>
                    <th className="px-4 py-3 text-left">🚙 Tipo</th>
                    <th className="px-4 py-3 text-left">🏭 Marca / Modelo</th>
                    <th className="px-4 py-3 text-left">📅 Ano</th>
                    <th className="px-4 py-3 text-left">🎨 Cor</th>
                    <th className="px-4 py-3 text-left">🔢 Placa</th>
                    <th className="px-4 py-3 text-left">⛽ Combustível</th>
                    <th className="px-4 py-3 text-left">🧭 KM</th>
                    <th className="px-4 py-3 text-left">👤 Dono</th>
                    <th className="px-4 py-3 text-left">🚦 Ativo</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vehicles.items.map(v => (
                    <tr key={v.id} className={`hover:bg-gray-50 transition-colors ${!v.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{v.nickname}</td>
                      <td className="px-4 py-3 text-gray-600">{TYPE_LABEL[v.type] ?? v.type}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {v.brand || v.model ? `${v.brand ?? ''} ${v.model ?? ''}`.trim() : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{v.year ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{v.color ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{v.plate ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{v.fuel_type ? FUEL_LABEL[v.fuel_type] ?? v.fuel_type : '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {v.current_km != null ? v.current_km.toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{getMemberName(v.owner_id)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {v.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button className="text-xs text-teal-600 hover:underline"
                            onClick={() => { setSelectedVehicle(v); setVehicleOpen(true) }}>Editar</button>
                          <button className="text-xs text-red-400 hover:underline"
                            onClick={() => { if (confirm(`Remover "${v.nickname}"? Documentos, manutenções e reparos relacionados também serão removidos.`)) vehicles.remove(v.id) }}>×</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ DOCUMENTOS ══ */}
      {tab === 'documentos' && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {documents.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : noVehicles ? (
            <EmptyState emoji="🚗" title="Cadastre um veículo primeiro" description="Adicione um carro ou moto na aba Frota para registrar documentos." />
          ) : filteredDocs.length === 0 ? (
            <EmptyState emoji="📄" title="Nenhum documento" description="IPVA, licenciamento, seguro, DPVAT..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">🏷️ Título</th>
                    <th className="px-4 py-3 text-left">🚗 Veículo</th>
                    <th className="px-4 py-3 text-left">📄 Tipo</th>
                    <th className="px-4 py-3 text-left">📅 Vencimento</th>
                    <th className="px-4 py-3 text-left">⏳ Prazo</th>
                    <th className="px-4 py-3 text-left">💰 Valor</th>
                    <th className="px-4 py-3 text-left">🚦 Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredDocs.map(d => {
                    const st = DOC_STATUS[d.status] ?? { label: d.status, cls: 'bg-gray-100 text-gray-600' }
                    const due = dueBadge(d.due_date)
                    return (
                      <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{d.title}</td>
                        <td className="px-4 py-3 text-gray-600">{getVehicleName(d.vehicle_id)}</td>
                        <td className="px-4 py-3 text-gray-500">{DOC_TYPE_LABEL[d.type] ?? d.type}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(d.due_date)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${due.cls}`}>{due.label}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {d.amount != null ? `R$ ${d.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            {d.status !== 'paid' && d.status !== 'renewed' && (
                              <button
                                className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded hover:bg-teal-100 transition-colors"
                                onClick={() => documents.markPaid(d.id)}
                              >✓ Pago</button>
                            )}
                            <button className="text-xs text-gray-400 hover:text-teal-600"
                              onClick={() => { setSelectedDoc(d); setDocOpen(true) }}>✏️</button>
                            <button className="text-xs text-red-400 hover:text-red-600"
                              onClick={() => { if (confirm('Remover documento?')) documents.remove(d.id) }}>×</button>
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

      {/* ══ MANUTENÇÃO ══ */}
      {tab === 'manutencao' && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {maintenance.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : noVehicles ? (
            <EmptyState emoji="🚗" title="Cadastre um veículo primeiro" description="Adicione um veículo na aba Frota para agendar manutenções." />
          ) : filteredMaint.length === 0 ? (
            <EmptyState emoji="🔧" title="Nenhuma manutenção" description="Óleo, pneus, freios, bateria..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">🏷️ Item</th>
                    <th className="px-4 py-3 text-left">🚗 Veículo</th>
                    <th className="px-4 py-3 text-left">🔁 Frequência</th>
                    <th className="px-4 py-3 text-left">📅 Última</th>
                    <th className="px-4 py-3 text-left">📅 Próxima</th>
                    <th className="px-4 py-3 text-left">🧭 Próxima (km)</th>
                    <th className="px-4 py-3 text-left">👤 Responsável</th>
                    <th className="px-4 py-3 text-left">🚦 Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMaint.map(m => {
                    const st = MAINT_STATUS[m.status] ?? { label: m.status, cls: 'bg-gray-100 text-gray-600' }
                    return (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{m.emoji ? `${m.emoji} ` : ''}{m.title}</td>
                        <td className="px-4 py-3 text-gray-600">{getVehicleName(m.vehicle_id)}</td>
                        <td className="px-4 py-3 text-gray-500">{m.frequency_label}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(m.last_done_at)}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(m.next_due_at)}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {m.next_due_km != null ? m.next_due_km.toLocaleString('pt-BR') : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{getMemberName(m.responsible_id)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <button
                              className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded hover:bg-teal-100 transition-colors"
                              onClick={() => maintenance.markDone(m.id)}
                            >✓ Feito</button>
                            <button className="text-xs text-gray-400 hover:text-teal-600"
                              onClick={() => { setSelectedMaint(m); setMaintOpen(true) }}>✏️</button>
                            <button className="text-xs text-red-400 hover:text-red-600"
                              onClick={() => { if (confirm('Remover?')) maintenance.remove(m.id) }}>×</button>
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

      {/* ══ REPAROS ══ */}
      {tab === 'reparos' && (
        <div className="space-y-5">
          {calls.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : noVehicles ? (
            <EmptyState emoji="🚗" title="Cadastre um veículo primeiro" description="Adicione um veículo na aba Frota para registrar reparos." />
          ) : filteredCalls.length === 0 ? (
            <EmptyState emoji="🛠️" title="Nenhum reparo registrado" description="Registre problemas e acompanhe o reparo." />
          ) : (
            <>
              {pendingCalls.length > 0 && (
                <div className="rounded-xl border bg-white overflow-hidden">
                  <div className="px-4 py-3 bg-orange-50 border-b">
                    <h3 className="text-sm font-semibold text-orange-800">⏳ Pendentes — sem data ({pendingCalls.length})</h3>
                  </div>
                  <div className="divide-y">
                    {pendingCalls.map(c => {
                      const prio = PRIORITY_BADGE[c.priority ?? 2]
                      return (
                        <div key={c.id} className="flex items-start justify-between px-4 py-3 hover:bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-800">{c.title}</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prio.cls}`}>{prio.label}</span>
                              <span className="text-xs text-gray-400">🚗 {getVehicleName(c.vehicle_id)}</span>
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
                              onClick={() => { if (confirm('Remover reparo?')) calls.remove(c.id) }}>×</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {scheduledCalls.length > 0 && (
                <div className="rounded-xl border bg-white overflow-hidden">
                  <div className="px-4 py-3 bg-blue-50 border-b">
                    <h3 className="text-sm font-semibold text-blue-800">📅 Agendados ({scheduledCalls.length})</h3>
                  </div>
                  <div className="divide-y">
                    {scheduledCalls.map(c => {
                      const prio = PRIORITY_BADGE[c.priority ?? 2]
                      return (
                        <div key={c.id} className="flex items-start justify-between px-4 py-3 hover:bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-800">{c.title}</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prio.cls}`}>{prio.label}</span>
                              <span className="text-xs text-gray-400">🚗 {getVehicleName(c.vehicle_id)}</span>
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
                              onClick={() => { if (confirm('Remover reparo?')) calls.remove(c.id) }}>×</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {doneCalls.length > 0 && (
                <div className="rounded-xl border bg-white overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => setShowDoneCalls(v => !v)}
                  >
                    <h3 className="text-sm font-semibold text-gray-600">✅ Resolvidos ({doneCalls.length})</h3>
                    <span className="text-gray-400 text-xs">{showDoneCalls ? '▲ Ocultar' : '▼ Ver histórico'}</span>
                  </button>
                  {showDoneCalls && (
                    <div className="divide-y">
                      {doneCalls.map(c => (
                        <div key={c.id} className="flex items-start justify-between px-4 py-3 opacity-60">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-700 line-through">{c.title}</p>
                            <p className="text-xs text-gray-400">🚗 {getVehicleName(c.vehicle_id)}</p>
                            {c.completed_at && (
                              <p className="text-xs text-gray-400">Resolvido em {formatDate(c.completed_at)}</p>
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

      {/* Sheets */}
      <VehicleSheet
        open={vehicleOpen}
        onClose={() => setVehicleOpen(false)}
        item={selectedVehicle}
        onSave={vehicles.upsert}
        members={members}
      />
      <VehicleDocumentSheet
        open={docOpen}
        onClose={() => setDocOpen(false)}
        item={selectedDoc}
        onSave={documents.upsert}
        vehicles={vehicles.items}
        defaultVehicleId={filterVehicle !== 'all' ? filterVehicle : null}
      />
      <VehicleMaintenanceSheet
        open={maintOpen}
        onClose={() => setMaintOpen(false)}
        item={selectedMaint}
        onSave={maintenance.upsert}
        vehicles={vehicles.items}
        members={members}
        defaultVehicleId={filterVehicle !== 'all' ? filterVehicle : null}
      />
      <VehicleCallSheet
        open={callOpen}
        onClose={() => setCallOpen(false)}
        item={selectedCall}
        onSave={calls.upsert}
        vehicles={vehicles.items}
        defaultVehicleId={filterVehicle !== 'all' ? filterVehicle : null}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useWardrobe } from '@/hooks/useWardrobe'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { WardrobeSheet } from '@/components/sheets/WardrobeSheet'
import type { WardrobeItem } from '@/types/database'

export default function CasaPage() {
  const { members } = useFamilyStore()
  const { items, isLoading, upsert, remove } = useWardrobe()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selected, setSelected] = useState<WardrobeItem | null>(null)
  const [filterMember, setFilterMember] = useState<string>('all')

  const filtered = filterMember === 'all' ? items : items.filter(i => i.profile_id === filterMember)
  const alerts = items.filter(i => i.needsRestock)

  return (
    <div className="space-y-6">
      <PageHeader
        title="🏠 Casa"
        subtitle="Guarda-roupa e itens da casa"
        action={{ label: '+ Item', onClick: () => { setSelected(null); setSheetOpen(true) } }}
      />

      {/* Alertas de reposição */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <h2 className="font-semibold text-yellow-700 mb-2">⚠️ Repor estoque ({alerts.length})</h2>
          <div className="flex flex-wrap gap-2">
            {alerts.map(a => (
              <span key={a.id} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                {a.item_type} — {members.find(m => m.id === a.profile_id)?.nickname ?? 'Família'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filtro por membro */}
      <div className="flex gap-2 flex-wrap">
        <button
          className={`px-3 py-1 rounded-full text-sm border ${filterMember === 'all' ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 text-gray-600'}`}
          onClick={() => setFilterMember('all')}
        >
          Todos
        </button>
        {members.map(m => (
          <button
            key={m.id}
            className={`px-3 py-1 rounded-full text-sm border ${filterMember === m.id ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 text-gray-600'}`}
            onClick={() => setFilterMember(m.id)}
          >
            {m.nickname ?? m.name}
          </button>
        ))}
      </div>

      {/* Tabela de itens */}
      <div className="rounded-xl border bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Nenhum item" description="Adicione itens do guarda-roupa ou da casa." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-left">Membro</th>
                  <th className="px-4 py-2 text-left">Tamanho</th>
                  <th className="px-4 py-2 text-left">Estação</th>
                  <th className="px-4 py-2 text-left">Qtd</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(i => (
                  <tr key={i.id} className={`hover:bg-gray-50 ${i.needsRestock ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-2 font-medium">{i.item_type}</td>
                    <td className="px-4 py-2 text-gray-500">{members.find(m => m.id === i.profile_id)?.nickname ?? '—'}</td>
                    <td className="px-4 py-2">{i.size ?? '—'}</td>
                    <td className="px-4 py-2">{i.season ?? '—'}</td>
                    <td className="px-4 py-2">
                      <span className={i.needsRestock ? 'text-red-600 font-bold' : ''}>
                        {i.quantity}/{i.minimum_quantity ?? 1}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {i.needsRestock ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Repor</span> : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">OK</span>}
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => { setSelected(i); setSheetOpen(true) }}>Editar</button>
                      <button className="text-xs text-red-400 hover:text-red-600" onClick={() => remove(i.id)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <WardrobeSheet open={sheetOpen} onClose={() => setSheetOpen(false)} item={selected} onSave={upsert} members={members} />
    </div>
  )
}

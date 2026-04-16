'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { MemberSheet } from '@/components/sheets/MemberSheet'
import { EmergencyContactSheet } from '@/components/sheets/EmergencyContactSheet'
import type { Profile, EmergencyContact } from '@/types/database'

export default function FamiliaPage() {
  const { currentFamily, members } = useFamilyStore()
  const { contacts, upsert: upsertContact, remove: removeContact } = useEmergencyContacts(currentFamily?.id ?? null)

  const [memberOpen, setMemberOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null)

  const memberColors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    pink: 'bg-pink-100 text-pink-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="👨‍👩‍👧 Família"
        subtitle="Membros e contatos de emergência"
        action={{ label: '+ Membro', onClick: () => { setSelectedMember(null); setMemberOpen(true) } }}
      />

      {/* Cards dos membros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.length === 0 ? (
          <div className="col-span-full">
            <EmptyState title="Nenhum membro" description="Adicione os membros da família para começar." />
          </div>
        ) : (
          members.map(m => (
            <div
              key={m.id}
              className="rounded-xl border bg-white p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setSelectedMember(m); setMemberOpen(true) }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${memberColors[m.color ?? 'blue'] ?? 'bg-gray-100 text-gray-700'}`}>
                  {(m.nickname ?? m.name).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{m.nickname ?? m.name}</p>
                  <p className="text-xs text-gray-400">{m.member_type === 'adult' ? '👤 Adulto' : m.member_type === 'child' ? '👦 Criança' : '🐾 Pet'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                {m.birthdate && <span>🎂 {m.birthdate}</span>}
                {m.blood_type && <span>🩸 {m.blood_type}</span>}
                {m.weight_kg && <span>⚖️ {m.weight_kg}kg</span>}
                {m.height_cm && <span>📏 {m.height_cm}cm</span>}
                {m.school && <span className="col-span-2">🏫 {m.school}</span>}
                {m.health_plan && <span className="col-span-2">🏥 {m.health_plan}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contatos de emergência */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">🚨 Contatos de emergência</h2>
          <button
            className="text-sm text-teal-600 font-medium hover:underline"
            onClick={() => { setSelectedContact(null); setContactOpen(true) }}
          >
            + Adicionar
          </button>
        </div>
        {contacts.length === 0 ? (
          <EmptyState title="Sem contatos" description="Adicione contatos para situações de emergência." />
        ) : (
          <ul className="divide-y">
            {contacts.map(c => (
              <li key={c.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium">{c.name} {c.is_primary && <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full ml-1">Principal</span>}</p>
                  <p className="text-sm text-gray-500">{c.relationship} · {c.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => { setSelectedContact(c); setContactOpen(true) }}>Editar</button>
                  <button className="text-xs text-red-400 hover:text-red-600" onClick={() => removeContact(c.id)}>Remover</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <MemberSheet open={memberOpen} onClose={() => setMemberOpen(false)} member={selectedMember} />
      <EmergencyContactSheet
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        contact={selectedContact}
        onSave={upsertContact}
      />
    </div>
  )
}

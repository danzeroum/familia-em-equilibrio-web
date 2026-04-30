'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useFamilyStore } from '@/store/familyStore'
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { MemberSheet } from '@/components/sheets/MemberSheet'
import { EmergencyContactSheet } from '@/components/sheets/EmergencyContactSheet'
import { CategoryManager } from '@/components/categories/CategoryManager'
import type { Profile, EmergencyContact } from '@/types/database'
import { useAISettings } from '@/hooks/useAISettings'
import { AVAILABLE_MODELS, getModelProvider } from '@/lib/llm-client'

type Tab = 'membros' | 'categorias' | 'ia'

const ROLE_LABEL: Record<string, string> = {
  adult: '👤 Adulto',
  child: '👦 Criança',
  pet:   '🐾 Pet',
}

function ConfiguracoesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = (searchParams.get('tab') as Tab) ?? 'membros'

  const [tab, setTab] = useState<Tab>(initialTab)
  const { currentFamily, members } = useFamilyStore()
  const { contacts, upsert: upsertContact, remove: removeContact } = useEmergencyContacts(currentFamily?.id ?? null)
  const { settings: aiSettings, isLoading: aiLoading, isSaving: aiSaving, save: saveAI, DEFAULT_PROMPT } = useAISettings(currentFamily?.id ?? null)

  const [localModel,  setLocalModel]  = useState<string>('')
  const [localPrompt, setLocalPrompt] = useState<string>('')
  const [localApiKey, setLocalApiKey] = useState<string>('')
  const [showApiKey,  setShowApiKey]  = useState(false)
  const [aiSaved,     setAiSaved]     = useState(false)

  const [memberOpen,       setMemberOpen]       = useState(false)
  const [selectedMember,   setSelectedMember]   = useState<Profile | null>(null)
  const [contactOpen,      setContactOpen]      = useState(false)
  const [selectedContact,  setSelectedContact]  = useState<EmergencyContact | null>(null)

  function handleTabChange(t: Tab) {
    setTab(t)
    router.replace(`/configuracoes?tab=${t}`, { scroll: false })
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'membros',    label: '👨\u200d👩\u200d👧 Membros & Família' },
    { id: 'categorias', label: '🏷️ Categorias' },
    { id: 'ia',         label: '🤖 Assistente IA' },
  ]

  // Provider do modelo atualmente selecionado
  const selectedProvider = localModel ? getModelProvider(localModel as any) : 'ollama'
  const isDeepSeekCloud  = selectedProvider === 'deepseek'

  // Sincroniza estado local quando settings carregam
  useEffect(() => {
    if (!aiLoading) {
      setLocalModel(aiSettings.model_id)
      setLocalPrompt(aiSettings.system_prompt)
      setLocalApiKey(aiSettings.api_key ?? '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiLoading, aiSettings.model_id, aiSettings.system_prompt, aiSettings.api_key])

  async function handleSaveAI() {
    await saveAI({
      model_id:      localModel as any,
      system_prompt: localPrompt,
      provider:      selectedProvider,
      api_key:       isDeepSeekCloud ? localApiKey : '',
    })
    setAiSaved(true)
    setTimeout(() => setAiSaved(false), 3000)
  }

  // Agrupa modelos por provider para exibir no <select>
  const ollamaModels  = AVAILABLE_MODELS.filter(m => m.provider === 'ollama')
  const deepseekCloud = AVAILABLE_MODELS.filter(m => m.provider === 'deepseek')

  return (
    <div className="space-y-5">
      <PageHeader
        emoji="⚙️"
        title="Configurações"
        description="Membros da família e categorias de tarefas"
        action={
          tab === 'membros' ? (
            <button
              className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedMember(null); setMemberOpen(true) }}
            >
              + Membro
            </button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ ABA: MEMBROS ══ */}
      {tab === 'membros' && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-700">Membros da família</h2>
              <button
                className="text-sm text-teal-600 font-medium hover:underline"
                onClick={() => { setSelectedMember(null); setMemberOpen(true) }}
              >
                + Adicionar
              </button>
            </div>
            {members.length === 0 ? (
              <EmptyState
                emoji="👨\u200d👩\u200d👧"
                title="Nenhum membro"
                description="Adicione os membros da família para começar."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map(m => (
                  <div
                    key={m.id}
                    className="rounded-xl border bg-white p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => { setSelectedMember(m); setMemberOpen(true) }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white"
                        style={{ backgroundColor: m.color_hex ?? '#4A90D9' }}
                      >
                        {(m.nickname ?? m.name).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{m.nickname ?? m.name}</p>
                        <p className="text-xs text-gray-400">{ROLE_LABEL[m.role ?? 'adult'] ?? '👤 Adulto'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                      {m.birth_date && <span>🎂 {m.birth_date}</span>}
                      {m.blood_type && <span>🩸 {m.blood_type}</span>}
                      {(m as any).weight_kg  && <span>⚖️ {(m as any).weight_kg}kg</span>}
                      {(m as any).height_cm  && <span>📏 {(m as any).height_cm}cm</span>}
                      {(m as any).school_or_company && <span className="col-span-2">🏫 {(m as any).school_or_company}</span>}
                      {(m as any).health_plan_name  && <span className="col-span-2">🏥 {(m as any).health_plan_name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              <EmptyState
                emoji="🚨"
                title="Sem contatos"
                description="Adicione contatos para situações de emergência."
              />
            ) : (
              <ul className="divide-y">
                {contacts.map(c => (
                  <li key={c.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="font-medium">
                        {c.name}{' '}
                        {c.is_primary && (
                          <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full ml-1">Principal</span>
                        )}
                      </p>
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
        </div>
      )}

      {/* ══ ABA: ASSISTENTE IA ══ */}
      {tab === 'ia' && (
        <div className="space-y-6">
          {aiLoading ? (
            <div className="text-sm text-gray-400 py-8 text-center">Carregando configurações...</div>
          ) : (
            <>
              {/* Modelo */}
              <div className="bg-white rounded-xl border p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">🧠 Modelo de IA</h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Escolha qual modelo será usado pelo Assistente. Modelos locais (Ollama) não requerem chave. Modelos em nuvem requerem uma API Key do provedor.
                  </p>

                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={localModel}
                    onChange={e => setLocalModel(e.target.value)}
                  >
                    <optgroup label="🖥️ Local (Ollama)">
                      {ollamaModels.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.recommended ? '⭐ ' : ''}{m.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="☁️ DeepSeek API (nuvem)">
                      {deepseekCloud.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* API Key — só aparece para modelos DeepSeek cloud */}
                {isDeepSeekCloud && (
                  <div className="space-y-2 pt-1">
                    <label className="block text-sm font-medium text-gray-700">
                      🔑 DeepSeek API Key
                      <a
                        href="https://platform.deepseek.com/api_keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-teal-600 hover:underline font-normal"
                      >
                        Obter chave →
                      </a>
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 pr-20"
                        placeholder="sk-..."
                        value={localApiKey}
                        onChange={e => setLocalApiKey(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                    <p className="text-xs text-amber-600">
                      ⚠️ A chave é salva no banco de dados da sua família. Não compartilhe acesso ao app com pessoas não confiáveis.
                    </p>
                  </div>
                )}
              </div>

              {/* Prompt */}
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">📝 Prompt do Sistema</h3>
                    <p className="text-xs text-gray-400">Instrução base que define a personalidade e comportamento do Assistente.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocalPrompt(DEFAULT_PROMPT)}
                    className="text-xs text-teal-600 hover:underline shrink-0 ml-4"
                  >
                    Restaurar padrão
                  </button>
                </div>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  rows={10}
                  value={localPrompt}
                  onChange={e => setLocalPrompt(e.target.value)}
                  placeholder="Descreva como o assistente deve se comportar..."
                />
                <p className="text-xs text-gray-400">{localPrompt.length} caracteres</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAI}
                  disabled={aiSaving}
                  className="px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {aiSaving ? 'Salvando...' : 'Salvar configurações'}
                </button>
                {aiSaved && <span className="text-sm text-green-600 font-medium">✅ Salvo com sucesso!</span>}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ ABA: CATEGORIAS ══ */}
      {tab === 'categorias' && <CategoryManager />}

      {/* Sheets */}
      <MemberSheet
        open={memberOpen}
        onClose={() => setMemberOpen(false)}
        member={selectedMember}
      />
      <EmergencyContactSheet
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        contact={selectedContact}
        onSave={upsertContact}
      />
    </div>
  )
}

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Carregando...</div>}>
      <ConfiguracoesContent />
    </Suspense>
  )
}

// app/chatbot/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatbot } from '@/hooks/useChatbot'
import { TYPE_CONFIG, ParsedItem, ParsedItemType } from '@/types/chatbot'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  Send,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ChevronDown,
} from 'lucide-react'

const TYPE_OPTIONS: ParsedItemType[] = [
  'shopping',
  'task',
  'home_maintenance',
  'maintenance_call',
  'calendar_event',
  'medication',
  'vaccine',
  'unknown',
]

export default function ChatbotPage() {
  const {
    messages,
    loading,
    preview,
    editingItems,
    analyzeText,
    confirmInsert,
    cancelPreview,
    removeEditingItem,
    updateEditingItem,
  } = useChatbot()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, preview])

  const handleSubmit = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    await analyzeText(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto px-4">
      <PageHeader
        title="Assistente"
        subtitle="Cole listas, mensagens do WhatsApp ou qualquer texto com itens misturados"
        icon={<Sparkles className="w-5 h-5" />}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-surface border border-border rounded-bl-sm'
              }`}
              dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>'),
              }}
            />
          </div>
        ))}

        {/* Preview de itens para confirmação */}
        {preview && editingItems.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-text">
                📋 {editingItems.length} itens encontrados — revise antes de salvar
              </span>
              <button
                onClick={cancelPreview}
                className="text-text-muted hover:text-error transition-colors"
                title="Cancelar"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-divider max-h-96 overflow-y-auto">
              {editingItems.map((item, index) => (
                <PreviewItemRow
                  key={index}
                  item={item}
                  index={index}
                  onUpdate={updateEditingItem}
                  onRemove={removeEditingItem}
                />
              ))}
            </div>

            <div className="px-4 py-3 flex gap-2 border-t border-border bg-surface-offset">
              <button
                onClick={() => confirmInsert(editingItems)}
                disabled={loading || editingItems.length === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Confirmar e Salvar
              </button>
              <button
                onClick={cancelPreview}
                className="px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {loading && !preview && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-sm text-text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analisando com IA...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="py-4 border-t border-border">
        <div className="flex gap-2 items-end bg-surface border border-border rounded-2xl px-4 py-3 focus-within:border-primary transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cole aqui sua lista do WhatsApp, tarefas, compras... (Ctrl+Enter para enviar)"
            className="flex-1 resize-none bg-transparent text-sm text-text placeholder:text-text-faint outline-none max-h-40 min-h-[2.5rem]"
            rows={2}
            disabled={loading || !!preview}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading || !!preview}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-text-faint text-center mt-2">
          Ctrl+Enter para enviar • Os itens serão revisados antes de salvar
        </p>
      </div>
    </div>
  )
}

// ── Componente de linha do preview ──────────────────────────────────────────

function PreviewItemRow({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: ParsedItem
  index: number
  onUpdate: (index: number, updates: Partial<ParsedItem>) => void
  onRemove: (index: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const config = TYPE_CONFIG[item.type]

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Badge de tipo */}
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${config.bgColor} ${config.textColor}`}
        >
          {config.emoji} {config.label}
        </span>

        {/* Título editável */}
        <div className="flex-1 min-w-0">
          <input
            value={item.title}
            onChange={(e) => onUpdate(index, { title: e.target.value })}
            className="w-full text-sm text-text bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none transition-colors pb-0.5"
          />

          {/* Detalhes secundários */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {item.quantity && (
              <span className="text-xs text-text-muted">Qtd: {item.quantity}</span>
            )}
            {item.recurrence && (
              <span className="text-xs text-text-muted">🔄 {item.recurrence}</span>
            )}
            {item.location && (
              <span className="text-xs text-text-muted">📍 {item.location}</span>
            )}
            {item.date && (
              <span className="text-xs text-text-muted">📅 {item.date}</span>
            )}
          </div>
        </div>

        {/* Confiança */}
        <span
          className={`text-xs font-mono shrink-0 ${
            item.confidence >= 0.8
              ? 'text-success'
              : item.confidence >= 0.5
              ? 'text-warning'
              : 'text-error'
          }`}
        >
          {Math.round(item.confidence * 100)}%
        </span>

        {/* Expandir */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-text-faint hover:text-text-muted transition-colors shrink-0"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Remover */}
        <button
          onClick={() => onRemove(index)}
          className="text-text-faint hover:text-error transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Edição expandida */}
      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-2 pl-1">
          <div>
            <label className="text-xs text-text-muted block mb-1">Tipo</label>
            <select
              value={item.type}
              onChange={(e) =>
                onUpdate(index, { type: e.target.value as ParsedItemType })
              }
              className="w-full text-xs bg-surface-offset border border-border rounded-lg px-2 py-1.5 text-text outline-none focus:border-primary"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {TYPE_CONFIG[t].emoji} {TYPE_CONFIG[t].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">Quantidade</label>
            <input
              value={item.quantity ?? ''}
              onChange={(e) => onUpdate(index, { quantity: e.target.value || null })}
              placeholder="ex: 2, 500ml"
              className="w-full text-xs bg-surface-offset border border-border rounded-lg px-2 py-1.5 text-text outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">Categoria</label>
            <input
              value={item.category ?? ''}
              onChange={(e) => onUpdate(index, { category: e.target.value || null })}
              placeholder="ex: Farmácia, Hortifruti"
              className="w-full text-xs bg-surface-offset border border-border rounded-lg px-2 py-1.5 text-text outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">Local / Cômodo</label>
            <input
              value={item.location ?? ''}
              onChange={(e) => onUpdate(index, { location: e.target.value || null })}
              placeholder="ex: Banheiro, Cozinha"
              className="w-full text-xs bg-surface-offset border border-border rounded-lg px-2 py-1.5 text-text outline-none focus:border-primary"
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-text-muted block mb-1">Observações</label>
            <input
              value={item.notes ?? ''}
              onChange={(e) => onUpdate(index, { notes: e.target.value || null })}
              placeholder="Informações adicionais..."
              className="w-full text-xs bg-surface-offset border border-border rounded-lg px-2 py-1.5 text-text outline-none focus:border-primary"
            />
          </div>
        </div>
      )}
    </div>
  )
}

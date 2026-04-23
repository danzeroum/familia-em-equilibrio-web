'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChatbot } from '@/hooks/useChatbot'
import { TYPE_CONFIG, ParsedItem, ParsedItemType } from '@/types/chatbot'
import { useUIStore } from '@/store/uiStore'
import {
  Send, Trash2, CheckCircle2, XCircle, Loader2, ChevronDown, X, Sparkles, Minus,
} from 'lucide-react'

const TYPE_OPTIONS: ParsedItemType[] = [
  'shopping', 'task', 'home_maintenance', 'maintenance_call',
  'calendar_event', 'medication', 'vaccine', 'unknown',
]

const MIN_W = 320
const MIN_H = 300
const DEFAULT_W = 420
const DEFAULT_H = 600

export function ChatbotModal() {
  const { chatbotOpen, closeChatbot } = useUIStore()
  const {
    messages, loading, preview, editingItems,
    analyzeText, confirmInsert, cancelPreview,
    removeEditingItem, updateEditingItem,
  } = useChatbot()

  const [minimized, setMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const resizing = useRef(false)
  const resizeStart = useRef({ x: 0, y: 0, w: DEFAULT_W, h: DEFAULT_H })

  useEffect(() => {
    if (!minimized) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, preview, minimized])

  useEffect(() => {
    if (chatbotOpen) setMinimized(false)
  }, [chatbotOpen])

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizing.current = true
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return
      const dw = ev.clientX - resizeStart.current.x
      const dh = resizeStart.current.y - ev.clientY // arrastar pra cima = aumentar altura
      setSize({
        w: Math.max(MIN_W, resizeStart.current.w + dw),
        h: Math.max(MIN_H, resizeStart.current.h + dh),
      })
    }
    const onUp = () => {
      resizing.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [size])

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

  if (!chatbotOpen) return null

  const maxVH = typeof window !== 'undefined' ? window.innerHeight - 100 : 700

  return (
    <div
      className="fixed bottom-20 right-4 z-[9999] flex flex-col shadow-2xl rounded-2xl border border-border sm:right-6"
      style={{
        width: minimized ? DEFAULT_W : Math.min(size.w, window.innerWidth - 32),
        height: minimized ? 'auto' : Math.min(size.h, maxVH),
        backgroundColor: 'var(--color-bg)',
        isolation: 'isolate',
        overflow: 'hidden',
        transition: minimized ? 'height 0.3s cubic-bezier(0.16,1,0.3,1)' : 'none',
      }}
    >
      {/* Resize handle — canto superior esquerdo */}
      {!minimized && (
        <div
          onMouseDown={onResizeMouseDown}
          className="absolute top-0 left-0 w-5 h-5 cursor-nw-resize z-10 flex items-center justify-center"
          title="Arrastar para redimensionar"
          style={{ touchAction: 'none' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 9L9 1M1 5L5 1M5 9L9 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
          </svg>
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-primary text-white cursor-pointer select-none shrink-0"
        onClick={() => setMinimized(v => !v)}
      >
        <span className="text-base">✨</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Assistente IA</p>
          {!minimized && (
            <p className="text-xs opacity-75 truncate">Cole listas ou mensagens do WhatsApp</p>
          )}
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMinimized(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
            aria-label={minimized ? 'Expandir' : 'Minimizar'}
          >
            {minimized
              ? <ChevronDown className="w-4 h-4 rotate-180" />
              : <Minus className="w-4 h-4" />}
          </button>
          <button
            onClick={closeChatbot}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 p-3 min-h-0"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-4">
                <Sparkles className="w-8 h-8 text-primary opacity-40" />
                <p className="text-sm font-medium text-text">Cole qualquer texto aqui</p>
                <p className="text-sm text-text-muted">
                  Lista de compras, tarefas, lembretes — a IA organiza tudo.
                </p>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-surface border border-border rounded-bl-sm text-text'
                  }`}
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html:
                        msg.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br/>') +
                        (msg.streaming
                          ? '<span style="display:inline-block;width:8px;height:13px;background:currentColor;margin-left:2px;border-radius:1px;animation:blink 1s step-end infinite;vertical-align:text-bottom;opacity:0.7"></span>'
                          : ''),
                    }}
                  />
                </div>
              </div>
            ))}

            {preview && editingItems.length > 0 && (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-surface-offset">
                  <span className="text-sm font-semibold text-text">
                    📋 {editingItems.length} itens para salvar
                  </span>
                  <button onClick={cancelPreview} className="text-text-muted hover:text-error transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-divider max-h-64 overflow-y-auto">
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
                <div className="px-3 py-2 flex gap-2 border-t border-border bg-surface-offset">
                  <button
                    onClick={() => confirmInsert(editingItems)}
                    disabled={loading || editingItems.length === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Salvar tudo
                  </button>
                  <button
                    onClick={cancelPreview}
                    className="px-3 py-2 text-sm text-text-muted hover:text-text border border-border rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {loading && !preview && (
              <div className="flex justify-start">
                <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-2 text-sm text-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border shrink-0" style={{ backgroundColor: 'var(--color-bg)' }}>
            <div className="flex gap-2 items-end bg-surface border border-border rounded-xl px-3 py-2 focus-within:border-primary transition-colors">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Cole aqui... (Ctrl+Enter envia)"
                className="flex-1 resize-none bg-transparent text-sm text-text placeholder:text-text-faint outline-none max-h-32 min-h-[2.5rem]"
                rows={2}
                disabled={loading || !!preview}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || loading || !!preview}
                className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-text-faint mt-1.5 text-center">Ctrl+Enter para enviar</p>
          </div>
        </>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:0.7} 50%{opacity:0} }
      `}</style>
    </div>
  )
}

function PreviewItemRow({
  item, index, onUpdate, onRemove,
}: {
  item: ParsedItem
  index: number
  onUpdate: (index: number, updates: Partial<ParsedItem>) => void
  onRemove: (index: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const config = TYPE_CONFIG[item.type]

  return (
    <div className="px-3 py-2">
      <div className="flex items-start gap-2">
        <span className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${config.bgColor} ${config.textColor}`}>
          {config.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <input
            value={item.title}
            onChange={e => onUpdate(index, { title: e.target.value })}
            className="w-full text-sm text-text bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none transition-colors pb-0.5"
          />
          {(item.quantity || item.date || item.recurrence) && (
            <div className="flex flex-wrap gap-x-2 mt-0.5">
              {item.quantity && <span className="text-xs text-text-muted">Qtd: {item.quantity}</span>}
              {item.date && <span className="text-xs text-text-muted">📅 {item.date}</span>}
              {item.recurrence && <span className="text-xs text-text-muted">🔄 {item.recurrence}</span>}
            </div>
          )}
        </div>
        <span className={`text-xs font-mono shrink-0 ${item.confidence >= 0.8 ? 'text-success' : item.confidence >= 0.5 ? 'text-warning' : 'text-error'}`}>
          {Math.round(item.confidence * 100)}%
        </span>
        <button onClick={() => setExpanded(v => !v)} className="text-text-faint hover:text-text-muted transition-colors shrink-0">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <button onClick={() => onRemove(index)} className="text-text-faint hover:text-error transition-colors shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="mt-2 grid grid-cols-2 gap-1.5 pl-1">
          <div>
            <label className="text-xs text-text-muted block mb-0.5">Tipo</label>
            <select
              value={item.type}
              onChange={e => onUpdate(index, { type: e.target.value as ParsedItemType })}
              className="w-full text-xs bg-surface-offset border border-border rounded-lg px-2 py-1 text-text outline-none focus:border-primary"
            >
              {TYPE_OPTIONS.map(t => (
                <option key={t} value={t}>{TYPE_CONFIG[t].emoji} {TYPE_CONFIG[t].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-0.5">Quantidade</label>
            <input value={item.quantity ?? ''} onChange={e => onUpdate(index, { quantity: e.target.value || null })} placeholder="ex: 2" className="w-full text-xs bg-surface-offset border border-border rounded-lg px-2 py-1 text-text outline-none focus:border-primary" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-text-muted block mb-0.5">Observações</label>
            <input value={item.notes ?? ''} onChange={e => onUpdate(index, { notes: e.target.value || null })} placeholder="Informações adicionais..." className="w-full text-xs bg-surface-offset border border-border rounded-lg px-2 py-1 text-text outline-none focus:border-primary" />
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react'

interface Props {
  onAdd: (names: string[]) => Promise<void>
  placeholder?: string
}

export function QuickAddList({ onAdd, placeholder }: Props) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLTextAreaElement | null>(null)

  // auto-resize
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [value])

  async function submit() {
    const lines = value.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0 || busy) return
    setBusy(true)
    try {
      await onAdd(lines)
      setValue('')
    } finally {
      setBusy(false)
    }
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  async function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = e.clipboardData.getData('text')
    if (!pasted.includes('\n')) return // paste normal de uma linha — deixa
    e.preventDefault()
    const lines = pasted.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    setBusy(true)
    try {
      await onAdd(lines)
      setValue('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="flex gap-2 items-start">
        <textarea
          ref={ref}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          onPaste={handlePaste}
          rows={1}
          disabled={busy}
          placeholder={placeholder ?? 'Digite um item e aperte Enter — ou cole sua lista...'}
          className="flex-1 resize-none outline-none px-3 py-2 text-sm bg-transparent placeholder:text-gray-400 disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={busy || !value.trim()}
          className="bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {busy ? '...' : '+ Adicionar'}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2 px-1">
        💡 <strong>Enter</strong> adiciona. <strong>Shift+Enter</strong> nova linha. Cole uma lista pronta para adicionar tudo de uma vez.
      </p>
    </div>
  )
}

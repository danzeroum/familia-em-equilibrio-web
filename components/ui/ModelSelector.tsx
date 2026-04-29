import { useChatbotStore, AVAILABLE_MODELS } from '@/store/chatbotStore'

export function ModelSelector() {
  const { selectedModel, setModel, lastModelUsed } = useChatbotStore()

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Modelo:</span>
      <select
        value={selectedModel}
        onChange={(e) => setModel(e.target.value as any)}
        className="rounded border px-2 py-1 text-sm bg-background"
      >
        {AVAILABLE_MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label} {m.recommended ? '⭐' : ''}
          </option>
        ))}
      </select>
      {lastModelUsed && (
        <span className="text-xs opacity-60">último: {lastModelUsed}</span>
      )}
    </div>
  )
}

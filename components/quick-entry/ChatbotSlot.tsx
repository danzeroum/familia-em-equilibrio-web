'use client'

export function ChatbotSlot() {
  return (
    <div className="border border-dashed border-teal-300 rounded-xl p-3 bg-teal-50/40">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-wider text-teal-700 font-semibold">
          🤖 Em breve — Registo por linguagem natural
        </p>
      </div>
      <input
        disabled
        placeholder='Ex: "Vacina BCG para Ana na próxima terça"'
        className="w-full px-3 py-2 text-sm bg-white/60 border border-teal-200/60 rounded-lg outline-none placeholder:text-teal-600/50 cursor-not-allowed"
      />
    </div>
  )
}

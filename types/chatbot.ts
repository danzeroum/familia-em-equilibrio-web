// types/chatbot.ts

export type ParsedItemType =
  | 'shopping'
  | 'task'
  | 'home_maintenance'
  | 'maintenance_call'
  | 'calendar_event'
  | 'medication'
  | 'vaccine'
  | 'unknown'

export interface ParsedItem {
  type: ParsedItemType
  title: string
  quantity?: string | null
  category?: string | null
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly'; // tasks
  recurrence_interval?: number; // ex: a cada 1 semana = interval:1
  location?: string | null
  date?: string | null
  time?: string | null
  notes?: string | null
  confidence: number
}

export interface ParseResult {
  items: ParsedItem[]
  rawText: string
  parsedAt: string
}

export interface InsertResult {
  inserted: number
  failed: number
  errors: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  parseResult?: ParseResult
  insertResult?: InsertResult
  timestamp: string
}

export const TYPE_CONFIG: Record<
  ParsedItemType,
  { label: string; emoji: string; bgColor: string; textColor: string }
> = {
  shopping: {
    label: 'Compras',
    emoji: '🛒',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-800 dark:text-emerald-300',
  },
  task: {
    label: 'Tarefa',
    emoji: '✅',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-800 dark:text-blue-300',
  },
  home_maintenance: {
    label: 'Manutenção',
    emoji: '🏠',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-800 dark:text-orange-300',
  },
  maintenance_call: {
    label: 'Chamado',
    emoji: '🔧',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-800 dark:text-amber-300',
  },
  calendar_event: {
    label: 'Evento',
    emoji: '📅',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-800 dark:text-purple-300',
  },
  medication: {
    label: 'Medicamento',
    emoji: '💊',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-300',
  },
  vaccine: {
    label: 'Vacina',
    emoji: '💉',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-800 dark:text-yellow-300',
  },
  unknown: {
    label: 'Não identificado',
    emoji: '❓',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-600 dark:text-gray-400',
  },
}

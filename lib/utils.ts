import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, parseISO, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Retorna dias restantes a partir de hoje
export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return differenceInDays(parseISO(dateStr), new Date())
}

// Classifica prioridade com base nos dias restantes
export function getPriority(days: number | null): 'urgent' | 'attention' | 'planned' | 'overdue' {
  if (days === null) return 'planned'
  if (days < 0) return 'overdue'
  if (days <= 7) return 'urgent'
  if (days <= 30) return 'attention'
  return 'planned'
}

// Labels e cores do semáforo
export const PRIORITY_CONFIG = {
  overdue: { label: 'Vencido', color: 'bg-red-100 text-red-800 border-red-200', dot: '🔴', badge: 'destructive' },
  urgent:  { label: 'Urgente', color: 'bg-red-50 text-red-700 border-red-200',  dot: '🔴', badge: 'destructive' },
  attention: { label: 'Atenção', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: '🟡', badge: 'warning' },
  planned:  { label: 'Planejado', color: 'bg-green-50 text-green-700 border-green-200', dot: '🟢', badge: 'success' },
} as const

// Formata data para exibição em pt-BR
export function formatDate(dateStr: string | null, pattern = 'dd/MM/yyyy'): string {
  if (!dateStr) return '—'
  return format(parseISO(dateStr), pattern, { locale: ptBR })
}

// Segunda-feira da semana atual
export function currentWeekStart(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

// Formata valor em Real
export function formatCurrency(value: number | null): string {
  if (value === null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// Status de medicamento com base na validade e estoque
export function getMedicationStatus(expiryDate: string | null, stock: number, minStock: number) {
  if (expiryDate && daysUntil(expiryDate) !== null) {
    const days = daysUntil(expiryDate)!
    if (days < 0) return { label: '🔴 VENCIDO', color: 'text-red-600' }
    if (days < 30) return { label: '🟡 VENCE EM BREVE', color: 'text-yellow-600' }
  }
  if (stock <= minStock) return { label: '⚠️ REPOR', color: 'text-orange-600' }
  return { label: '✅ OK', color: 'text-green-600' }
}

// Calcula dose pediátrica (mg/kg)
export function calcPediatricDose(weightKg: number, concentration: string, dosePerKg = 10): string {
  // concentration formato: "200mg/5ml"
  const match = concentration.match(/(\d+)mg\/(\d+)ml/i)
  if (!match) return '—'
  const mgPerMl = parseFloat(match[1]) / parseFloat(match[2])
  const totalMg = weightKg * dosePerKg
  const totalMl = totalMg / mgPerMl
  return `${totalMl.toFixed(1)} ml (${totalMg.toFixed(0)} mg)`
}

import { cn } from '@/lib/utils'
import { getPriority, PRIORITY_CONFIG, daysUntil } from '@/lib/utils'

interface StatusBadgeProps {
  dateStr: string | null
  className?: string
}

export function StatusBadge({ dateStr, className }: StatusBadgeProps) {
  const days = daysUntil(dateStr)
  const priority = getPriority(days)
  const config = PRIORITY_CONFIG[priority]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border',
        config.color,
        className
      )}
    >
      {config.dot}
      {days === null ? '—' : days < 0 ? `${Math.abs(days)}d atrás` : days === 0 ? 'Hoje' : `${days}d`}
    </span>
  )
}

interface PriorityDotProps {
  priority: 'urgent' | 'attention' | 'planned' | 'overdue'
}

export function PriorityDot({ priority }: PriorityDotProps) {
  return (
    <span className="text-base leading-none">
      {PRIORITY_CONFIG[priority].dot}
    </span>
  )
}

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  emoji: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ emoji, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 text-center',
      className
    )}>
      <span className="text-4xl mb-3">{emoji}</span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

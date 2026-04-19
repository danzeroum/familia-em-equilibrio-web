import { cn } from '@/lib/utils'

interface PageHeaderProps {
  emoji: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ emoji, title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6', className)}>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <span>{emoji}</span>
          <span className="truncate">{title}</span>
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}

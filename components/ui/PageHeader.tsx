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
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>{emoji}</span>
          <span>{title}</span>
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

'use client'

import { useUIStore } from '@/store/uiStore'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'

export function Toaster() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-lg border shadow-lg bg-card text-card-foreground',
            'animate-in slide-in-from-right-5 duration-200',
            toast.variant === 'destructive' && 'border-destructive/50 bg-destructive/10',
            toast.variant === 'success' && 'border-green-500/50 bg-green-50'
          )}
        >
          {toast.variant === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />}
          {toast.variant === 'destructive' && <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />}
          {(!toast.variant || toast.variant === 'default') && <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
            )}
          </div>
          <button onClick={() => removeToast(toast.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { LeisureRecord, LeisureActivity, Profile } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  item: LeisureRecord | null
  onSave: (payload: Partial<LeisureRecord>) => Promise<void>
  members: Profile[]
  activities?: LeisureActivity[]
  prefillActivity?: LeisureActivity | null
}

export function LeisureRecordSheet({
  open, onClose, item, onSave, members, activities = [], prefillActivity,
}: Props) {
  const [form, setForm] = useState<Partial<LeisureRecord>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (item) {
        setForm(item)
      } else if (prefillActivity) {
        setForm({
          title: prefillActivity.title,
          emoji: prefillActivity.emoji ?? undefined,
          activity_id: prefillActivity.id,
          location_name: prefillActivity.location_name ?? undefined,
          date_realized: new Date().toISOString().split('T')[0],
          would_repeat: true,
          participants: [],
        })
      } else {
        setForm({
          date_realized: new Date().toISOString().split('T')[0],
          would_repeat: true,
          participants: [],
        })
      }
    }
  }, [open, item, prefillActivity])

  const set = (key: keyof LeisureRecord, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggleParticipant = (profileId: string) => {
    const current = form.participants ?? []
    set('participants',
      current.includes(profileId)
        ? current.filter((id) => id !== profileId)
        : [...current, profileId]
    )
  }

  const handleSave = async () => {
    if (!form.title?.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item ? 'Editar Registro' : 'Registrar Lazer Realizado'}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-4">
          {/* Emoji + Título */}
          <div className="flex gap-2">
            <Input
              className="w-16 text-center text-xl"
              value={form.emoji ?? ''}
              onChange={(e) => set('emoji', e.target.value)}
              placeholder="📸"
            />
            <Input
              className="flex-1"
              placeholder="O que fizeram?"
              value={form.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          {/* Data */}
          <div>
            <Label>Data que realizou</Label>
            <Input
              type="date"
              value={form.date_realized ?? ''}
              onChange={(e) => set('date_realized', e.target.value)}
            />
          </div>

          {/* Rating */}
          <div>
            <Label>Avaliação</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`text-2xl transition-transform hover:scale-110 ${
                    (form.rating ?? 0) >= star ? 'opacity-100' : 'opacity-30'
                  }`}
                  onClick={() => set('rating', star)}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Participantes */}
          <div>
            <Label>Quem participou?</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {members.map((m) => {
                const selected = (form.participants ?? []).includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleParticipant(m.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted border-border'
                    }`}
                  >
                    {m.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Local */}
          <div>
            <Label>Local</Label>
            <Input
              placeholder="Onde foi?"
              value={form.location_name ?? ''}
              onChange={(e) => set('location_name', e.target.value)}
            />
          </div>

          {/* Custo real */}
          <div>
            <Label>Custo real (R$)</Label>
            <Input
              type="number"
              placeholder="0,00"
              value={form.cost_actual ?? ''}
              onChange={(e) => set('cost_actual', parseFloat(e.target.value) || null)}
            />
          </div>

          {/* Descrição */}
          <div>
            <Label>Descrição / Memória</Label>
            <Textarea
              placeholder="Como foi? O que marcou?"
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Notas */}
          <div>
            <Label>Notas adicionais</Label>
            <Textarea
              placeholder="Dicas, próximas vezes..."
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
            />
          </div>

          {/* Repetiria? */}
          <div className="flex items-center gap-3">
            <Switch
              id="would_repeat"
              checked={form.would_repeat ?? true}
              onCheckedChange={(v) => set('would_repeat', v)}
            />
            <Label htmlFor="would_repeat">🔄 Faria de novo</Label>
          </div>

          {/* Vincular atividade */}
          {activities.length > 0 && (
            <div>
              <Label>Atividade relacionada (opcional)</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm bg-background"
                value={form.activity_id ?? ''}
                onChange={(e) => set('activity_id', e.target.value || null)}
              >
                <option value="">Nenhuma</option>
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.emoji ?? '🎉'} {a.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || !form.title?.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

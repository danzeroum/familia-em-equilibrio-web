'use client'

import { forwardRef, memo } from 'react'
import type { Profile } from '@/types/database'

const INPUT_CLS =
  'w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg ' +
  'outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 ' +
  'focus:ring-teal-500/20 transition-colors'

const LABEL_CLS = 'text-xs font-medium text-gray-600 mb-1 block'

type TextFieldProps = {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  onEnter?: () => void
}

export const TextField = memo(
  forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
    { label, value, onChange, placeholder, autoFocus, onEnter },
    ref
  ) {
    return (
      <div>
        <label className={LABEL_CLS}>{label}</label>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onEnter) {
              e.preventDefault()
              onEnter()
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={INPUT_CLS}
        />
      </div>
    )
  })
)

type NumberFieldProps = {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

export const NumberField = memo(function NumberField({
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
}: NumberFieldProps) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={INPUT_CLS}
      />
    </div>
  )
})

type DateFieldProps = {
  label: string
  value: string
  onChange: (v: string) => void
}

export const DateField = memo(function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLS}
      />
    </div>
  )
})

type MemberSelectProps = {
  label: string
  value: string
  onChange: (v: string) => void
  members: Profile[]
  includeNone?: boolean
}

export const MemberSelect = memo(function MemberSelect({
  label,
  value,
  onChange,
  members,
  includeNone = false,
}: MemberSelectProps) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLS + ' pr-8'}
      >
        {includeNone && <option value="">— Ninguém —</option>}
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nickname ?? m.name.split(' ')[0]}
          </option>
        ))}
      </select>
    </div>
  )
})

type SelectFieldProps = {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

export const SelectField = memo(function SelectField({
  label,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLS + ' pr-8'}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
})

type MoodSliderProps = {
  value: number
  onChange: (v: number) => void
}

const MOODS = ['😞', '😕', '😐', '🙂', '😄']

export const MoodSlider = memo(function MoodSlider({ value, onChange }: MoodSliderProps) {
  return (
    <div>
      <label className={LABEL_CLS}>Humor</label>
      <div className="flex items-center justify-between gap-2">
        {MOODS.map((emoji, i) => {
          const level = i + 1
          const active = value === level
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className={
                'flex-1 py-2 text-2xl rounded-lg border-2 transition-colors ' +
                (active
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-transparent bg-gray-50 hover:bg-gray-100')
              }
              aria-label={`Humor nível ${level}`}
            >
              {emoji}
            </button>
          )
        })}
      </div>
    </div>
  )
})

// Adicionar no final de fields.tsx

type TextareaFieldProps = {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}

export const TextareaField = memo(function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: TextareaFieldProps) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={
          'w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg ' +
          'outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 ' +
          'focus:ring-teal-500/20 transition-colors resize-none'
        }
      />
    </div>
  )
})

'use client'

import { useState } from 'react'
import { currentWeekStart } from '@/lib/utils'

export type PracticeStatus = 'pending' | 'done' | 'skipped'

export interface EmotionalPractice {
  id: string
  emoji: string
  title: string
  howTo: string
  whenToUse: string
  forWhom: string
  frequency: string
  status: PracticeStatus
  lastDoneWeek: string | null
}

const INITIAL_PRACTICES: Omit<EmotionalPractice, 'status' | 'lastDoneWeek'>[] = [
  { id: '1', emoji: '🗣️', title: 'Conversa sobre sentimentos', howTo: 'Pergunta aberta na janta',                       whenToUse: 'Diário',          forWhom: 'Crianças',       frequency: 'Diário'          },
  { id: '2', emoji: '🎈', title: 'Respiração do balão',          howTo: 'Inspirar 4s, segurar 4s, soltar 4s',           whenToUse: 'Crise emocional', forWhom: 'Crianças',       frequency: 'Quando ocorrer' },
  { id: '3', emoji: '✏️',  title: 'Registrar conflito escolar',  howTo: 'Anotar data, fato, como resolveu',              whenToUse: 'Quando ocorrer', forWhom: 'Pais',           frequency: 'Quando ocorrer' },
  { id: '4', emoji: '🌙', title: 'Fechamento da noite',          howTo: 'Revisar o dia, agradecer algo bom',             whenToUse: 'Noite',          forWhom: 'Todos',          frequency: 'Diário'          },
  { id: '5', emoji: '🤗', title: 'Elogio específico',            howTo: 'Nomear o comportamento positivo',               whenToUse: 'Quando ocorrer', forWhom: 'Crianças',       frequency: 'Diário'          },
  { id: '6', emoji: '📓', title: 'Diário de emoções',            howTo: 'Criança desenha ou escreve o que sentiu',       whenToUse: 'Semanal',        forWhom: 'Crianças',       frequency: 'Semanal'         },
  { id: '7', emoji: '🧩', title: 'Tempo de qualidade individual',howTo: '15min só com uma criança, sem distracção',       whenToUse: 'Semanal',        forWhom: 'Cada criança',   frequency: 'Semanal'         },
]

export function useEmotionalPractices() {
  const week = currentWeekStart()
  const [practices, setPractices] = useState<EmotionalPractice[]>(
    INITIAL_PRACTICES.map(p => ({ ...p, status: 'pending', lastDoneWeek: null }))
  )

  function toggleStatus(id: string) {
    setPractices(prev => prev.map(p => {
      if (p.id !== id) return p
      const next: PracticeStatus = p.status === 'pending' ? 'done' : p.status === 'done' ? 'skipped' : 'pending'
      return { ...p, status: next, lastDoneWeek: next === 'done' ? week : p.lastDoneWeek }
    }))
  }

  function addPractice(data: Omit<EmotionalPractice, 'status' | 'lastDoneWeek'>) {
    setPractices(prev => [
      ...prev,
      { ...data, id: data.id || String(Date.now()), status: 'pending', lastDoneWeek: null },
    ])
  }

  function updatePractice(data: Omit<EmotionalPractice, 'status' | 'lastDoneWeek'>) {
    setPractices(prev => prev.map(p =>
      p.id === data.id ? { ...p, ...data } : p
    ))
  }

  function removePractice(id: string) {
    setPractices(prev => prev.filter(p => p.id !== id))
  }

  const doneCount = practices.filter(p => p.status === 'done').length

  return {
    practices,
    toggleStatus,
    addPractice,
    updatePractice,
    removePractice,
    doneCount,
    total: practices.length,
  }
}

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { SavingsGoal } from '@/types/database'

/** Para uma meta, calcula a mensagem motivacional de economia diária */
export function getMotivationalMessage(goal: SavingsGoal, monthlySavings: number): string | null {
  if (goal.is_completed) return null
  const remaining = goal.target_amount - goal.current_amount
  if (remaining <= 0 || !goal.deadline) return null

  const daysLeft = Math.ceil(
    (new Date(goal.deadline).getTime() - Date.now()) / 86400000
  )
  if (daysLeft <= 0) return null

  // Quanto por mês precisa guardar para chegar lá a tempo
  const monthsLeft = daysLeft / 30
  const neededPerMonth = remaining / monthsLeft

  // Se já está poupando o suficiente
  const currency = goal.currency ?? 'BRL'
  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$'

  if (monthlySavings >= neededPerMonth) {
    return `✅ No ritmo certo! Poupando ${symbol}${monthlySavings.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês chega lá em ${Math.ceil(remaining / monthlySavings)} mês${Math.ceil(remaining / monthlySavings) !== 1 ? 'es' : ''}.`
  }

  // R$ 100 a mais = quantos dias a menos até a meta
  const daysGainedPer100 = monthlySavings > 0
    ? (100 / (remaining / daysLeft))
    : null

  if (daysGainedPer100 && daysGainedPer100 >= 1) {
    return `💡 Cada ${symbol}100 economizado hoje = ${Math.round(daysGainedPer100)} dia${Math.round(daysGainedPer100) !== 1 ? 's' : ''} mais perto desta viagem.`
  }

  return `📋 Precisa de ${symbol}${neededPerMonth.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês para chegar lá a tempo.`
}

export function useSavingsGoals() {
  const { currentFamily } = useFamilyStore()
  const familyId = currentFamily?.id
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { load() }, [familyId])

  async function load() {
    if (!familyId) return
    setIsLoading(true)
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
    setGoals(data ?? [])
    setIsLoading(false)
  }

  async function upsert(goal: Partial<SavingsGoal> & { title: string; target_amount: number }) {
    if (goal.id) {
      await supabase.from('savings_goals').update(goal).eq('id', goal.id)
    } else {
      await supabase.from('savings_goals').insert({ ...goal, family_id: familyId! } as any)
    }
    await load()
  }

  async function addDeposit(id: string, amount: number) {
    const goal = goals.find(g => g.id === id)
    if (!goal) return
    const newAmount = Math.min(goal.current_amount + amount, goal.target_amount)
    await supabase
      .from('savings_goals')
      .update({ current_amount: newAmount, is_completed: newAmount >= goal.target_amount })
      .eq('id', id)
    await load()
  }

  async function remove(id: string) {
    await supabase.from('savings_goals').delete().eq('id', id)
    await load()
  }

  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0)
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0)

  return { goals, isLoading, totalSaved, totalTarget, upsert, addDeposit, remove, reload: load }
}

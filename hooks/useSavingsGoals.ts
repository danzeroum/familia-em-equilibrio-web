'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { SavingsGoal } from '@/types/database'

export function useSavingsGoals() {
  const { familyId } = useFamilyStore()
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
      .update({
        current_amount: newAmount,
        is_completed: newAmount >= goal.target_amount,
      })
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

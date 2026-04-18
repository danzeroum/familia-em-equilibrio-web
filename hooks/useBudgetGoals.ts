'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { BudgetGoal, Bill } from '@/types/database'

export interface BudgetGoalWithSpent extends BudgetGoal {
  spent: number
  pct: number
  status: 'ok' | 'warning' | 'over'
}

/** Cruza budget_goals com bills para calcular gasto real por categoria */
export function enrichGoalsWithSpent(
  goals: BudgetGoal[],
  bills: Bill[]
): BudgetGoalWithSpent[] {
  return goals.map(g => {
    const spent = bills
      .filter(b => b.category === g.category)
      .reduce((s, b) => s + (b.amount ?? 0), 0)
    const pct = g.monthly_limit > 0 ? (spent / g.monthly_limit) * 100 : 0
    const status: BudgetGoalWithSpent['status'] =
      pct >= 100 ? 'over' : pct >= g.alert_pct ? 'warning' : 'ok'
    return { ...g, spent, pct, status }
  })
}

/** Categorias que têm gastos em bills mas ainda sem meta definida */
export function getUncoveredCategories(
  goals: BudgetGoal[],
  bills: Bill[]
): { category: string; spent: number }[] {
  const coveredCats = new Set(goals.map(g => g.category))
  const map: Record<string, number> = {}
  for (const b of bills) {
    const cat = b.category ?? 'Outros'
    if (!coveredCats.has(cat)) {
      map[cat] = (map[cat] ?? 0) + (b.amount ?? 0)
    }
  }
  return Object.entries(map)
    .map(([category, spent]) => ({ category, spent }))
    .sort((a, b) => b.spent - a.spent)
}

export function useBudgetGoals(bills: Bill[]) {
  const { currentFamily } = useFamilyStore()
  const familyId = currentFamily?.id
  const [goals, setGoals] = useState<BudgetGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { load() }, [familyId])

  async function load() {
    if (!familyId) return
    setIsLoading(true)
    const { data } = await supabase
      .from('budget_goals')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true })
    setGoals(data ?? [])
    setIsLoading(false)
  }

  async function upsert(
    goal: Partial<BudgetGoal> & { category: string; monthly_limit: number }
  ) {
    if (goal.id) {
      await supabase.from('budget_goals').update(goal).eq('id', goal.id)
    } else {
      await supabase
        .from('budget_goals')
        .insert({ ...goal, family_id: familyId! } as any)
    }
    await load()
  }

  async function remove(id: string) {
    await supabase.from('budget_goals').delete().eq('id', id)
    await load()
  }

  const enriched = enrichGoalsWithSpent(goals, bills)
  const uncovered = getUncoveredCategories(goals, bills)

  return { goals, enriched, uncovered, isLoading, upsert, remove, reload: load }
}

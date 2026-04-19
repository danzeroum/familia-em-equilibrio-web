'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { Bill } from '@/types/database'

export function getBillUrgency(bill: Bill): 'overdue' | 'due_soon' | 'ok' {
  if (bill.status === 'paid' || bill.status === 'auto_debit') return 'ok'
  if (bill.status === 'overdue') return 'overdue'
  if (!bill.due_day) return 'ok'
  const today = new Date().getDate()
  const daysUntilDue = bill.due_day - today
  if (daysUntilDue < 0) return 'overdue'
  if (daysUntilDue <= 3) return 'due_soon'
  return 'ok'
}

export const URGENCY_CONFIG = {
  overdue:  { emoji: '🔴', label: 'Atrasado',     bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  due_soon: { emoji: '🟡', label: 'Vence em breve', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  ok:       { emoji: '🟢', label: 'Em dia',        bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
} as const

export function getBillsByCategory(bills: Bill[]): { category: string; total: number; count: number }[] {
  const map: Record<string, { total: number; count: number }> = {}
  for (const b of bills) {
    const cat = b.category ?? 'Outros'
    if (!map[cat]) map[cat] = { total: 0, count: 0 }
    map[cat].total += b.amount ?? 0
    map[cat].count += 1
  }
  return Object.entries(map)
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.total - a.total)
}

export function useBills() {
  // Selector específico: só re-renderiza quando currentFamily.id mudar
  const familyId = useFamilyStore((s) => s.currentFamily?.id)

  const [bills, setBills] = useState<Bill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [monthlyBudget, setMonthlyBudgetState] = useState<number>(0)
  const [isSavingBudget, setIsSavingBudget] = useState(false)

  // Ref para sempre ter o familyId mais recente dentro das funções async
  const familyIdRef = useRef(familyId)
  useEffect(() => { familyIdRef.current = familyId }, [familyId])

  useEffect(() => {
    if (!familyId) return
    loadBudget()
    load()
  }, [familyId])

  async function loadBudget() {
    const fid = familyIdRef.current
    if (!fid) return
    const { data } = await supabase
      .from('families')
      .select('monthly_budget')
      .eq('id', fid)
      .single()
    if (data) setMonthlyBudgetState(data.monthly_budget ?? 0)
  }

  async function saveMonthlyBudget(value: number) {
    const fid = familyIdRef.current
    if (!fid) return
    setIsSavingBudget(true)
    setMonthlyBudgetState(value)
    await supabase
      .from('families')
      .update({ monthly_budget: value })
      .eq('id', fid)
    setIsSavingBudget(false)
  }

  async function load() {
    const fid = familyIdRef.current
    if (!fid) return
    setIsLoading(true)
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('family_id', fid)
      .order('due_day', { ascending: true })
    if (error) {
      console.error('[useBills] load error:', error.message)
    } else {
      setBills(data ?? [])
    }
    setIsLoading(false)
  }

  const totalMonthly = bills.reduce((s, b) => s + (b.amount ?? 0), 0)
  const paidTotal = bills
    .filter(b => b.status === 'paid' || b.status === 'auto_debit')
    .reduce((s, b) => s + (b.amount ?? 0), 0)
  const pendingTotal = bills
    .filter(b => b.status === 'pending' || b.status === 'overdue')
    .reduce((s, b) => s + (b.amount ?? 0), 0)

  async function updateStatus(id: string, status: Bill['status']) {
    await supabase
      .from('bills')
      .update({ status, paid_at: status === 'paid' ? new Date().toISOString() : null })
      .eq('id', id)
    await load()
  }

  async function upsert(bill: Partial<Bill> & { title: string }) {
    const fid = familyIdRef.current
    const payload = { ...bill }
    if (payload.assigned_to === '') payload.assigned_to = null

    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      await supabase.from('bills').update(updateData).eq('id', payload.id)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('bills').insert({
        ...payload,
        family_id: fid,
        created_by: user?.id ?? null,
      } as any)
      if (error) console.error('[useBills] upsert error:', error.message)
    }
    await load()
  }

  async function remove(id: string) {
    await supabase.from('bills').delete().eq('id', id)
    await load()
  }

  return {
    bills,
    totalMonthly,
    paidTotal,
    pendingTotal,
    monthlyBudget,
    isSavingBudget,
    isLoading,
    saveMonthlyBudget,
    updateStatus,
    upsert,
    remove,
    reload: load,
    byCategory: getBillsByCategory(bills),
  }
}

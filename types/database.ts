export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          name: string
          monthly_budget: number | null
          city: string | null
          state: string | null
          country: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['families']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['families']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          name: string
          nickname: string | null
          avatar_url: string | null
          family_id: string | null
          role: 'adult' | 'child' | 'teen' | 'other'
          birth_date: string | null
          height_cm: number | null
          weight_kg: number | null
          blood_type: string | null
          dietary_restrictions: string[]
          allergies: string[]
          medication_allergies: string[]
          school_or_company: string | null
          health_plan_name: string | null
          health_plan_number: string | null
          health_plan_active: boolean
          doctor_name: string | null
          doctor_phone: string | null
          passport_number: string | null
          passport_expiry: string | null
          color_hex: string
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      bills: {
        Row: {
          id: string
          title: string
          amount: number | null
          due_day: number | null
          due_date: string | null
          status: 'pending' | 'paid' | 'auto_debit' | 'overdue'
          is_recurring: boolean
          category: string | null
          payment_method: string | null
          domain_id: number | null
          created_by: string | null
          assigned_to: string | null
          paid_at: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['bills']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bills']['Insert']>
      }
      savings_goals: {
        Row: {
          id: string
          family_id: string
          title: string
          description: string | null
          target_amount: number
          current_amount: number
          currency: string
          deadline: string | null
          icon: string | null
          color_hex: string | null
          is_completed: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['savings_goals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['savings_goals']['Insert']>
      }
      budget_goals: {
        Row: {
          id: string
          family_id: string
          category: string
          monthly_limit: number
          icon: string | null
          color_hex: string | null
          alert_pct: number
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['budget_goals']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['budget_goals']['Insert']>
      }
      tasks: {
        Row: {
          id: string
          domain_id: number | null
          title: string
          description: string | null
          due_date: string | null
          status: 'pending' | 'in_progress' | 'done' | 'blocked'
          assigned_to: string | null
          created_by: string | null
          recurrence_id: string | null
          notes: string | null
          requires_supervision: boolean
          validated_by: string | null
          validated_at: string | null
          priority: 1 | 2 | 3
          visible_from: string | null
          completed_at: string | null
          checklist: ChecklistItem[] | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      medications: {
        Row: {
          id: string
          profile_id: string | null
          name: string
          dosage: string | null
          dosage_interval_hours: number
          weight_based: boolean
          form: 'liquid' | 'tablet' | 'drops' | 'other'
          concentration: string | null
          max_doses_per_day: number
          expiry_date: string | null
          stock_quantity: number
          minimum_stock: number
          storage_location: string | null
          notes: string | null
          is_active: boolean
          action_description: string | null
          action_date: string | null
          item_condition: 'ok' | 'broken' | 'missing' | 'needs_check'
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['medications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['medications']['Insert']>
      }
      medication_logs: {
        Row: {
          id: string
          profile_id: string | null
          medication_id: string | null
          given_at: string
          given_by: string | null
          dose_given: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['medication_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['medication_logs']['Insert']>
      }
      vaccines: {
        Row: {
          id: string
          profile_id: string | null
          name: string
          applied_at: string | null
          next_due: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['vaccines']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vaccines']['Insert']>
      }
      family_events: {
        Row: {
          id: string
          title: string
          event_date: string
          event_type: 'birthday' | 'school' | 'medical' | 'travel' | 'general'
          needs_action: boolean
          action_description: string | null
          budget: number | null
          is_done: boolean
          created_by: string | null
          family_id: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['family_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['family_events']['Insert']>
      }
      emergency_contacts: {
        Row: {
          id: string
          family_id: string | null
          name: string
          phone: string
          relationship: string | null
          is_primary: boolean
          notes: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['emergency_contacts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['emergency_contacts']['Insert']>
      }
      emotional_checkins: {
        Row: {
          id: string
          profile_id: string | null
          family_id: string | null
          practice: string
          done_at: string
          week_start: string | null
          mood_level: number | null
          notes: string | null
          registered_by: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['emotional_checkins']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['emotional_checkins']['Insert']>
      }
      wardrobe_items: {
        Row: {
          id: string
          profile_id: string | null
          item_type: string
          size: string | null
          season: 'summer' | 'winter' | 'all'
          status: 'fitting' | 'outgrown' | 'to_buy' | 'donate'
          quantity: number
          minimum_quantity: number
          season_alert_days: number
          last_checked_at: string | null
          notes: string | null
          action_description: string | null
          action_date: string | null
          responsible_id: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['wardrobe_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['wardrobe_items']['Insert']>
      }
      shopping_items: {
        Row: {
          id: string
          name: string
          quantity: string | null
          category: string | null
          domain_id: number | null
          requested_by: string | null
          is_bought: boolean
          bought_by: string | null
          bought_at: string | null
          is_recurring: boolean
          restock_when_below: number | null
          status: 'needed' | 'running_out' | 'bought'
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['shopping_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['shopping_items']['Insert']>
      }
      home_maintenance: {
        Row: {
          id: string
          family_id: string
          title: string
          emoji: string | null
          frequency_label: string
          frequency_days: number
          responsible_id: string | null
          last_done_at: string | null
          next_due_at: string | null
          status: 'ok' | 'due_soon' | 'overdue' | 'done'
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['home_maintenance']['Row'], 'id' | 'created_at' | 'next_due_at'>
        Update: Partial<Database['public']['Tables']['home_maintenance']['Insert']>
      }
    }
    Views: {
      monthly_history_view: {
        Row: {
          /** YYYY-MM — ex: "2026-04" */
          month: string
          family_id: string
          /** Total de contas pagas no mês */
          total_paid: number
          /** Total de contas ainda pendentes no mês */
          total_pending: number
          /** Total de contas em débito automático */
          total_auto_debit: number
          /** Soma geral de todas as contas do mês */
          total_amount: number
          /** Número de contas pagas */
          paid_count: number
          /** Número de contas pendentes */
          pending_count: number
          /** Número de contas em débito automático */
          auto_debit_count: number
          /** Total de contas no mês */
          total_count: number
          /** Categoria com maior gasto no mês (pode ser null se sem categoria) */
          top_category: string | null
          /** Valor gasto na top_category */
          top_category_amount: number | null
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ─── Table aliases ────────────────────────────────────────────────────────────
export type Family          = Database['public']['Tables']['families']['Row']
export type Profile         = Database['public']['Tables']['profiles']['Row']
export type Bill            = Database['public']['Tables']['bills']['Row']
export type SavingsGoal     = Database['public']['Tables']['savings_goals']['Row']
export type BudgetGoal      = Database['public']['Tables']['budget_goals']['Row']
export type Task            = Database['public']['Tables']['tasks']['Row']
export type Medication      = Database['public']['Tables']['medications']['Row']
export type MedicationLog   = Database['public']['Tables']['medication_logs']['Row']
export type Vaccine         = Database['public']['Tables']['vaccines']['Row']
export type FamilyEvent     = Database['public']['Tables']['family_events']['Row']
export type EmergencyContact = Database['public']['Tables']['emergency_contacts']['Row']
export type EmotionalCheckin = Database['public']['Tables']['emotional_checkins']['Row']
export type WardrobeItem    = Database['public']['Tables']['wardrobe_items']['Row']
export type ShoppingItem    = Database['public']['Tables']['shopping_items']['Row']
export type HomeMaintenance = Database['public']['Tables']['home_maintenance']['Row']

// ─── View aliases ─────────────────────────────────────────────────────────────
export type MonthlyHistoryRow = Database['public']['Views']['monthly_history_view']['Row']

// ─── Shared sub-types ─────────────────────────────────────────────────────────
export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

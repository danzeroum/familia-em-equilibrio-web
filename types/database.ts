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
        Relationships: never[]
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
          cpf: string | null
          rg: string | null
          gender: string | null
          chronic_condition: string | null
          continuous_medication: string | null
          health_plan_provider: string | null
          dentist_name: string | null
          last_doctor_visit: string | null
          last_dental_visit: string | null
          next_doctor_visit: string | null
          next_vaccine: string | null
          food_allergies: string[]
          environmental_allergies: string[]
          school_phone: string | null
          school_shift: string | null
          school_year: string | null
          teacher_or_manager: string | null
          extracurricular: string | null
          extracurricular_schedule: string | null
          transport_mode: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          name: string
          nickname?: string | null
          avatar_url?: string | null
          family_id?: string | null
          role?: 'adult' | 'child' | 'teen' | 'other'
          birth_date?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          blood_type?: string | null
          dietary_restrictions?: string[]
          allergies?: string[]
          medication_allergies?: string[]
          school_or_company?: string | null
          health_plan_name?: string | null
          health_plan_number?: string | null
          health_plan_active?: boolean
          doctor_name?: string | null
          doctor_phone?: string | null
          passport_number?: string | null
          passport_expiry?: string | null
          color_hex?: string
          cpf?: string | null
          rg?: string | null
          gender?: string | null
          chronic_condition?: string | null
          continuous_medication?: string | null
          health_plan_provider?: string | null
          dentist_name?: string | null
          last_doctor_visit?: string | null
          last_dental_visit?: string | null
          next_doctor_visit?: string | null
          next_vaccine?: string | null
          food_allergies?: string[]
          environmental_allergies?: string[]
          school_phone?: string | null
          school_shift?: string | null
          school_year?: string | null
          teacher_or_manager?: string | null
          extracurricular?: string | null
          extracurricular_schedule?: string | null
          transport_mode?: string | null
        }
        Update: {
          name?: string
          nickname?: string | null
          avatar_url?: string | null
          family_id?: string | null
          role?: 'adult' | 'child' | 'teen' | 'other'
          birth_date?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          blood_type?: string | null
          dietary_restrictions?: string[]
          allergies?: string[]
          medication_allergies?: string[]
          school_or_company?: string | null
          health_plan_name?: string | null
          health_plan_number?: string | null
          health_plan_active?: boolean
          doctor_name?: string | null
          doctor_phone?: string | null
          passport_number?: string | null
          passport_expiry?: string | null
          color_hex?: string
          cpf?: string | null
          rg?: string | null
          gender?: string | null
          chronic_condition?: string | null
          continuous_medication?: string | null
          health_plan_provider?: string | null
          dentist_name?: string | null
          last_doctor_visit?: string | null
          last_dental_visit?: string | null
          next_doctor_visit?: string | null
          next_vaccine?: string | null
          food_allergies?: string[]
          environmental_allergies?: string[]
          school_phone?: string | null
          school_shift?: string | null
          school_year?: string | null
          teacher_or_manager?: string | null
          extracurricular?: string | null
          extracurricular_schedule?: string | null
          transport_mode?: string | null
        }
        Relationships: never[]
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
          family_id: string | null
          created_by: string | null
          assigned_to: string | null
          paid_at: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['bills']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bills']['Insert']>
        Relationships: never[]
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
        Relationships: never[]
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
        Relationships: never[]
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
        Relationships: never[]
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
        Relationships: never[]
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
        Relationships: never[]
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
        Relationships: never[]
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
          budget_estimate: number | null
          is_done: boolean
          created_by: string | null
          family_id: string | null
          description: string | null
          event_time: string | null
          location: string | null
          assigned_to: string | null
          participants: string[] | null
          notes: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['family_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['family_events']['Insert']>
        Relationships: never[]
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
        Relationships: never[]
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
        Relationships: never[]
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
        Relationships: never[]
      }
      shopping_items: {
        Row: {
          id: string
          name: string
          quantity: string | null
          category: string | null
          domain_id: number | null
          family_id: string | null
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
        Relationships: never[]
      }
      home_maintenance: {
        Row: {
          id: string
          family_id: string
          title: string
          emoji: string | null
          category: string | null
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
        Insert: {
          family_id: string
          title: string
          emoji?: string | null
          category?: string | null
          frequency_label: string
          frequency_days: number
          responsible_id?: string | null
          last_done_at?: string | null
          next_due_at?: string | null
          notes?: string | null
          status?: 'ok' | 'due_soon' | 'overdue' | 'done'
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['home_maintenance']['Insert']>
        Relationships: never[]
      }
      maintenance_calls: {
        Row: {
          id: string
          family_id: string | null
          title: string
          description: string | null
          status: 'pending' | 'scheduled' | 'done' | null
          priority: number | null
          professional_name: string | null
          professional_phone: string | null
          estimated_cost: number | null
          scheduled_date: string | null
          domain_id: number | null
          created_by: string | null
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          family_id?: string | null
          title: string
          description?: string | null
          status?: 'pending' | 'scheduled' | 'done' | null
          priority?: number | null
          professional_name?: string | null
          professional_phone?: string | null
          estimated_cost?: number | null
          scheduled_date?: string | null
          domain_id?: number | null
          created_by?: string | null
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['maintenance_calls']['Insert']>
        Relationships: never[]
      }
      health_tracking: {
        Row: {
          id: string
          family_id: string
          profile_id: string | null
          title: string
          emoji: string
          category: string
          frequency_label: string
          frequency_days: number
          responsible_id: string | null
          last_done_at: string | null
          next_due_at: string | null
          notes: string | null
          status: string
          created_at: string
        }
        Insert: {
          family_id: string
          title: string
          emoji: string
          category: string
          frequency_label: string
          frequency_days: number
          profile_id?: string | null
          responsible_id?: string | null
          last_done_at?: string | null
          next_due_at?: string | null
          notes?: string | null
          status?: string
        }
        Update: Partial<Database['public']['Tables']['health_tracking']['Insert']>
        Relationships: never[]
      }
      task_categories: {
        Row: {
          id: string
          family_id: string | null
          name: string
          emoji: string
          group_name: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          family_id?: string | null
          name: string
          emoji: string
          group_name: string
          is_default?: boolean
        }
        Update: Partial<Database['public']['Tables']['task_categories']['Insert']>
        Relationships: never[]
      }
      school_communications: {
        Row: {
          id: string
          family_id: string
          profile_id: string | null
          type: 'whatsapp' | 'email' | 'reuniao' | 'telefone' | 'outro'
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'done'
          due_date: string | null
          created_by: string | null
          completed_at: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['school_communications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['school_communications']['Insert']>
        Relationships: never[]
      }
      school_homework: {
        Row: {
          id: string
          family_id: string
          profile_id: string | null
          subject: string
          title: string
          description: string | null
          due_date: string | null
          status: 'pending' | 'in_progress' | 'done'
          needs_help: boolean
          is_project: boolean
          created_by: string | null
          completed_at: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['school_homework']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['school_homework']['Insert']>
        Relationships: never[]
      }
      school_supplies: {
        Row: {
          id: string
          family_id: string
          profile_id: string | null
          name: string
          category: 'material' | 'uniforme' | 'livro' | 'sazonal' | 'outro'
          quantity_need: number
          quantity_have: number
          unit_price: number | null
          status: 'needed' | 'running_out' | 'bought'
          season: 'verao' | 'inverno' | 'todas' | null
          notes: string | null
          bought_by: string | null
          bought_at: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['school_supplies']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['school_supplies']['Insert']>
        Relationships: never[]
      }
      vehicles: {
        Row: {
          id: string
          family_id: string
          owner_id: string | null
          type: 'car' | 'motorcycle' | 'ebike' | 'bike' | 'scooter'
          nickname: string
          brand: string | null
          model: string | null
          year: number | null
          color: string | null
          plate: string | null
          fuel_type: 'gasoline' | 'ethanol' | 'flex' | 'diesel' | 'electric' | 'hybrid' | 'none' | null
          current_km: number | null
          battery_kwh: number | null
          battery_range_km: number | null
          garage_location: string | null
          photo_url: string | null
          is_active: boolean
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>
        Relationships: never[]
      }
      vehicle_documents: {
        Row: {
          id: string
          family_id: string
          vehicle_id: string
          type: 'ipva' | 'licenciamento' | 'seguro' | 'dpvat' | 'vistoria' | 'crlv' | 'outro'
          title: string
          due_date: string | null
          amount: number | null
          status: 'pending' | 'paid' | 'overdue' | 'renewed'
          paid_at: string | null
          reference_year: number | null
          policy_number: string | null
          provider: string | null
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['vehicle_documents']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vehicle_documents']['Insert']>
        Relationships: never[]
      }
      vehicle_maintenance: {
        Row: {
          id: string
          family_id: string
          vehicle_id: string
          title: string
          emoji: string | null
          category: string | null
          frequency_label: string
          frequency_days: number | null
          frequency_km: number | null
          last_done_at: string | null
          last_done_km: number | null
          next_due_at: string | null
          next_due_km: number | null
          responsible_id: string | null
          estimated_cost: number | null
          status: 'ok' | 'due_soon' | 'overdue' | 'done'
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['vehicle_maintenance']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vehicle_maintenance']['Insert']>
        Relationships: never[]
      }
      vehicle_calls: {
        Row: {
          id: string
          family_id: string
          vehicle_id: string
          title: string
          description: string | null
          status: 'pending' | 'scheduled' | 'done'
          priority: number
          professional_name: string | null
          professional_phone: string | null
          estimated_cost: number | null
          actual_cost: number | null
          scheduled_date: string | null
          completed_at: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['vehicle_calls']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vehicle_calls']['Insert']>
        Relationships: never[]
      }
      recipes: {
        Row: {
          id: string
          family_id: string
          title: string
          emoji: string | null
          ingredients: string | null
          instructions: string | null
          servings: number | null
          prep_minutes: number | null
          tags: string[]
          is_favorite: boolean
          created_by: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['recipes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['recipes']['Insert']>
        Relationships: never[]
      }
      meal_plan: {
        Row: {
          id: string
          family_id: string
          profile_id: string | null
          day_of_week: number
          meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner'
          title: string
          description: string | null
          recipe_id: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['meal_plan']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['meal_plan']['Insert']>
        Relationships: never[]
      }
      pantry_items: {
        Row: {
          id: string
          family_id: string
          name: string
          emoji: string | null
          category: string | null
          quantity: number | null
          unit: string | null
          minimum_quantity: number | null
          expiry_date: string | null
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['pantry_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['pantry_items']['Insert']>
        Relationships: never[]
      }
    }
    Views: {
      monthly_history_view: {
        Row: {
          /** YYYY-MM — ex: "2026-04" */
          month: string
          family_id: string
          total_paid: number
          total_pending: number
          total_auto_debit: number
          total_amount: number
          paid_count: number
          pending_count: number
          auto_debit_count: number
          total_count: number
          top_category: string | null
          top_category_amount: number | null
        }
        Relationships: never[]
      }
    }
    Functions: {
      /**
       * Retorna alertas do dia: contas vencidas/hoje/amanhã,
       * itens urgentes no supermercado e eventos familiares imediatos.
       * Recebe p_family_id explicitamente (RLS complementar).
       */
      get_daily_focus: {
        Args: { p_family_id: string }
        Returns: {
          /** 'bill' | 'shopping' | 'event' */
          source: string
          item_id: string
          title: string
          /** 'overdue' | 'today' | 'tomorrow' | 'running_out' */
          urgency: string
          amount: number
          /** ISO date string ou null */
          due_date: string | null
          emoji: string
          subtitle?: string | null
        }[]
      }
      /**
       * Retorna todos os eventos relevantes nos próximos 90 dias,
       * ordenados por urgency_score (1=crítico, 2=atenção, 3=informativo)
       * e depois por due_date.
       */
      get_radar_90: {
        Args: { p_family_id: string }
        Returns: {
          /** 'bill' | 'event' | 'maintenance' */
          source: string
          item_id: string
          title: string
          due_date: string
          days_until: number
          /** 1=crítico (≤7d) | 2=atenção (≤30d) | 3=informativo (>30d) */
          urgency_score: number
          amount: number
          category: string
          emoji: string
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ─── Table aliases ────────────────────────────────────────────────────────────
export type Family             = Database['public']['Tables']['families']['Row']
export type Profile            = Database['public']['Tables']['profiles']['Row']
export type Bill               = Database['public']['Tables']['bills']['Row']
export type SavingsGoal        = Database['public']['Tables']['savings_goals']['Row']
export type BudgetGoal         = Database['public']['Tables']['budget_goals']['Row']
export type Task               = Database['public']['Tables']['tasks']['Row']
export type Medication         = Database['public']['Tables']['medications']['Row']
export type MedicationLog      = Database['public']['Tables']['medication_logs']['Row']
export type Vaccine            = Database['public']['Tables']['vaccines']['Row']
export type FamilyEvent        = Database['public']['Tables']['family_events']['Row']
export type EmergencyContact   = Database['public']['Tables']['emergency_contacts']['Row']
export type EmotionalCheckin   = Database['public']['Tables']['emotional_checkins']['Row']
export type WardrobeItem       = Database['public']['Tables']['wardrobe_items']['Row']
export type ShoppingItem       = Database['public']['Tables']['shopping_items']['Row']
export type HomeMaintenance    = Database['public']['Tables']['home_maintenance']['Row']
export type MaintenanceCallRow = Database['public']['Tables']['maintenance_calls']['Row']
export type SchoolCommunication = Database['public']['Tables']['school_communications']['Row']
export type SchoolHomework      = Database['public']['Tables']['school_homework']['Row']
export type SchoolSupply        = Database['public']['Tables']['school_supplies']['Row']
export type Vehicle             = Database['public']['Tables']['vehicles']['Row']
export type VehicleDocument     = Database['public']['Tables']['vehicle_documents']['Row']
export type VehicleMaintenance  = Database['public']['Tables']['vehicle_maintenance']['Row']
export type VehicleCall         = Database['public']['Tables']['vehicle_calls']['Row']
export type Recipe              = Database['public']['Tables']['recipes']['Row']
export type MealPlan            = Database['public']['Tables']['meal_plan']['Row']
export type PantryItem          = Database['public']['Tables']['pantry_items']['Row']

// ─── View aliases ─────────────────────────────────────────────────────────────
export type MonthlyHistoryRow = Database['public']['Views']['monthly_history_view']['Row']

// ─── RPC return types ─────────────────────────────────────────────────────────
export type DailyFocusItem = Database['public']['Functions']['get_daily_focus']['Returns'][0]
export type Radar90Item    = Database['public']['Functions']['get_radar_90']['Returns'][0]

// ─── Shared sub-types ─────────────────────────────────────────────────────────
export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

// ─── Social Events ────────────────────────────────────────────────────────────
export interface SocialEvent {
  id: string
  family_id: string
  name: string
  event_type: string
  description: string | null
  event_date: string | null
  event_time: string | null
  status: string
  honoree_id: string | null
  location_name: string | null
  address: string | null
  location_url: string | null
  budget_planned: number | null
  cover_emoji: string
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface SocialEventTask {
  id: string
  event_id: string
  family_id: string
  title: string
  due_date: string | null
  due_time: string | null
  assigned_to: string | null
  priority: number
  status: string
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface SocialEventShopping {
  id: string
  event_id: string
  family_id: string
  name: string
  category: string | null
  quantity: number | null
  unit: string | null
  estimated_price: number | null
  actual_price: number | null
  store: string | null
  is_bought: boolean
  assigned_to: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface SocialEventContact {
  id: string
  event_id: string
  family_id: string
  name: string
  role: string
  phone: string | null
  email: string | null
  rsvp_status: string
  party_size: number
  vendor_type: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface SocialEventExpense {
  id: string
  event_id: string
  family_id: string
  description: string
  category: string | null
  planned_amount: number | null
  actual_amount: number | null
  vendor_id: string | null
  payment_status: string
  due_date: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

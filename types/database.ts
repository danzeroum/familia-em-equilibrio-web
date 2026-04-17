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
          category: 'fixed' | 'variable' | 'emergency' | 'savings'
          domain_id: number | null
          created_by: string | null
          paid_at: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['bills']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bills']['Insert']>
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
    }
  }
}

// Tipos derivados para uso nos componentes
export type Family = Database['public']['Tables']['families']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Bill = Database['public']['Tables']['bills']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Medication = Database['public']['Tables']['medications']['Row']
export type MedicationLog = Database['public']['Tables']['medication_logs']['Row']
export type Vaccine = Database['public']['Tables']['vaccines']['Row']
export type FamilyEvent = Database['public']['Tables']['family_events']['Row']
export type EmergencyContact = Database['public']['Tables']['emergency_contacts']['Row']
export type EmotionalCheckin = Database['public']['Tables']['emotional_checkins']['Row']
export type WardrobeItem = Database['public']['Tables']['wardrobe_items']['Row']
export type ShoppingItem = Database['public']['Tables']['shopping_items']['Row']

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

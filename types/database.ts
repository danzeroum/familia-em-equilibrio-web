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
      gratitude_notes: {
        Row: {
          id: string
          from_user_id: string | null
          to_user_id: string | null
          message: string
          created_at: string | null
        }
        Insert: {
          id?: string
          from_user_id?: string | null
          to_user_id?: string | null
          message: string
          created_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['gratitude_notes']['Insert']>
        Relationships: []
      }

      ai_settings: {
        Row: {
          id: string
          family_id: string
          model_id: string
          system_prompt: string | null
          provider: string | null
          api_key: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          family_id: string
          model_id?: string
          system_prompt?: string | null
          provider?: string | null
          api_key?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['ai_settings']['Insert']>
        Relationships: []
      }
      activity_feed: {
        Row: { id: string; user_id: string | null; action: string; entity_type: string; entity_id: string | null; entity_title: string | null; created_at: string | null }
        Insert: { id?: string; user_id?: string | null; action: string; entity_type: string; entity_id?: string | null; entity_title?: string | null; created_at?: string | null }
        Update: Partial<Database['public']['Tables']['activity_feed']['Insert']>
        Relationships: []
      }
      health_protocols: {
        Row: { id: string; profile_id: string | null; trigger_condition: string; action_text: string; priority: number | null; is_active: boolean | null; created_at: string | null }
        Insert: { id?: string; profile_id?: string | null; trigger_condition: string; action_text: string; priority?: number | null; is_active?: boolean | null; created_at?: string | null }
        Update: Partial<Database['public']['Tables']['health_protocols']['Insert']>
        Relationships: []
      }
      homework: {
        Row: { id: string; profile_id: string | null; title: string; subject: string | null; due_date: string | null; progress_pct: number | null; missing_steps: string | null; status: string | null; family_id: string | null; created_at: string | null }
        Insert: { id?: string; profile_id?: string | null; title: string; subject?: string | null; due_date?: string | null; progress_pct?: number | null; missing_steps?: string | null; status?: string | null; family_id?: string | null; created_at?: string | null }
        Update: Partial<Database['public']['Tables']['homework']['Insert']>
        Relationships: []
      }
      meal_ingredients: {
        Row: { id: string; meal_plan_id: string | null; shopping_item_id: string | null; item_name: string | null; quantity: string | null; created_at: string | null }
        Insert: { id?: string; meal_plan_id?: string | null; shopping_item_id?: string | null; item_name?: string | null; quantity?: string | null; created_at?: string | null }
        Update: Partial<Database['public']['Tables']['meal_ingredients']['Insert']>
        Relationships: []
      }
      meal_plans: {
        Row: {
          id: string
          family_id: string | null
          week_start: string
          day_of_week: number
          meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner'
          title: string | null
          profile_id: string | null
          notes: string | null
          recipe_id: string | null
          meals: any | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          family_id?: string | null
          week_start: string
          day_of_week: number
          meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner'
          title?: string | null
          profile_id?: string | null
          notes?: string | null
          recipe_id?: string | null
          meals?: any | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['meal_plans']['Insert']>
        Relationships: []
      }
      recurrence_rules: {
        Row: { id: string; frequency: string | null; interval: number | null; day_of_week: number | null; day_of_month: number | null; ends_at: string | null; anticipation_days: number | null; next_occurrence: string | null; last_generated_at: string | null }
        Insert: { id?: string; frequency?: string | null; interval?: number | null; day_of_week?: number | null; day_of_month?: number | null; ends_at?: string | null; anticipation_days?: number | null; next_occurrence?: string | null; last_generated_at?: string | null }
        Update: Partial<Database['public']['Tables']['recurrence_rules']['Insert']>
        Relationships: []
      }
      school_items: {
        Row: { id: string; profile_id: string | null; name: string; status: string | null; due_date: string | null; quantity: string | null; notes: string | null; created_at: string | null }
        Insert: { id?: string; profile_id?: string | null; name: string; status?: string | null; due_date?: string | null; quantity?: string | null; notes?: string | null; created_at?: string | null }
        Update: Partial<Database['public']['Tables']['school_items']['Insert']>
        Relationships: []
      }
      weekly_summaries: {
        Row: { id: string; user_id: string | null; week_start: string; tasks_done_count: number | null; tasks_pending_count: number | null; ai_tip: string | null; created_at: string | null }
        Insert: { id?: string; user_id?: string | null; week_start: string; tasks_done_count?: number | null; tasks_pending_count?: number | null; ai_tip?: string | null; created_at?: string | null }
        Update: Partial<Database['public']['Tables']['weekly_summaries']['Insert']>
        Relationships: []
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
          family_id: string | null
          domain_id: number | null
          title: string
          description: string | null
          due_date: string | null
          due_time: string | null
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
      leisure_activities: {
        Row: {
          id: string
          family_id: string
          title: string
          description: string | null
          category: LeisureCategory | null
          emoji: string | null
          for_children: boolean
          for_adults: boolean
          estimated_cost: number | null
          duration_hours: number | null
          location_name: string | null
          location_url: string | null
          tags: string[]
          status: LeisureStatus
          priority: LeisurePriority
          added_by: string | null
          task_id: string | null
          event_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          family_id: string
          title: string
          description?: string | null
          category?: LeisureCategory | null
          emoji?: string | null
          for_children?: boolean
          for_adults?: boolean
          estimated_cost?: number | null
          duration_hours?: number | null
          location_name?: string | null
          location_url?: string | null
          tags?: string[]
          status?: LeisureStatus
          priority?: LeisurePriority
          added_by?: string | null
          task_id?: string | null
          event_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['leisure_activities']['Insert']>
        Relationships: never[]
      }
      leisure_records: {
        Row: {
          id: string
          family_id: string
          activity_id: string | null
          title: string
          description: string | null
          date_realized: string
          emoji: string | null
          rating: number | null
          participants: string[]
          cost_actual: number | null
          location_name: string | null
          notes: string | null
          would_repeat: boolean
          created_at: string
        }
        Insert: {
          family_id: string
          title: string
          description?: string | null
          activity_id?: string | null
          date_realized?: string
          emoji?: string | null
          rating?: number | null
          participants?: string[]
          cost_actual?: number | null
          location_name?: string | null
          notes?: string | null
          would_repeat?: boolean
        }
        Update: Partial<Database['public']['Tables']['leisure_records']['Insert']>
        Relationships: never[]
      }
      leisure_places: {
        Row: {
          id: string
          family_id: string
          name: string
          category: LeisurePlaceCategory | null
          emoji: string | null
          address: string | null
          maps_url: string | null
          website_url: string | null
          notes: string | null
          is_favorite: boolean
          visited_count: number
          tags: string[]
          created_at: string
        }
        Insert: {
          family_id: string
          name: string
          category?: LeisurePlaceCategory | null
          emoji?: string | null
          address?: string | null
          maps_url?: string | null
          website_url?: string | null
          notes?: string | null
          is_favorite?: boolean
          visited_count?: number
          tags?: string[]
        }
        Update: Partial<Database['public']['Tables']['leisure_places']['Insert']>
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
          prep_time_min: number | null
          prep_minutes: number | null
          tags: string[]
          source_url: string | null
          is_favorite: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          family_id: string
          title: string
          emoji?: string | null
          ingredients?: string | null
          instructions?: string | null
          servings?: number | null
          prep_time_min?: number | null
          prep_minutes?: number | null
          tags?: string[]
          source_url?: string | null
          is_favorite?: boolean
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['recipes']['Insert']>
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
        Insert: {
          family_id: string
          name: string
          emoji?: string | null
          category?: string | null
          quantity?: number | null
          unit?: string | null
          minimum_quantity?: number | null
          expiry_date?: string | null
          notes?: string | null
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['pantry_items']['Insert']>
        Relationships: never[]
      }
      subtasks: {
        Row: {
          id: string
          task_id: string
          title: string
          is_done: boolean
          created_at: string | null
        }
        Insert: {
          task_id: string
          title: string
          is_done?: boolean
        }
        Update: Partial<Database['public']['Tables']['subtasks']['Insert']>
        Relationships: never[]
      }
      domains: {
        Row: {
          id: number
          slug: string
          label: string
          emoji: string
        }
        Insert: never
        Update: never
        Relationships: never[]
      }
      radar_cache: {
        Row: {
          id: string
          family_id: string
          radar_data: Json
          generated_at: string
          expires_at: string
        }
        Insert: {
          family_id: string
          radar_data: Json
          generated_at?: string
          expires_at: string
        }
        Update: Partial<Database['public']['Tables']['radar_cache']['Insert']>
        Relationships: never[]
      }
      calendar_events: {
        Row: {
          id: string
          family_id: string | null
          title: string
          description: string | null
          start_at: string
          end_at: string | null
          all_day: boolean
          event_type: string | null
          assigned_to: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['calendar_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['calendar_events']['Insert']>
        Relationships: never[]
      }
      // ─── Social ─────────────────────────────────────────────────────────────
      social_events: {
        Row: {
          id: string
          family_id: string
          name: string
          event_type: string
          status: 'planning' | 'confirmed' | 'done' | 'cancelled'
          event_date: string | null
          event_time: string | null
          location_name: string | null
          address: string | null
          cover_emoji: string | null
          budget_planned: number | null
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          family_id: string
          name: string
          event_type?: string
          status?: 'planning' | 'confirmed' | 'done' | 'cancelled'
          event_date?: string | null
          event_time?: string | null
          location_name?: string | null
          address?: string | null
          cover_emoji?: string | null
          budget_planned?: number | null
          notes?: string | null
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['social_events']['Insert']>
        Relationships: never[]
      }
      social_event_tasks: {
        Row: {
          id: string
          family_id: string
          event_id: string
          title: string
          status: 'pending' | 'done' | 'skipped'
          priority: number
          due_date: string | null
          assigned_to: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          family_id: string
          event_id: string
          title: string
          status?: 'pending' | 'done' | 'skipped'
          priority?: number
          due_date?: string | null
          assigned_to?: string | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['social_event_tasks']['Insert']>
        Relationships: never[]
      }
      social_event_shopping: {
        Row: {
          id: string
          family_id: string
          event_id: string
          name: string
          is_bought: boolean
          quantity: number | null
          unit: string | null
          store: string | null
          estimated_price: number | null
          actual_price: number | null
          assigned_to: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          family_id: string
          event_id: string
          name: string
          is_bought?: boolean
          quantity?: number | null
          unit?: string | null
          store?: string | null
          estimated_price?: number | null
          actual_price?: number | null
          assigned_to?: string | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['social_event_shopping']['Insert']>
        Relationships: never[]
      }
      social_event_contacts: {
        Row: {
          id: string
          family_id: string
          event_id: string
          name: string
          role: 'guest' | 'vendor' | 'helper' | 'other'
          rsvp_status: 'pending' | 'confirmed' | 'declined' | 'maybe'
          party_size: number
          phone: string | null
          email: string | null
          vendor_type: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          family_id: string
          event_id: string
          name: string
          role?: 'guest' | 'vendor' | 'helper' | 'other'
          rsvp_status?: 'pending' | 'confirmed' | 'declined' | 'maybe'
          party_size?: number
          phone?: string | null
          email?: string | null
          vendor_type?: string | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['social_event_contacts']['Insert']>
        Relationships: never[]
      }
      social_event_expenses: {
        Row: {
          id: string
          family_id: string
          event_id: string
          description: string
          category: string | null
          planned_amount: number | null
          actual_amount: number | null
          payment_status: 'pending' | 'partial' | 'paid'
          due_date: string | null
          vendor_contact_id: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          family_id: string
          event_id: string
          description: string
          category?: string | null
          planned_amount?: number | null
          actual_amount?: number | null
          payment_status?: 'pending' | 'partial' | 'paid'
          due_date?: string | null
          vendor_contact_id?: string | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['social_event_expenses']['Insert']>
        Relationships: never[]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export type LeisureCategory =
  | 'passeio'
  | 'viagem'
  | 'esporte'
  | 'cultura'
  | 'entretenimento'
  | 'natureza'
  | 'social'
  | 'educativo'
  | 'culinaria'
  | 'jogo'
  | 'outros'
  | 'outro'

export type LeisureStatus = 'wishlist' | 'planejado' | 'realizado' | 'cancelado'
export type LeisurePriority = 'low' | 'medium' | 'high' | 'alta' | 'media' | 'baixa'
export type LeisurePlaceCategory = 'parque' | 'praia' | 'restaurante' | 'cinema' | 'teatro' | 'museu' | 'esporte' | 'viagem' | 'clube' | 'shopping' | 'outros' | 'outro'

// ─── convenience aliases ──────────────────────────────────────────────────────
export type ShoppingItem        = Database['public']['Tables']['shopping_items']['Row']
export type MealPlan            = Database['public']['Tables']['meal_plans']['Row']
export type Recipe              = Database['public']['Tables']['recipes']['Row']
export type PantryItem          = Database['public']['Tables']['pantry_items']['Row']
export type Task                = Database['public']['Tables']['tasks']['Row']
export type Bill                = Database['public']['Tables']['bills']['Row']
export type FamilyEvent         = Database['public']['Tables']['family_events']['Row']
export type Profile             = Database['public']['Tables']['profiles']['Row']
export type Medication          = Database['public']['Tables']['medications']['Row']
export type Vaccine             = Database['public']['Tables']['vaccines']['Row']
export type HomeMaintenance     = Database['public']['Tables']['home_maintenance']['Row']
export type WardrobeItem        = Database['public']['Tables']['wardrobe_items']['Row']
export type EmergencyContact    = Database['public']['Tables']['emergency_contacts']['Row']
export type EmotionalCheckin    = Database['public']['Tables']['emotional_checkins']['Row']
export type CalendarEvent       = Database['public']['Tables']['calendar_events']['Row']
export type Vehicle             = Database['public']['Tables']['vehicles']['Row']
export type VehicleDocument     = Database['public']['Tables']['vehicle_documents']['Row']
export type VehicleMaintenance  = Database['public']['Tables']['vehicle_maintenance']['Row']
export type LeisureActivity     = Database['public']['Tables']['leisure_activities']['Row']
export type LeisureRecord       = Database['public']['Tables']['leisure_records']['Row']
export type LeisurePlace        = Database['public']['Tables']['leisure_places']['Row']
export type TaskCategory        = Database['public']['Tables']['task_categories']['Row']
export type SavingsGoal         = Database['public']['Tables']['savings_goals']['Row']
export type BudgetGoal          = Database['public']['Tables']['budget_goals']['Row']
// ─── school aliases (educacao page) ──────────────────────────────────────────
export type SchoolCommunication = Database['public']['Tables']['school_communications']['Row']
export type SchoolHomework      = Database['public']['Tables']['school_homework']['Row']
export type SchoolSupply        = Database['public']['Tables']['school_supplies']['Row']
// ─── social aliases ───────────────────────────────────────────────────────────
export type SocialEvent         = Database['public']['Tables']['social_events']['Row']
export type SocialEventTask     = Database['public']['Tables']['social_event_tasks']['Row']
export type SocialEventShopping = Database['public']['Tables']['social_event_shopping']['Row']
export type SocialEventContact  = Database['public']['Tables']['social_event_contacts']['Row']
export type SocialEventExpense  = Database['public']['Tables']['social_event_expenses']['Row']

// ─── more table aliases ───────────────────────────────────────────────────────
export type Family      = Database['public']['Tables']['families']['Row']
export type VehicleCall = Database['public']['Tables']['vehicle_calls']['Row']

// ─── dashboard RPC return types ───────────────────────────────────────────────
export interface DailyFocusItem {
  source: 'bill' | 'shopping' | 'event'
  item_id: string
  title: string
  urgency: 'overdue' | 'running_out' | 'today' | 'tomorrow' | 'due_soon'
  amount: number
  due_date: string | null
  emoji: string
  subtitle: string | null
}

export interface Radar90Item {
  source: 'bill' | 'event' | 'maintenance'
  item_id: string
  title: string
  due_date: string
  days_until: number
  urgency_score: number
  amount: number
  category: string
  emoji: string
}

// ─── quick register ───────────────────────────────────────────────────────────
export type QuickRegisterType =
  | 'task'
  | 'subtask'
  | 'medication'
  | 'bill'
  | 'shopping'
  | 'maintenance'
  | 'event'
  | 'vaccine'
  | 'mood'
  | 'health_tracking'
  | 'homework'
  | 'school_item'
  | 'emergency_contact'
  | 'gratitude'
  | 'maintenance_call'

export const QUICK_REGISTER_ITEMS: ReadonlyArray<{
  type: QuickRegisterType
  label: string
  emoji: string
}> = [
  { type: 'task',              label: 'Tarefa',              emoji: '✅' },
  { type: 'subtask',           label: 'Subtarefa',           emoji: '➕' },
  { type: 'event',             label: 'Evento',              emoji: '📅' },
  { type: 'bill',              label: 'Conta',               emoji: '💳' },
  { type: 'shopping',          label: 'Compras',             emoji: '🛒' },
  { type: 'medication',        label: 'Medicamento',         emoji: '💊' },
  { type: 'vaccine',           label: 'Vacina',              emoji: '💉' },
  { type: 'health_tracking',   label: 'Saúde',               emoji: '❤️' },
  { type: 'mood',              label: 'Check-in',            emoji: '🧠' },
  { type: 'maintenance',       label: 'Manutenção',          emoji: '🔧' },
  { type: 'maintenance_call',  label: 'Orçamento',           emoji: '📞' },
  { type: 'homework',          label: 'Tarefa escolar',      emoji: '📚' },
  { type: 'school_item',       label: 'Material escolar',    emoji: '🎒' },
  { type: 'emergency_contact', label: 'Contato emergência',  emoji: '🚨' },
  { type: 'gratitude',         label: 'Gratidão',            emoji: '🙏' },
]

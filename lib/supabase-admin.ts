import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Em Docker, SUPABASE_URL aponta para http://kong:8000 (rede interna).
// Em dev local ou Cloud, cai no fallback NEXT_PUBLIC_SUPABASE_URL.
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!

// Usa service_role — bypassa RLS. Só usar em API Routes server-side.
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

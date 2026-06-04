import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Usa service_role — bypassa RLS. Só usar em API Routes server-side.
// SUPABASE_URL (sem NEXT_PUBLIC_) aponta para http://kong:8000 dentro do Docker,
// evitando que chamadas server-side tentem resolver localhost dentro do container.
export const supabaseAdmin = createClient<Database>(
  (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

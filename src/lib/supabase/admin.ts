import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente con service_role: bypassa RLS. SOLO usar en el servidor (bot de Telegram).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

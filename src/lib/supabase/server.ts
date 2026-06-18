import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Sin login: el acceso a la app es directo y las consultas corren con service_role
// en el servidor (nunca se expone al navegador). RLS sigue activa, así que la
// anon key pública NO puede leer/escribir la base directamente.
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

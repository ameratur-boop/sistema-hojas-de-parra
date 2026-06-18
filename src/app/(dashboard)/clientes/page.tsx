import { createClient } from '@/lib/supabase/server'
import type { Cliente } from '@/lib/types'
import { ClientesManager } from './ClientesManager'

export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  const supabase = createClient()
  const { data } = await supabase.from('clientes').select('*').order('nombre')
  return <ClientesManager clientes={(data as Cliente[]) ?? []} />
}

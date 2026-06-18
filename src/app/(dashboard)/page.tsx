import { createClient } from '@/lib/supabase/server'
import type { Cliente, ResumenCliente } from '@/lib/types'
import { MorososView } from './MorososView'
import { QuickAdd } from '@/components/QuickAdd'

export const dynamic = 'force-dynamic'

export default async function MorososPage() {
  const supabase = createClient()

  const [{ data: resumen }, { data: clientes }] = await Promise.all([
    supabase
      .from('vw_resumen_clientes')
      .select('*')
      .gt('saldo', 0)
      .order('deuda_desde', { ascending: true, nullsFirst: false }),
    supabase.from('clientes').select('*').order('nombre'),
  ])

  const morosos = (resumen as ResumenCliente[]) ?? []
  const totalAdeudado = morosos.reduce((s, m) => s + Number(m.saldo), 0)

  return (
    <div className="space-y-6">
      <QuickAdd />
      <MorososView
        morosos={morosos}
        totalAdeudado={totalAdeudado}
        clientes={(clientes as Cliente[]) ?? []}
      />
    </div>
  )
}

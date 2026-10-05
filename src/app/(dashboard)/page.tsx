import { createClient } from '@/lib/supabase/server'
import type { ResumenCliente } from '@/lib/types'
import { obtenerPulso } from '@/lib/pulso'
import { MorososView } from './MorososView'
import { QuickAdd } from '@/components/QuickAdd'
import { PulsoCobros } from '@/components/PulsoCobros'
import { NuevoClienteRapido } from '@/components/NuevoClienteRapido'
import { PageHeader } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function InicioPage() {
  const supabase = createClient()

  const [{ data: deudores }, pulso] = await Promise.all([
    supabase
      .from('vw_resumen_clientes')
      .select('*')
      .gt('saldo', 0)
      .order('deuda_desde', { ascending: true, nullsFirst: false }),
    obtenerPulso(supabase),
  ])

  return (
    <>
      <PageHeader title="Inicio">
        <NuevoClienteRapido />
      </PageHeader>
      <div className="space-y-8">
        <PulsoCobros inicial={pulso} />
        <QuickAdd />
        <MorososView morosos={(deudores as ResumenCliente[]) ?? []} />
      </div>
    </>
  )
}

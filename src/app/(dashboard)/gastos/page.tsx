import { createClient } from '@/lib/supabase/server'
import { traerTodo } from '@/lib/supabase/paginar'
import { traerGastos } from '@/lib/gastos'
import { hoyAR } from '@/lib/format'
import { GastosManager } from './GastosManager'

export const dynamic = 'force-dynamic'

type Movimiento = { fecha: string; monto: number }

export default async function GastosPage() {
  const supabase = createClient()
  const [{ gastos, faltaTabla }, ventas, cobros] = await Promise.all([
    traerGastos(supabase),
    traerTodo<{ fecha: string; total: number }>((desde, hasta) =>
      supabase.from('pedidos').select('fecha, total').order('id').range(desde, hasta),
    ),
    traerTodo<Movimiento>((desde, hasta) => supabase.from('pagos').select('fecha, monto').order('id').range(desde, hasta)),
  ])

  return (
    <GastosManager
      gastos={gastos}
      faltaTabla={faltaTabla}
      ventas={ventas.map((v) => ({ fecha: v.fecha, monto: Number(v.total) }))}
      cobros={cobros.map((c) => ({ fecha: c.fecha, monto: Number(c.monto) }))}
      hoy={hoyAR()}
    />
  )
}

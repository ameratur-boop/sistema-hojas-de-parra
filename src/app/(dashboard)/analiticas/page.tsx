import { createClient } from '@/lib/supabase/server'
import { traerTodo } from '@/lib/supabase/paginar'
import { clasificarItem } from '@/lib/productos'
import { hoyAR } from '@/lib/format'
import { traerGastos } from '@/lib/gastos'
import type { Cobro, Linea } from '@/lib/analytics'
import { AnaliticasView } from './AnaliticasView'

export const dynamic = 'force-dynamic'

type ItemFila = {
  pedido_id: string
  descripcion: string
  cantidad: number
  subtotal: number
  productos: { nombre: string } | null
  pedidos: { fecha: string }
}

export default async function AnaliticasPage() {
  const supabase = createClient()
  const [items, pagos, { gastos, faltaTabla }] = await Promise.all([
    traerTodo<ItemFila>((desde, hasta) =>
      supabase
        .from('pedido_items')
        .select('pedido_id, descripcion, cantidad, subtotal, productos(nombre), pedidos!inner(fecha)')
        .order('id')
        .range(desde, hasta)
        .returns<ItemFila[]>(),
    ),
    traerTodo<Cobro>((desde, hasta) =>
      supabase.from('pagos').select('fecha, monto').order('id').range(desde, hasta).returns<Cobro[]>(),
    ),
    traerGastos(supabase),
  ])

  const lineas: Linea[] = items.map((it) => {
    const c = clasificarItem({ descripcion: it.descripcion, producto: it.productos?.nombre })
    return {
      fecha: it.pedidos.fecha,
      pedidoId: it.pedido_id,
      presentacion: c.presentacion,
      canal: c.canal,
      cantidad: Number(it.cantidad),
      monto: Number(it.subtotal),
    }
  })

  return (
    <AnaliticasView
      lineas={lineas}
      cobros={pagos.map((p) => ({ fecha: p.fecha, monto: Number(p.monto) }))}
      gastos={faltaTabla ? null : gastos.map((g) => ({ fecha: g.fecha, monto: g.monto }))}
      hoy={hoyAR()}
    />
  )
}

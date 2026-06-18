import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Cliente, Producto, Pago, ResumenCliente } from '@/lib/types'
import { ClienteDetalle } from './ClienteDetalle'

export const dynamic = 'force-dynamic'

export default async function ClientePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const id = params.id

  const { data: cliente } = await supabase.from('clientes').select('*').eq('id', id).single()
  if (!cliente) notFound()

  const [{ data: resumen }, { data: pedidos }, { data: pagos }, { data: productos }] =
    await Promise.all([
      supabase.from('vw_resumen_clientes').select('*').eq('cliente_id', id).maybeSingle(),
      supabase
        .from('pedidos')
        .select(
          'id, fecha, envio, total, created_via, pedido_items(id, descripcion, cantidad, precio_unitario, subtotal)',
        )
        .eq('cliente_id', id)
        .order('fecha', { ascending: false }),
      supabase.from('pagos').select('*').eq('cliente_id', id).order('fecha', { ascending: false }),
      supabase.from('productos').select('*').eq('activo', true).order('precio', { ascending: false }),
    ])

  return (
    <ClienteDetalle
      cliente={cliente as Cliente}
      resumen={(resumen as ResumenCliente) ?? null}
      pedidos={(pedidos as never[]) ?? []}
      pagos={(pagos as Pago[]) ?? []}
      productos={(productos as Producto[]) ?? []}
    />
  )
}

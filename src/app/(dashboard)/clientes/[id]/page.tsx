import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Cliente, Producto, Pago, ResumenCliente } from '@/lib/types'
import { ClienteDetalle, type PedidoConItems } from './ClienteDetalle'

export const dynamic = 'force-dynamic'

export default async function ClientePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const id = params.id

  const [{ data: cliente }, { data: resumen }, { data: pedidos }, { data: pagos }, { data: productos }] =
    await Promise.all([
      supabase.from('clientes').select('*').eq('id', id).maybeSingle(),
      supabase.from('vw_resumen_clientes').select('*').eq('cliente_id', id).maybeSingle(),
      supabase
        .from('pedidos')
        .select('id, fecha, envio, notas, total, created_at, pedido_items(descripcion, cantidad, subtotal, productos(nombre))')
        .eq('cliente_id', id),
      supabase.from('pagos').select('*').eq('cliente_id', id),
      supabase.from('productos').select('*').eq('activo', true),
    ])

  if (!cliente) notFound()

  return (
    <ClienteDetalle
      cliente={cliente as Cliente}
      resumen={(resumen as ResumenCliente) ?? null}
      pedidos={(pedidos as unknown as PedidoConItems[]) ?? []}
      pagos={(pagos as Pago[]) ?? []}
      productos={(productos as Producto[]) ?? []}
    />
  )
}

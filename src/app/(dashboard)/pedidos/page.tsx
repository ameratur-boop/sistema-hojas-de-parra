import { createClient } from '@/lib/supabase/server'
import type { Cliente, Producto } from '@/lib/types'
import { PedidosManager, type PedidoFila } from './PedidosManager'

export const dynamic = 'force-dynamic'

const LIMITE = 300

export default async function PedidosPage() {
  const supabase = createClient()
  const [{ data: pedidos, count }, { data: clientes }, { data: productos }] = await Promise.all([
    supabase
      .from('pedidos')
      .select('id, cliente_id, fecha, envio, total, clientes(nombre), pedido_items(descripcion, cantidad, productos(nombre))', {
        count: 'exact',
      })
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(LIMITE),
    supabase.from('clientes').select('id, nombre').order('nombre'),
    supabase.from('productos').select('*').eq('activo', true),
  ])

  return (
    <PedidosManager
      pedidos={(pedidos as unknown as PedidoFila[]) ?? []}
      total={count ?? 0}
      clientes={(clientes as Cliente[]) ?? []}
      productos={(productos as Producto[]) ?? []}
    />
  )
}

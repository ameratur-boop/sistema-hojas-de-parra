import { createClient } from '@/lib/supabase/server'
import type { Cliente, Producto } from '@/lib/types'
import { PedidosManager, type PedidoFila } from './PedidosManager'

export const dynamic = 'force-dynamic'

export default async function PedidosPage() {
  const supabase = createClient()
  const [{ data: pedidos }, { data: clientes }, { data: productos }] = await Promise.all([
    supabase
      .from('pedidos')
      .select('id, cliente_id, fecha, envio, total, created_via, clientes(nombre)')
      .order('fecha', { ascending: false })
      .limit(200),
    supabase.from('clientes').select('*').order('nombre'),
    supabase.from('productos').select('*').eq('activo', true).order('precio', { ascending: false }),
  ])

  return (
    <PedidosManager
      pedidos={(pedidos as unknown as PedidoFila[]) ?? []}
      clientes={(clientes as Cliente[]) ?? []}
      productos={(productos as Producto[]) ?? []}
    />
  )
}

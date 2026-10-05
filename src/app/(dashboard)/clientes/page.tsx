import { createClient } from '@/lib/supabase/server'
import { traerTodo } from '@/lib/supabase/paginar'
import { clasificarItem } from '@/lib/productos'
import type { Cliente } from '@/lib/types'
import { ClientesManager, type FilaCliente } from './ClientesManager'

export const dynamic = 'force-dynamic'

type ItemCliente = {
  cantidad: number
  descripcion: string
  productos: { nombre: string } | null
  pedidos: { cliente_id: string }
}

export default async function ClientesPage() {
  const supabase = createClient()
  const [{ data: clientes }, { data: resumen }, items] = await Promise.all([
    supabase.from('clientes').select('*').order('nombre'),
    supabase.from('vw_resumen_clientes').select('cliente_id, saldo, ultimo_pedido'),
    traerTodo<ItemCliente>((desde, hasta) =>
      supabase
        .from('pedido_items')
        .select('cantidad, descripcion, productos(nombre), pedidos!inner(cliente_id)')
        .order('id')
        .range(desde, hasta)
        .returns<ItemCliente[]>(),
    ),
  ])

  const bolsas = new Map<string, { mayor: number; menor: number }>()
  for (const it of items) {
    const id = it.pedidos.cliente_id
    const b = bolsas.get(id) ?? { mayor: 0, menor: 0 }
    b[clasificarItem({ descripcion: it.descripcion, producto: it.productos?.nombre }).canal] += Number(it.cantidad)
    bolsas.set(id, b)
  }
  const resumenPor = new Map(
    ((resumen as { cliente_id: string; saldo: number; ultimo_pedido: string | null }[]) ?? []).map((r) => [r.cliente_id, r]),
  )

  const filas: FilaCliente[] = ((clientes as Cliente[]) ?? []).map((c) => ({
    ...c,
    saldo: Number(resumenPor.get(c.id)?.saldo ?? 0),
    ultimoPedido: resumenPor.get(c.id)?.ultimo_pedido ?? null,
    bolsas: bolsas.get(c.id) ?? { mayor: 0, menor: 0 },
  }))

  return <ClientesManager filas={filas} />
}

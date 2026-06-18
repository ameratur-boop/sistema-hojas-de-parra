'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ItemNuevo } from '@/lib/types'

function revalidarTodo(clienteId?: string) {
  revalidatePath('/')
  revalidatePath('/pedidos')
  revalidatePath('/reportes')
  revalidatePath('/clientes')
  if (clienteId) revalidatePath(`/clientes/${clienteId}`)
}

export async function crearPedido(data: {
  cliente_id: string
  fecha: string
  envio?: string
  notas?: string
  items: ItemNuevo[]
  created_via?: string
}) {
  const supabase = createClient()
  if (!data.items.length) return { error: 'El pedido no tiene items.' }

  const { data: pedidoId, error } = await supabase.rpc('crear_pedido', {
    p_cliente_id: data.cliente_id,
    p_fecha: data.fecha,
    p_envio: data.envio || null,
    p_notas: data.notas || null,
    p_items: data.items.map((i) => ({
      producto_id: i.producto_id || null,
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
    })),
    p_created_via: data.created_via || 'web',
  })
  if (error) return { error: error.message }
  revalidarTodo(data.cliente_id)
  return { error: null, pedidoId: pedidoId as string }
}

export async function eliminarPedido(id: string, clienteId?: string) {
  const supabase = createClient()
  const { error } = await supabase.from('pedidos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidarTodo(clienteId)
  return { error: null }
}

export async function registrarPago(data: {
  cliente_id: string
  fecha: string
  monto: number
  metodo?: string
  notas?: string
  pedido_id?: string | null
  created_via?: string
}) {
  const supabase = createClient()
  if (!data.monto || data.monto <= 0) return { error: 'El monto debe ser mayor a cero.' }

  const { error } = await supabase.rpc('registrar_pago', {
    p_cliente_id: data.cliente_id,
    p_fecha: data.fecha,
    p_monto: data.monto,
    p_metodo: data.metodo || null,
    p_notas: data.notas || null,
    p_pedido_id: data.pedido_id || null,
    p_created_via: data.created_via || 'web',
  })
  if (error) return { error: error.message }
  revalidarTodo(data.cliente_id)
  return { error: null }
}

export async function eliminarPago(id: string, clienteId?: string) {
  const supabase = createClient()
  const { error } = await supabase.from('pagos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidarTodo(clienteId)
  return { error: null }
}

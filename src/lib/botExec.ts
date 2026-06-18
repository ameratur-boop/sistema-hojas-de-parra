import type { SupabaseClient } from '@supabase/supabase-js'
import type { Operacion } from './interpret'
import { formatMoney, formatDate } from './format'

type Admin = SupabaseClient

const hoy = () => new Date().toISOString().slice(0, 10)

export async function buscarCliente(admin: Admin, nombre?: string) {
  if (!nombre) return null
  const { data } = await admin
    .from('clientes')
    .select('id, nombre')
    .ilike('nombre', `%${nombre.trim()}%`)
    .limit(1)
  return data && data.length ? (data[0] as { id: string; nombre: string }) : null
}

function totalDe(op: Operacion) {
  return (op.items ?? []).reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)
}

// Texto de confirmación (antes de guardar)
export async function resumenOperacion(admin: Admin, op: Operacion): Promise<string> {
  const cli = await buscarCliente(admin, op.cliente_nombre)
  const nombre = cli?.nombre ?? op.cliente_nombre ?? '—'
  const nuevo = !cli && op.cliente_nombre ? ' <i>(cliente nuevo)</i>' : ''

  if (op.tipo === 'pedido') {
    const lineas = (op.items ?? [])
      .map((i) => `• ${i.cantidad} × ${i.descripcion} × ${formatMoney(i.precio_unitario)} = ${formatMoney(i.cantidad * i.precio_unitario)}`)
      .join('\n')
    return `📋 <b>Pedido</b> — ${nombre}${nuevo}\nFecha: ${formatDate(op.fecha ?? hoy())}\n${lineas}\n<b>Total: ${formatMoney(totalDe(op))}</b>\n\n¿Confirmar?`
  }
  if (op.tipo === 'pago') {
    return `💵 <b>Pago</b> — ${nombre}${nuevo}\nFecha: ${formatDate(op.fecha ?? hoy())}\nMonto: <b>${formatMoney(op.monto ?? 0)}</b>${op.metodo ? `\nMétodo: ${op.metodo}` : ''}\n\n¿Confirmar?`
  }
  if (op.tipo === 'cliente') {
    return `👤 <b>Nuevo cliente</b>\nNombre: ${op.cliente_nombre ?? '—'}${op.telefono ? `\nTeléfono: ${op.telefono}` : ''}\n\n¿Confirmar?`
  }
  return 'No entendí la operación.'
}

// Ejecuta la operación ya confirmada
export async function aplicarOperacion(admin: Admin, op: Operacion): Promise<string> {
  // Alta de cliente
  if (op.tipo === 'cliente') {
    if (!op.cliente_nombre) return '❌ Falta el nombre del cliente.'
    const existente = await buscarCliente(admin, op.cliente_nombre)
    if (existente) return `ℹ️ El cliente <b>${existente.nombre}</b> ya existe.`
    const { error } = await admin
      .from('clientes')
      .insert({ nombre: op.cliente_nombre.trim(), telefono: op.telefono ?? null })
    if (error) return `❌ Error: ${error.message}`
    return `✅ Cliente <b>${op.cliente_nombre.trim()}</b> creado.`
  }

  let cli = await buscarCliente(admin, op.cliente_nombre)

  if (!cli && op.cliente_nombre) {
    const { data, error } = await admin
      .from('clientes')
      .insert({ nombre: op.cliente_nombre.trim() })
      .select('id, nombre')
      .single()
    if (error) return `❌ Error creando cliente: ${error.message}`
    cli = data as { id: string; nombre: string }
  }
  if (!cli) return '❌ Falta el cliente.'

  if (op.tipo === 'pedido') {
    const { error } = await admin.rpc('crear_pedido', {
      p_cliente_id: cli.id,
      p_fecha: op.fecha ?? hoy(),
      p_envio: null,
      p_notas: op.nota ?? null,
      p_items: (op.items ?? []).map((i) => ({
        producto_id: null,
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
      })),
      p_created_via: 'telegram',
    })
    if (error) return `❌ Error: ${error.message}`
    return `✅ Pedido cargado para <b>${cli.nombre}</b> por ${formatMoney(totalDe(op))}.`
  }

  if (op.tipo === 'pago') {
    const { error } = await admin.rpc('registrar_pago', {
      p_cliente_id: cli.id,
      p_fecha: op.fecha ?? hoy(),
      p_monto: op.monto ?? 0,
      p_metodo: op.metodo ?? null,
      p_notas: op.nota ?? null,
      p_pedido_id: null,
      p_created_via: 'telegram',
    })
    if (error) return `❌ Error: ${error.message}`
    return `✅ Pago de ${formatMoney(op.monto ?? 0)} registrado para <b>${cli.nombre}</b>.`
  }

  return '❌ Operación no reconocida.'
}

export async function consultarMorosos(admin: Admin): Promise<string> {
  const { data } = await admin
    .from('vw_resumen_clientes')
    .select('nombre, saldo, deuda_desde')
    .gt('saldo', 0)
    .order('deuda_desde', { ascending: true, nullsFirst: false })
    .limit(20)
  const rows = (data as { nombre: string; saldo: number; deuda_desde: string | null }[]) ?? []
  if (!rows.length) return '🎉 No hay morosos.'
  const lista = rows
    .map((r, i) => `${i + 1}. <b>${r.nombre}</b> — ${formatMoney(r.saldo)} (desde ${formatDate(r.deuda_desde)})`)
    .join('\n')
  return `⚠️ <b>Morosos</b> (más antiguos primero):\n${lista}`
}

export async function consultarSaldo(admin: Admin, nombre?: string): Promise<string> {
  const cli = await buscarCliente(admin, nombre)
  if (!cli) return `No encontré al cliente ${nombre ?? ''}.`
  const { data } = await admin
    .from('vw_resumen_clientes')
    .select('saldo, total_pedidos, total_pagado')
    .eq('cliente_id', cli.id)
    .maybeSingle()
  const r = data as { saldo: number; total_pedidos: number; total_pagado: number } | null
  if (!r) return `${cli.nombre}: sin movimientos.`
  return `<b>${cli.nombre}</b>\nPedidos: ${formatMoney(r.total_pedidos)}\nPagado: ${formatMoney(r.total_pagado)}\n<b>Saldo: ${formatMoney(r.saldo)}</b>`
}

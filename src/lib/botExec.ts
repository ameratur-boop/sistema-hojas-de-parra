import type { SupabaseClient } from '@supabase/supabase-js'
import { interpretar, type Operacion, type ProductoCtx } from './interpret'
import { formatMoney, formatDate, hoyAR } from './format'
import { CANAL_LABEL, clasificar, nombreBolsa } from './productos'

type Admin = SupabaseClient
type Cli = { id: string; nombre: string }

export type Resultado =
  | { kind: 'confirm'; op: Operacion; texto: string }
  | { kind: 'info'; texto: string }
  | { kind: 'error'; texto: string }

export const NO_ENTENDI = 'No entendí. Probá con "Sukaria 24x300", "Sukaria pagó 500 mil" o "quién debe".'

// Flujo común de la carga rápida web y el bot de Telegram: interpretar y decidir qué responder.
export async function procesarTexto(admin: Admin, texto: string): Promise<Resultado> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { kind: 'error', texto: 'Falta configurar ANTHROPIC_API_KEY en el servidor.' }
  }
  const [{ data: clientes }, { data: productos }] = await Promise.all([
    admin.from('clientes').select('nombre').order('nombre'),
    admin.from('productos').select('id, nombre, precio').eq('activo', true),
  ])

  let op: Operacion
  try {
    op = await interpretar(texto, {
      clientes: clientes ?? [],
      productos: (productos as ProductoCtx[]) ?? [],
      hoy: hoyAR(),
    })
  } catch (e) {
    return { kind: 'error', texto: `No pude interpretar el mensaje: ${e instanceof Error ? e.message : 'error desconocido'}` }
  }

  if (op.tipo === 'consulta_morosos') return { kind: 'info', texto: await consultarMorosos(admin) }
  if (op.tipo === 'consulta_saldo') return { kind: 'info', texto: await consultarSaldo(admin, op.cliente_nombre) }
  if (
    op.tipo === 'desconocido' ||
    (op.tipo === 'pedido' && !op.items?.length) ||
    (op.tipo === 'pago' && !op.monto) ||
    (op.tipo === 'cliente' && !op.cliente_nombre)
  ) {
    return { kind: 'error', texto: NO_ENTENDI }
  }

  const r = await resumenOperacion(admin, op)
  return r.ok ? { kind: 'confirm', op, texto: r.texto } : { kind: 'error', texto: r.texto }
}

const escaparLike = (s: string) => s.replace(/[\\%_]/g, '\\$&')

// Coincidencia exacta primero; si no, parcial solo cuando hay un único candidato.
// Con varios candidatos no se adivina: se piden más datos.
export async function resolverCliente(
  admin: Admin,
  nombre?: string,
): Promise<{ cliente: Cli | null; opciones: string[] }> {
  if (!nombre?.trim()) return { cliente: null, opciones: [] }
  const n = escaparLike(nombre.trim())
  const { data: exacto } = await admin.from('clientes').select('id, nombre').ilike('nombre', n).limit(1)
  if (exacto?.length) return { cliente: exacto[0] as Cli, opciones: [] }
  const { data: parcial } = await admin.from('clientes').select('id, nombre').ilike('nombre', `%${n}%`).limit(6)
  const rows = (parcial as Cli[]) ?? []
  if (rows.length === 1) return { cliente: rows[0], opciones: [] }
  return { cliente: null, opciones: rows.map((r) => r.nombre) }
}

function ambiguo(nombre: string | undefined, opciones: string[]) {
  return `Hay varios clientes que coinciden con "${nombre}": ${opciones.join(', ')}. Escribí el nombre completo.`
}

function totalDe(op: Operacion) {
  return (op.items ?? []).reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)
}

// Texto de confirmación (antes de guardar). ok=false: no hay nada para confirmar.
export async function resumenOperacion(admin: Admin, op: Operacion): Promise<{ ok: boolean; texto: string }> {
  if (op.tipo === 'cliente') {
    return {
      ok: true,
      texto: `Nuevo cliente: <b>${op.cliente_nombre ?? '—'}</b>${op.telefono ? `\nTeléfono: ${op.telefono}` : ''}`,
    }
  }

  const { cliente, opciones } = await resolverCliente(admin, op.cliente_nombre)
  if (opciones.length > 1) return { ok: false, texto: ambiguo(op.cliente_nombre, opciones) }
  const nombre = cliente?.nombre ?? op.cliente_nombre ?? '—'
  const nuevo = !cliente && op.cliente_nombre ? ' (cliente nuevo)' : ''
  const fecha = formatDate(op.fecha ?? hoyAR())

  if (op.tipo === 'pedido') {
    const lineas = (op.items ?? [])
      .map((i) => {
        const c = clasificar(i.descripcion)
        return `• ${i.cantidad} × ${nombreBolsa(c.presentacion)} ${CANAL_LABEL[c.canal].toLowerCase()} a ${formatMoney(i.precio_unitario)} = ${formatMoney(i.cantidad * i.precio_unitario)}`
      })
      .join('\n')
    return {
      ok: true,
      texto: `Pedido de <b>${nombre}</b>${nuevo}\nFecha: ${fecha}\n${lineas}\n<b>Total: ${formatMoney(totalDe(op))}</b>`,
    }
  }
  if (op.tipo === 'pago') {
    return {
      ok: true,
      texto: `Pago de <b>${nombre}</b>${nuevo}\nFecha: ${fecha}\nMonto: <b>${formatMoney(op.monto ?? 0)}</b>${op.metodo ? `\nMétodo: ${op.metodo}` : ''}`,
    }
  }
  return { ok: false, texto: 'No entendí la operación.' }
}

// Ejecuta la operación ya confirmada
export async function aplicarOperacion(
  admin: Admin,
  op: Operacion,
  via: 'web' | 'telegram' = 'telegram',
): Promise<string> {
  if (op.tipo === 'cliente') {
    if (!op.cliente_nombre?.trim()) return 'Falta el nombre del cliente.'
    const { cliente: existente } = await resolverCliente(admin, op.cliente_nombre)
    if (existente?.nombre.toLowerCase() === op.cliente_nombre.trim().toLowerCase()) {
      return `El cliente <b>${existente.nombre}</b> ya existe.`
    }
    const { error } = await admin
      .from('clientes')
      .insert({ nombre: op.cliente_nombre.trim(), telefono: op.telefono ?? null })
    if (error) return `Error: ${error.message}`
    return `Cliente <b>${op.cliente_nombre.trim()}</b> creado.`
  }

  const { cliente, opciones } = await resolverCliente(admin, op.cliente_nombre)
  if (opciones.length > 1) return ambiguo(op.cliente_nombre, opciones)
  let cli = cliente

  if (!cli && op.cliente_nombre?.trim()) {
    const { data, error } = await admin
      .from('clientes')
      .insert({ nombre: op.cliente_nombre.trim() })
      .select('id, nombre')
      .single()
    if (error) return `Error creando el cliente: ${error.message}`
    cli = data as Cli
  }
  if (!cli) return 'Falta el cliente.'

  if (op.tipo === 'pedido') {
    const { error } = await admin.rpc('crear_pedido', {
      p_cliente_id: cli.id,
      p_fecha: op.fecha ?? hoyAR(),
      p_envio: null,
      p_notas: op.nota ?? null,
      p_items: (op.items ?? []).map((i) => ({
        producto_id: i.producto_id ?? null,
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
      })),
      p_created_via: via,
    })
    if (error) return `Error: ${error.message}`
    return `Pedido guardado: <b>${cli.nombre}</b>, ${formatMoney(totalDe(op))}.`
  }

  if (op.tipo === 'pago') {
    const { error } = await admin.rpc('registrar_pago', {
      p_cliente_id: cli.id,
      p_fecha: op.fecha ?? hoyAR(),
      p_monto: op.monto ?? 0,
      p_metodo: op.metodo ?? null,
      p_notas: op.nota ?? null,
      p_pedido_id: null,
      p_created_via: via,
    })
    if (error) return `Error: ${error.message}`
    return `Pago registrado: ${formatMoney(op.monto ?? 0)} de <b>${cli.nombre}</b>.`
  }

  return 'Operación no reconocida.'
}

export async function consultarMorosos(admin: Admin): Promise<string> {
  const { data } = await admin
    .from('vw_resumen_clientes')
    .select('nombre, saldo, deuda_desde')
    .gt('saldo', 0)
    .order('deuda_desde', { ascending: true, nullsFirst: false })
    .limit(20)
  const rows = (data as { nombre: string; saldo: number; deuda_desde: string | null }[]) ?? []
  if (!rows.length) return 'No hay clientes con deuda.'
  const lista = rows
    .map((r, i) => `${i + 1}. <b>${r.nombre}</b>: ${formatMoney(r.saldo)} (desde ${formatDate(r.deuda_desde)})`)
    .join('\n')
  return `<b>Deudores</b>, de la deuda más antigua a la más nueva:\n${lista}`
}

export async function consultarSaldo(admin: Admin, nombre?: string): Promise<string> {
  const { cliente: cli, opciones } = await resolverCliente(admin, nombre)
  if (opciones.length > 1) return ambiguo(nombre, opciones)
  if (!cli) return `No encontré al cliente ${nombre ?? ''}.`
  const { data } = await admin
    .from('vw_resumen_clientes')
    .select('saldo, total_pedidos, total_pagado')
    .eq('cliente_id', cli.id)
    .maybeSingle()
  const r = data as { saldo: number; total_pedidos: number; total_pagado: number } | null
  if (!r) return `${cli.nombre}: sin movimientos.`
  return `<b>${cli.nombre}</b>\nCompró: ${formatMoney(r.total_pedidos)}\nPagó: ${formatMoney(r.total_pagado)}\n<b>Saldo: ${formatMoney(r.saldo)}</b>`
}

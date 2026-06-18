'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { interpretar, type Operacion } from '@/lib/interpret'
import {
  resumenOperacion,
  aplicarOperacion,
  consultarMorosos,
  consultarSaldo,
} from '@/lib/botExec'

export type QuickResult =
  | { kind: 'confirm'; op: Operacion; resumen: string }
  | { kind: 'info'; mensaje: string }
  | { kind: 'error'; mensaje: string }

// Interpreta el texto libre y devuelve qué hacer (confirmar / responder / error).
export async function interpretarTexto(texto: string): Promise<QuickResult> {
  if (!texto.trim()) return { kind: 'error', mensaje: 'Escribí algo.' }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { kind: 'error', mensaje: 'Falta configurar ANTHROPIC_API_KEY en el servidor.' }
  }

  const admin = createAdminClient()
  const [{ data: clientes }, { data: productos }] = await Promise.all([
    admin.from('clientes').select('nombre').order('nombre'),
    admin.from('productos').select('nombre, gramaje, precio').eq('activo', true),
  ])

  let op: Operacion
  try {
    op = await interpretar(texto, {
      clientes: clientes ?? [],
      productos: productos ?? [],
      hoy: new Date().toISOString().slice(0, 10),
    })
  } catch (e) {
    return { kind: 'error', mensaje: e instanceof Error ? e.message : 'Error interpretando.' }
  }

  if (op.tipo === 'consulta_morosos') return { kind: 'info', mensaje: htmlAplano(await consultarMorosos(admin)) }
  if (op.tipo === 'consulta_saldo') return { kind: 'info', mensaje: htmlAplano(await consultarSaldo(admin, op.cliente_nombre)) }
  if (
    op.tipo === 'desconocido' ||
    (op.tipo === 'pedido' && !op.items?.length) ||
    (op.tipo === 'pago' && !op.monto) ||
    (op.tipo === 'cliente' && !op.cliente_nombre)
  ) {
    return {
      kind: 'error',
      mensaje: 'No entendí. Ej: "Agrimpay pagó 500 mil", "nuevo cliente Juan tel 1122334455", "Agrimpay 24x300".',
    }
  }

  return { kind: 'confirm', op, resumen: htmlAplano(await resumenOperacion(admin, op)) }
}

// Confirma y aplica la operación.
export async function confirmarOperacion(op: Operacion): Promise<{ mensaje: string }> {
  const admin = createAdminClient()
  const mensaje = htmlAplano(await aplicarOperacion(admin, op))
  revalidatePath('/')
  revalidatePath('/clientes')
  revalidatePath('/pedidos')
  revalidatePath('/reportes')
  return { mensaje }
}

// Los helpers de botExec devuelven HTML (para Telegram). En la web lo mostramos plano.
function htmlAplano(s: string) {
  return s.replace(/<\/?[^>]+>/g, '')
}

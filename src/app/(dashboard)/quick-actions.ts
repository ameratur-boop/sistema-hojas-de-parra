'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Operacion } from '@/lib/interpret'
import { aplicarOperacion, procesarTexto } from '@/lib/botExec'

export type QuickResult =
  | { kind: 'confirm'; op: Operacion; resumen: string }
  | { kind: 'info'; mensaje: string }
  | { kind: 'error'; mensaje: string }

export async function interpretarTexto(texto: string): Promise<QuickResult> {
  if (!texto.trim()) return { kind: 'error', mensaje: 'Escribí algo.' }
  const r = await procesarTexto(createAdminClient(), texto)
  if (r.kind === 'confirm') return { kind: 'confirm', op: r.op, resumen: htmlAplano(r.texto) }
  return { kind: r.kind, mensaje: htmlAplano(r.texto) }
}

export async function confirmarOperacion(op: Operacion): Promise<{ mensaje: string }> {
  const mensaje = htmlAplano(await aplicarOperacion(createAdminClient(), op, 'web'))
  for (const p of ['/', '/clientes', '/pedidos', '/gastos', '/analiticas']) revalidatePath(p)
  return { mensaje }
}

// Los textos de botExec vienen en HTML (para Telegram). En la web van planos.
function htmlAplano(s: string) {
  return s.replace(/<\/?[^>]+>/g, '')
}

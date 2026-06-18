import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { interpretar, type Operacion } from '@/lib/interpret'
import {
  resumenOperacion,
  aplicarOperacion,
  consultarMorosos,
  consultarSaldo,
} from '@/lib/botExec'
import {
  sendMessage,
  editMessageText,
  answerCallbackQuery,
  isAllowed,
} from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const AYUDA = `🍃 <b>Sistema Samir</b>
Escribime en lenguaje normal, por ejemplo:
• <i>"Agrimpay 24x300 y 24x100"</i> → carga un pedido
• <i>"Agrimpay pagó 500 mil"</i> → registra un pago
• <i>"quién debe"</i> → lista de morosos
• <i>"saldo de Agrimpay"</i> → cuánto debe un cliente`

export async function POST(req: NextRequest) {
  // Validación del secret del webhook
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (
    process.env.TELEGRAM_WEBHOOK_SECRET &&
    secret !== process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return new NextResponse('unauthorized', { status: 401 })
  }

  type TgUser = { id?: number }
  type TgChat = { id?: number }
  type TgUpdate = {
    message?: { chat?: TgChat; text?: string; from?: TgUser }
    callback_query?: {
      id: string
      data?: string
      from?: TgUser
      message?: { chat?: TgChat; message_id?: number }
    }
  }

  let update: TgUpdate
  try {
    update = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const admin = createAdminClient()

  // ---- Callback de botones (Confirmar / Cancelar) ----
  if (update.callback_query) {
    const cq = update.callback_query
    const chatId = cq.message?.chat?.id
    const messageId = cq.message?.message_id
    const [accion, pendingId] = String(cq.data ?? '').split(':')

    if (!isAllowed(cq.from?.id)) {
      await answerCallbackQuery(cq.id, 'No autorizado')
      return NextResponse.json({ ok: true })
    }

    const { data: pend } = await admin
      .from('telegram_pending')
      .select('payload')
      .eq('id', pendingId)
      .maybeSingle()

    await admin.from('telegram_pending').delete().eq('id', pendingId)

    if (!pend) {
      await answerCallbackQuery(cq.id, 'Expiró')
      if (chatId && messageId) await editMessageText(chatId, messageId, '⌛ Esta operación expiró.')
      return NextResponse.json({ ok: true })
    }

    if (accion === 'no') {
      await answerCallbackQuery(cq.id, 'Cancelado')
      if (chatId && messageId) await editMessageText(chatId, messageId, '❌ Cancelado.')
      return NextResponse.json({ ok: true })
    }

    const resultado = await aplicarOperacion(admin, pend.payload as Operacion)
    await answerCallbackQuery(cq.id, 'Listo')
    if (chatId && messageId) await editMessageText(chatId, messageId, resultado)
    return NextResponse.json({ ok: true })
  }

  // ---- Mensaje de texto ----
  const message = update.message
  const chatId = message?.chat?.id
  const text: string = message?.text ?? ''
  if (!chatId) return NextResponse.json({ ok: true })

  if (!isAllowed(message?.from?.id)) {
    await sendMessage(chatId, `No estás autorizado. Tu ID de Telegram es <code>${message?.from?.id}</code>.`)
    return NextResponse.json({ ok: true })
  }

  if (!text || text === '/start' || text === '/help' || text === '/ayuda') {
    await sendMessage(chatId, AYUDA)
    return NextResponse.json({ ok: true })
  }

  if (text === '/morosos') {
    await sendMessage(chatId, await consultarMorosos(admin))
    return NextResponse.json({ ok: true })
  }

  // Interpretar con Claude
  const [{ data: clientes }, { data: productos }] = await Promise.all([
    admin.from('clientes').select('nombre').order('nombre'),
    admin.from('productos').select('nombre, gramaje, precio').eq('activo', true),
  ])

  let op: Operacion
  try {
    op = await interpretar(text, {
      clientes: clientes ?? [],
      productos: productos ?? [],
      hoy: new Date().toISOString().slice(0, 10),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'desconocido'
    await sendMessage(chatId, `❌ Error interpretando: ${msg}`)
    return NextResponse.json({ ok: true })
  }

  if (op.tipo === 'consulta_morosos') {
    await sendMessage(chatId, await consultarMorosos(admin))
    return NextResponse.json({ ok: true })
  }
  if (op.tipo === 'consulta_saldo') {
    await sendMessage(chatId, await consultarSaldo(admin, op.cliente_nombre))
    return NextResponse.json({ ok: true })
  }
  if (op.tipo === 'desconocido' || (op.tipo === 'pedido' && !op.items?.length) || (op.tipo === 'pago' && !op.monto)) {
    await sendMessage(chatId, `No te entendí 🤔\n\n${AYUDA}`)
    return NextResponse.json({ ok: true })
  }

  // Guardar pendiente y pedir confirmación
  const { data: pend } = await admin
    .from('telegram_pending')
    .insert({ chat_id: chatId, payload: op })
    .select('id')
    .single()

  const resumen = await resumenOperacion(admin, op)
  await sendMessage(chatId, resumen, [
    [
      { text: '✅ Confirmar', callback_data: `ok:${pend!.id}` },
      { text: '❌ Cancelar', callback_data: `no:${pend!.id}` },
    ],
  ])
  return NextResponse.json({ ok: true })
}

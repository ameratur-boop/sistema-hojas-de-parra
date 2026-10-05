import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Operacion } from '@/lib/interpret'
import { aplicarOperacion, consultarMorosos, NO_ENTENDI, procesarTexto } from '@/lib/botExec'
import {
  sendMessage,
  editMessageText,
  answerCallbackQuery,
  isAllowed,
} from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const AYUDA = `<b>Baladi</b>
Escribime en lenguaje normal, por ejemplo:
• <i>"Sukaria 24x300 y 12x100"</i>: carga un pedido por mayor
• <i>"Sukaria 5x300 por menor"</i>: carga un pedido por menor
• <i>"Sukaria pagó 500 mil"</i>: registra un pago
• <i>"quién debe"</i>: lista de deudores
• <i>"saldo de Sukaria"</i>: cuánto debe un cliente`

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
      if (chatId && messageId) await editMessageText(chatId, messageId, 'Esta operación expiró.')
      return NextResponse.json({ ok: true })
    }

    if (accion === 'no') {
      await answerCallbackQuery(cq.id, 'Cancelado')
      if (chatId && messageId) await editMessageText(chatId, messageId, 'Cancelado.')
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

  const r = await procesarTexto(admin, text)
  if (r.kind !== 'confirm') {
    await sendMessage(chatId, r.texto === NO_ENTENDI ? `No te entendí.\n\n${AYUDA}` : r.texto)
    return NextResponse.json({ ok: true })
  }

  // Guardar pendiente y pedir confirmación
  const { data: pend, error } = await admin
    .from('telegram_pending')
    .insert({ chat_id: chatId, payload: r.op })
    .select('id')
    .single()
  if (error || !pend) {
    await sendMessage(chatId, `No pude preparar la operación: ${error?.message ?? 'sin respuesta de la base'}`)
    return NextResponse.json({ ok: true })
  }

  await sendMessage(chatId, `${r.texto}\n\n¿Confirmar?`, [
    [
      { text: 'Confirmar', callback_data: `ok:${pend.id}` },
      { text: 'Cancelar', callback_data: `no:${pend.id}` },
    ],
  ])
  return NextResponse.json({ ok: true })
}

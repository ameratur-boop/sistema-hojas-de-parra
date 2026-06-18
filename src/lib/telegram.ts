// Wrappers mínimos de la Telegram Bot API (vía fetch).

const API = (method: string) =>
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`

type InlineButton = { text: string; callback_data: string }

export async function sendMessage(
  chatId: number,
  text: string,
  buttons?: InlineButton[][],
) {
  await fetch(API('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
    }),
  })
}

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
) {
  await fetch(API('editMessageText'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    }),
  })
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(API('answerCallbackQuery'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  })
}

// ¿El usuario está autorizado a usar el bot?
export function isAllowed(userId: number | undefined): boolean {
  if (!userId) return false
  const allow = (process.env.TELEGRAM_ALLOWED_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  // Si no se configuró ninguna lista, permitir (útil para pruebas).
  if (allow.length === 0) return true
  return allow.includes(String(userId))
}

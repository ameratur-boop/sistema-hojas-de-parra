import Anthropic from '@anthropic-ai/sdk'

export type ItemOp = { descripcion: string; cantidad: number; precio_unitario: number }

export type Operacion = {
  tipo: 'pedido' | 'pago' | 'consulta_morosos' | 'consulta_saldo' | 'desconocido'
  cliente_nombre?: string
  fecha?: string
  items?: ItemOp[]
  monto?: number
  metodo?: string
  nota?: string
}

type Contexto = {
  clientes: { nombre: string }[]
  productos: { nombre: string; gramaje: number | null; precio: number }[]
  hoy: string
}

const tool: Anthropic.Tool = {
  name: 'registrar_operacion',
  description: 'Registra la operación que el vendedor está dictando por mensaje.',
  input_schema: {
    type: 'object',
    properties: {
      tipo: {
        type: 'string',
        enum: ['pedido', 'pago', 'consulta_morosos', 'consulta_saldo', 'desconocido'],
        description:
          'pedido = carga una venta; pago = registra una cobranza; consulta_morosos = quién debe; consulta_saldo = saldo de un cliente; desconocido = no se entiende.',
      },
      cliente_nombre: { type: 'string', description: 'Nombre del cliente mencionado.' },
      fecha: { type: 'string', description: 'Fecha YYYY-MM-DD. Si no se menciona, usar hoy.' },
      items: {
        type: 'array',
        description: 'Líneas del pedido.',
        items: {
          type: 'object',
          properties: {
            descripcion: { type: 'string', description: 'Ej: "300g" o "100g".' },
            cantidad: { type: 'number' },
            precio_unitario: { type: 'number', description: 'Precio por unidad según el catálogo.' },
          },
          required: ['descripcion', 'cantidad', 'precio_unitario'],
        },
      },
      monto: { type: 'number', description: 'Monto del pago.' },
      metodo: { type: 'string', description: 'efectivo / transferencia / otro.' },
      nota: { type: 'string' },
    },
    required: ['tipo'],
  },
}

export async function interpretar(texto: string, ctx: Contexto): Promise<Operacion> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const catalogo = ctx.productos
    .map((p) => `- ${p.nombre} (${p.gramaje ?? '?'}g) = $${p.precio}`)
    .join('\n')
  const listaClientes = ctx.clientes.map((c) => `- ${c.nombre}`).join('\n')

  const system = `Sos el asistente de un sistema de ventas de hojas de parra. El vendedor te dicta pedidos y pagos en lenguaje informal argentino. Tu trabajo es convertir el mensaje en una operación estructurada llamando a la herramienta registrar_operacion.

Reglas:
- Notación de pedidos: "24x300" o "24 x 300" significa cantidad=24 de la presentación de 300g. "48 x 100 x 10000" = 48 unidades de 100g a $10000.
- Mapeá cada presentación (gramaje) al precio del catálogo. Si el mensaje no aclara precio, usá el del catálogo.
- Montos: "500 mil" = 500000, "1.680.000" = 1680000 (el punto separa miles).
- Si no se menciona fecha, usá hoy (${ctx.hoy}).
- "quién debe", "morosos", "deudores" => consulta_morosos.
- "cuánto debe X", "saldo de X" => consulta_saldo.
- Si no entendés, tipo=desconocido.

Catálogo de productos:
${catalogo || '(sin productos)'}

Clientes existentes:
${listaClientes || '(sin clientes)'}`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system,
    tools: [tool],
    tool_choice: { type: 'tool', name: 'registrar_operacion' },
    messages: [{ role: 'user', content: texto }],
  })

  const toolUse = msg.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') return { tipo: 'desconocido' }
  return toolUse.input as Operacion
}

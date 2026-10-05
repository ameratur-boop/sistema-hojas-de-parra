import Anthropic from '@anthropic-ai/sdk'
import { CANAL_LABEL, clasificar } from './productos'

export type ItemOp = {
  descripcion: string
  cantidad: number
  precio_unitario: number
  producto_id?: string | null
}

export type Operacion = {
  tipo: 'pedido' | 'pago' | 'cliente' | 'consulta_morosos' | 'consulta_saldo' | 'desconocido'
  cliente_nombre?: string
  telefono?: string
  fecha?: string
  items?: ItemOp[]
  monto?: number
  metodo?: string
  nota?: string
}

export type ProductoCtx = { id: string; nombre: string; precio: number }

type Contexto = {
  clientes: { nombre: string }[]
  productos: ProductoCtx[]
  hoy: string
}

type ItemModelo = { producto: string; cantidad: number; precio_unitario: number }

function herramienta(productos: ProductoCtx[]): Anthropic.Tool {
  const nombres = productos.map((p) => p.nombre)
  return {
    name: 'registrar_operacion',
    description: 'Registra la operación que el vendedor está dictando por mensaje.',
    input_schema: {
      type: 'object',
      properties: {
        tipo: {
          type: 'string',
          enum: ['pedido', 'pago', 'cliente', 'consulta_morosos', 'consulta_saldo', 'desconocido'],
          description:
            'pedido = carga una venta; pago = registra una cobranza; cliente = alta de un cliente nuevo; consulta_morosos = quién debe; consulta_saldo = saldo de un cliente; desconocido = no se entiende.',
        },
        cliente_nombre: {
          type: 'string',
          description: 'Nombre del cliente. Si es un cliente existente, el nombre EXACTO como figura en la lista.',
        },
        telefono: { type: 'string', description: 'Teléfono del cliente (para alta de cliente).' },
        fecha: { type: 'string', description: 'Fecha YYYY-MM-DD. Si no se menciona, usar hoy.' },
        items: {
          type: 'array',
          description: 'Líneas del pedido.',
          items: {
            type: 'object',
            properties: {
              producto: {
                type: 'string',
                description: 'Nombre EXACTO del producto del catálogo.',
                ...(nombres.length ? { enum: nombres } : {}),
              },
              cantidad: { type: 'number', description: 'Cantidad de bolsas.' },
              precio_unitario: { type: 'number', description: 'Precio por bolsa.' },
            },
            required: ['producto', 'cantidad', 'precio_unitario'],
          },
        },
        monto: { type: 'number', description: 'Monto del pago.' },
        metodo: { type: 'string', enum: ['transferencia', 'efectivo', 'otro'] },
        nota: { type: 'string' },
      },
      required: ['tipo'],
    },
  }
}

export async function interpretar(texto: string, ctx: Contexto): Promise<Operacion> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const catalogo = ctx.productos
    .map((p) => {
      const c = clasificar(p.nombre)
      return `- "${p.nombre}": bolsa de ${c.presentacion ?? '?'} hojas, ${CANAL_LABEL[c.canal].toLowerCase()}, $${p.precio}`
    })
    .join('\n')
  const listaClientes = ctx.clientes.map((c) => `- ${c.nombre}`).join('\n')

  const system = `Sos el asistente de un sistema de ventas de hojas de parra. El vendedor te dicta pedidos y pagos en lenguaje informal argentino. Convertí el mensaje en una operación estructurada llamando a la herramienta registrar_operacion.

Reglas:
- Las bolsas se identifican por cantidad de hojas: 300, 250, 100 o 50. "24x300" o "24 x 300" = 24 bolsas de 300. "48 x 100 x 10000" = 48 bolsas de 100 a $10000 cada una.
- Elegí siempre un producto del catálogo según la bolsa. La venta es por mayor salvo que el mensaje diga "por menor", "minorista" o "al público"; en ese caso usá el producto por menor de esa bolsa si existe.
- Precio: el del catálogo, salvo que el mensaje indique otro.
- Montos: "500 mil" = 500000, "1.680.000" = 1680000 (el punto separa miles).
- Si no se menciona fecha, usá hoy (${ctx.hoy}).
- "nuevo cliente X", "agregar cliente X", "dar de alta a X tel 11..." => tipo=cliente (extraé nombre y, si está, teléfono).
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
    tools: [herramienta(ctx.productos)],
    tool_choice: { type: 'tool', name: 'registrar_operacion' },
    messages: [{ role: 'user', content: texto }],
  })

  const toolUse = msg.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') return { tipo: 'desconocido' }

  const { items, ...resto } = toolUse.input as Omit<Operacion, 'items'> & { items?: ItemModelo[] }
  return {
    ...resto,
    items: items?.map((i) => {
      const p = ctx.productos.find((x) => x.nombre === i.producto)
      return {
        descripcion: p?.nombre ?? i.producto,
        producto_id: p?.id ?? null,
        cantidad: Number(i.cantidad),
        precio_unitario: Number(i.precio_unitario),
      }
    }),
  }
}

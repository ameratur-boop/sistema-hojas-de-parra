import type { Canal } from './productos'

export type Granularidad = 'dia' | 'semana' | 'mes'

export type Linea = {
  fecha: string
  pedidoId: string
  presentacion: number | null
  canal: Canal
  cantidad: number
  monto: number
}

export type Cobro = { fecha: string; monto: number }

export type PorCanal = Record<Canal, number>

export type Periodo = {
  clave: string
  monto: PorCanal
  bolsas: PorCanal
  pedidos: PorCanal & { todos: number }
  cobrado: number
  gastado: number
}

export type FilaProducto = { presentacion: number | null; monto: PorCanal; bolsas: PorCanal }

export const VENTANA: Record<Granularidad, number> = { dia: 30, semana: 12, mes: 12 }

const DIA_MS = 86_400_000
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

// Fechas como 'YYYY-MM-DD' en UTC puro: sin corrimientos por zona horaria.
const ms = (f: string) => Date.UTC(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10))
const iso = (t: number) => new Date(t).toISOString().slice(0, 10)

export function inicioPeriodo(fecha: string, g: Granularidad): string {
  if (g === 'dia') return fecha.slice(0, 10)
  if (g === 'mes') return `${fecha.slice(0, 7)}-01`
  const t = ms(fecha)
  const desdeLunes = (new Date(t).getUTCDay() + 6) % 7
  return iso(t - desdeLunes * DIA_MS)
}

function anterior(clave: string, g: Granularidad): string {
  if (g === 'dia') return iso(ms(clave) - DIA_MS)
  if (g === 'semana') return iso(ms(clave) - 7 * DIA_MS)
  return iso(Date.UTC(+clave.slice(0, 4), +clave.slice(5, 7) - 2, 1))
}

// Las últimas `n` claves de período, en orden cronológico, terminando en la que contiene `hoy`.
export function periodos(hoy: string, g: Granularidad, n = VENTANA[g]): string[] {
  const out: string[] = []
  let k = inicioPeriodo(hoy, g)
  for (let i = 0; i < n; i++) {
    out.unshift(k)
    k = anterior(k, g)
  }
  return out
}

const MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export function etiqueta(clave: string, g: Granularidad, larga = false): string {
  const [y, m, d] = clave.split('-').map(Number)
  if (g === 'mes') return larga ? `${MESES_LARGOS[m - 1]} ${y}` : `${MESES[m - 1]} ${String(y).slice(2)}`
  const base = `${d} ${MESES[m - 1]}`
  if (!larga) return base
  if (g === 'semana') return `Semana del ${base}`
  return `${DIAS[new Date(ms(clave)).getUTCDay()]} ${base}`
}

const cero = (): PorCanal => ({ mayor: 0, menor: 0 })

export function resumirPorPeriodo(
  lineas: Linea[],
  cobros: Cobro[],
  claves: string[],
  g: Granularidad,
  gastos: Cobro[] = [],
): Periodo[] {
  const idx = new Map(claves.map((c, i) => [c, i]))
  const acc = claves.map((clave) => ({
    clave,
    monto: cero(),
    bolsas: cero(),
    ids: { mayor: new Set<string>(), menor: new Set<string>(), todos: new Set<string>() },
    cobrado: 0,
    gastado: 0,
  }))
  for (const l of lineas) {
    const a = acc[idx.get(inicioPeriodo(l.fecha, g)) ?? -1]
    if (!a) continue
    a.monto[l.canal] += l.monto
    a.bolsas[l.canal] += l.cantidad
    a.ids[l.canal].add(l.pedidoId)
    a.ids.todos.add(l.pedidoId)
  }
  for (const c of cobros) {
    const a = acc[idx.get(inicioPeriodo(c.fecha, g)) ?? -1]
    if (a) a.cobrado += c.monto
  }
  for (const c of gastos) {
    const a = acc[idx.get(inicioPeriodo(c.fecha, g)) ?? -1]
    if (a) a.gastado += c.monto
  }
  return acc.map(({ ids, ...a }) => ({
    ...a,
    pedidos: { mayor: ids.mayor.size, menor: ids.menor.size, todos: ids.todos.size },
  }))
}

export function resumirPorProducto(lineas: Linea[], claves: string[], g: Granularidad): FilaProducto[] {
  const enRango = new Set(claves)
  const filas = new Map<number | null, FilaProducto>()
  for (const l of lineas) {
    if (!enRango.has(inicioPeriodo(l.fecha, g))) continue
    const f = filas.get(l.presentacion) ?? { presentacion: l.presentacion, monto: cero(), bolsas: cero() }
    f.monto[l.canal] += l.monto
    f.bolsas[l.canal] += l.cantidad
    filas.set(l.presentacion, f)
  }
  return Array.from(filas.values()).sort(
    (a, b) => b.bolsas.mayor + b.bolsas.menor - (a.bolsas.mayor + a.bolsas.menor),
  )
}

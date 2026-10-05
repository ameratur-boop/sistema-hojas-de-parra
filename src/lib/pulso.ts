import type { SupabaseClient } from '@supabase/supabase-js'
import { traerTodo } from './supabase/paginar'
import { hoyAR } from './format'
import { inicioPeriodo } from './analytics'

export type PagoReciente = {
  id: string
  fecha: string
  monto: number
  metodo: string | null
  created_at: string
  cliente_id: string
  cliente: string
}

export type Pulso = {
  hoy: string
  cobradoHoy: number
  pagosHoy: number
  cobradoSemana: number
  cobradoMes: number
  mesAnteriorMismoDia: number
  dias: { fecha: string; monto: number }[]
  ultimos: PagoReciente[]
}

const DIA_MS = 86_400_000
const iso = (t: number) => new Date(t).toISOString().slice(0, 10)

export async function obtenerPulso(supabase: SupabaseClient): Promise<Pulso> {
  const hoy = hoyAR()
  const tHoy = Date.parse(hoy)
  const [y, m, d] = hoy.split('-').map(Number)
  const inicioMes = `${hoy.slice(0, 7)}-01`
  const inicioMesAnt = iso(Date.UTC(y, m - 2, 1))
  const finMesAnt = iso(Math.min(Date.UTC(y, m - 2, d), Date.UTC(y, m - 1, 0)))
  const desde14 = iso(tHoy - 13 * DIA_MS)
  const desde = inicioMesAnt < desde14 ? inicioMesAnt : desde14

  const [pagos, { data: ultimos }] = await Promise.all([
    traerTodo<{ fecha: string; monto: number }>((a, b) =>
      supabase.from('pagos').select('fecha, monto').gte('fecha', desde).lte('fecha', hoy).order('id').range(a, b),
    ),
    supabase
      .from('pagos')
      .select('id, fecha, monto, metodo, created_at, cliente_id, clientes(nombre)')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const semana = inicioPeriodo(hoy, 'semana')
  const suma = (f: (fecha: string) => boolean) =>
    pagos.reduce((s, p) => (f(p.fecha) ? s + Number(p.monto) : s), 0)

  const porDia = new Map<string, number>()
  for (const p of pagos) porDia.set(p.fecha, (porDia.get(p.fecha) ?? 0) + Number(p.monto))

  return {
    hoy,
    cobradoHoy: suma((f) => f === hoy),
    pagosHoy: pagos.filter((p) => p.fecha === hoy).length,
    cobradoSemana: suma((f) => f >= semana),
    cobradoMes: suma((f) => f >= inicioMes),
    mesAnteriorMismoDia: suma((f) => f >= inicioMesAnt && f <= finMesAnt),
    dias: Array.from({ length: 14 }, (_, i) => {
      const fecha = iso(tHoy - (13 - i) * DIA_MS)
      return { fecha, monto: porDia.get(fecha) ?? 0 }
    }),
    ultimos: ((ultimos as unknown as (Omit<PagoReciente, 'cliente'> & { clientes: { nombre: string } | null })[]) ?? []).map(
      ({ clientes, ...p }) => ({ ...p, monto: Number(p.monto), cliente: clientes?.nombre ?? '—' }),
    ),
  }
}

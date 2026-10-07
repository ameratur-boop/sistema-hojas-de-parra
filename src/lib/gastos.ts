import type { SupabaseClient } from '@supabase/supabase-js'
import type { Gasto } from './types'
import { traerTodo } from './supabase/paginar'

// Lista fija: así no aparecen "flete", "Fletes" y "envio" como categorías distintas.
export const CATEGORIAS = [
  { clave: 'mercaderia', label: 'Mercadería (hojas)' },
  { clave: 'envases', label: 'Bolsas y envases' },
  { clave: 'envios', label: 'Envíos y fletes' },
  { clave: 'sueldos', label: 'Sueldos' },
  { clave: 'alquiler', label: 'Alquiler' },
  { clave: 'servicios', label: 'Servicios' },
  { clave: 'impuestos', label: 'Impuestos y comisiones' },
  { clave: 'otros', label: 'Otros' },
] as const

export type CategoriaGasto = (typeof CATEGORIAS)[number]['clave']

export const CLAVES_CATEGORIA = CATEGORIAS.map((c) => c.clave) as CategoriaGasto[]

export function labelCategoria(clave: string): string {
  return CATEGORIAS.find((c) => c.clave === clave)?.label ?? clave
}

// La tabla se crea con supabase/migrations/0002_gastos.sql. Hasta que se corra,
// las pantallas avisan en vez de romperse.
export function esTablaFaltante(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === 'PGRST205' || error.code === '42P01')
}

export async function traerGastos(
  supabase: SupabaseClient,
): Promise<{ gastos: Gasto[]; faltaTabla: boolean }> {
  try {
    const gastos = await traerTodo<Gasto>((desde, hasta) =>
      supabase.from('gastos').select('*').order('fecha', { ascending: false }).order('created_at', { ascending: false }).range(desde, hasta),
    )
    return { gastos: gastos.map((g) => ({ ...g, monto: Number(g.monto) })), faltaTabla: false }
  } catch (e) {
    if (esTablaFaltante(e as { code?: string })) return { gastos: [], faltaTabla: true }
    throw e
  }
}

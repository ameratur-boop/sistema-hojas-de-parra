'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { CLAVES_CATEGORIA, esTablaFaltante, type CategoriaGasto } from '@/lib/gastos'

export type GastoInput = {
  fecha: string
  categoria: CategoriaGasto
  descripcion?: string
  monto: number
  metodo?: string
}

const METODOS = ['transferencia', 'efectivo', 'otro']

function validar(data: GastoInput): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.fecha) || Number.isNaN(Date.parse(data.fecha))) return 'La fecha no es válida.'
  if (!CLAVES_CATEGORIA.includes(data.categoria)) return 'Elegí una categoría.'
  if (!(data.monto > 0)) return 'El monto tiene que ser mayor a cero.'
  if (data.metodo && !METODOS.includes(data.metodo)) return 'Método de pago no válido.'
  return null
}

function fila(data: GastoInput) {
  return {
    fecha: data.fecha,
    categoria: data.categoria,
    descripcion: data.descripcion?.trim() || null,
    monto: data.monto,
    metodo: data.metodo || null,
  }
}

function resultado(error: { message: string; code?: string } | null) {
  if (!error) {
    revalidatePath('/gastos')
    revalidatePath('/analiticas')
    return { error: null }
  }
  if (esTablaFaltante(error)) return { error: 'La sección de gastos todavía no está activada en la base de datos.' }
  return { error: error.message }
}

export async function crearGasto(data: GastoInput) {
  const invalido = validar(data)
  if (invalido) return { error: invalido }
  const { error } = await createClient().from('gastos').insert(fila(data))
  return resultado(error)
}

export async function editarGasto(id: string, data: GastoInput) {
  const invalido = validar(data)
  if (invalido) return { error: invalido }
  const { error } = await createClient().from('gastos').update(fila(data)).eq('id', id)
  return resultado(error)
}

export async function eliminarGasto(id: string) {
  const { error } = await createClient().from('gastos').delete().eq('id', id)
  return resultado(error)
}

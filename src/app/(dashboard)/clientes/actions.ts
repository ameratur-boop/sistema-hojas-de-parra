'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ClienteInput = {
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
  notas?: string
}

const escaparLike = (s: string) => s.replace(/[\\%_]/g, '\\$&')

function limpiar(data: ClienteInput) {
  return {
    nombre: data.nombre.trim().replace(/\s+/g, ' '),
    telefono: data.telefono?.trim() || null,
    email: data.email?.trim() || null,
    direccion: data.direccion?.trim() || null,
    notas: data.notas?.trim() || null,
  }
}

async function nombreRepetido(nombre: string, excepto?: string) {
  const supabase = createClient()
  let q = supabase.from('clientes').select('id, nombre').ilike('nombre', escaparLike(nombre)).limit(1)
  if (excepto) q = q.neq('id', excepto)
  const { data } = await q
  return data?.[0]?.nombre as string | undefined
}

export async function crearCliente(data: ClienteInput) {
  const fila = limpiar(data)
  if (!fila.nombre) return { error: 'El nombre es obligatorio.' }
  const repetido = await nombreRepetido(fila.nombre)
  if (repetido) return { error: `Ya existe un cliente llamado “${repetido}”.` }

  const { error } = await createClient().from('clientes').insert(fila)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  revalidatePath('/')
  return { error: null }
}

export async function editarCliente(id: string, data: ClienteInput) {
  const fila = limpiar(data)
  if (!fila.nombre) return { error: 'El nombre es obligatorio.' }
  const repetido = await nombreRepetido(fila.nombre, id)
  if (repetido) return { error: `Ya existe otro cliente llamado “${repetido}”.` }

  const { error } = await createClient().from('clientes').update(fila).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  revalidatePath('/')
  return { error: null }
}

// Borrar un cliente borra en cascada sus pedidos y pagos: solo se permite si no tiene movimientos.
export async function eliminarCliente(id: string) {
  const supabase = createClient()
  const [{ count: pedidos }, { count: pagos }] = await Promise.all([
    supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('cliente_id', id),
    supabase.from('pagos').select('id', { count: 'exact', head: true }).eq('cliente_id', id),
  ])
  if ((pedidos ?? 0) + (pagos ?? 0) > 0) {
    return { error: `No se puede eliminar: tiene ${pedidos ?? 0} pedidos y ${pagos ?? 0} pagos registrados.` }
  }
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  revalidatePath('/')
  return { error: null }
}

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

export async function crearCliente(data: ClienteInput) {
  const supabase = createClient()
  const { error } = await supabase.from('clientes').insert({
    nombre: data.nombre.trim(),
    telefono: data.telefono || null,
    email: data.email || null,
    direccion: data.direccion || null,
    notas: data.notas || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  revalidatePath('/')
  return { error: null }
}

export async function editarCliente(id: string, data: ClienteInput) {
  const supabase = createClient()
  const { error } = await supabase
    .from('clientes')
    .update({
      nombre: data.nombre.trim(),
      telefono: data.telefono || null,
      email: data.email || null,
      direccion: data.direccion || null,
      notas: data.notas || null,
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return { error: null }
}

export async function eliminarCliente(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  revalidatePath('/')
  return { error: null }
}

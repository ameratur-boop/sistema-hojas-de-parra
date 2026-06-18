'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ProductoInput = {
  nombre: string
  gramaje?: number | null
  precio: number
  activo?: boolean
}

export async function crearProducto(data: ProductoInput) {
  const supabase = createClient()
  const { error } = await supabase.from('productos').insert({
    nombre: data.nombre.trim(),
    gramaje: data.gramaje || null,
    precio: data.precio || 0,
    activo: data.activo ?? true,
  })
  if (error) return { error: error.message }
  revalidatePath('/productos')
  return { error: null }
}

export async function editarProducto(id: string, data: ProductoInput) {
  const supabase = createClient()
  const { error } = await supabase
    .from('productos')
    .update({
      nombre: data.nombre.trim(),
      gramaje: data.gramaje || null,
      precio: data.precio || 0,
      activo: data.activo ?? true,
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/productos')
  return { error: null }
}

export async function eliminarProducto(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('productos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/productos')
  return { error: null }
}

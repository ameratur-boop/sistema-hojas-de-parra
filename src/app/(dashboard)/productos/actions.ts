'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { clasificar, nombreProducto, type Canal } from '@/lib/productos'

export type ProductoInput = {
  presentacion: number
  canal: Canal
  gramaje?: number | null
  precio: number
  activo: boolean
}

function revalidar() {
  for (const p of ['/productos', '/pedidos', '/analiticas']) revalidatePath(p)
}

// El nombre se arma solo ("Bolsa 300 x mayor") para que no aparezcan variantes del mismo producto.
async function validar(data: ProductoInput, excepto?: string): Promise<string | null> {
  if (!Number.isInteger(data.presentacion) || data.presentacion <= 0) return 'Indicá la cantidad de hojas de la bolsa.'
  if (data.canal !== 'mayor' && data.canal !== 'menor') return 'Elegí si es por mayor o por menor.'
  if (!(data.precio >= 0)) return 'El precio no puede ser negativo.'
  if (!data.activo) return null

  const { data: activos } = await createClient().from('productos').select('id, nombre').eq('activo', true)
  const choca = (activos ?? []).find((p) => {
    const c = clasificar(p.nombre)
    return p.id !== excepto && c.presentacion === data.presentacion && c.canal === data.canal
  })
  return choca ? `Ya hay un producto activo para esa bolsa y canal: “${choca.nombre}”. Editá ese.` : null
}

function fila(data: ProductoInput) {
  return {
    nombre: nombreProducto(data.presentacion, data.canal),
    gramaje: data.gramaje || null,
    precio: data.precio,
    activo: data.activo,
  }
}

export async function crearProducto(data: ProductoInput) {
  const error = await validar(data)
  if (error) return { error }
  const res = await createClient().from('productos').insert(fila(data))
  if (res.error) return { error: res.error.message }
  revalidar()
  return { error: null }
}

export async function editarProducto(id: string, data: ProductoInput) {
  const error = await validar(data, id)
  if (error) return { error }
  const res = await createClient().from('productos').update(fila(data)).eq('id', id)
  if (res.error) return { error: res.error.message }
  revalidar()
  return { error: null }
}

// Un producto con ventas no se borra (perdería el vínculo con el historial): se desactiva.
export async function eliminarProducto(id: string) {
  const supabase = createClient()
  const { count } = await supabase.from('pedido_items').select('id', { count: 'exact', head: true }).eq('producto_id', id)
  if (count) return { error: `Este producto tiene ${count} ventas registradas. Desactivalo en lugar de eliminarlo.` }
  const res = await supabase.from('productos').delete().eq('id', id)
  if (res.error) return { error: res.error.message }
  revalidar()
  return { error: null }
}

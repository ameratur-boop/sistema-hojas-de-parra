export type Canal = 'mayor' | 'menor'

export const CANALES: Canal[] = ['mayor', 'menor']

export const CANAL_LABEL: Record<Canal, string> = {
  mayor: 'Por mayor',
  menor: 'Por menor',
}

// Validados con dataviz/validate_palette.js contra la superficie oscura (#161b18)
export const CANAL_COLOR: Record<Canal, string> = {
  mayor: '#3987e5',
  menor: '#d95926',
}

export type Clase = { presentacion: number | null; canal: Canal }

// "300g", "bolsa 300 hojas", "BOLSAS DE 300" y "bolsa 300 X MAYOR" son la misma bolsa:
// la identidad es la cantidad de hojas + el canal. Sin "menor" explícito, es venta por mayor.
export function clasificar(texto: string): Clase {
  const n = texto.match(/\d+/)
  return {
    presentacion: n ? Number(n[0]) : null,
    canal: /menor|minorista/i.test(texto) ? 'menor' : 'mayor',
  }
}

// El producto vinculado manda; si la línea no tiene producto, se usa la descripción cargada.
export function clasificarItem(it: { descripcion: string; producto?: string | null }): Clase {
  return clasificar(it.producto || it.descripcion)
}

export function nombreBolsa(presentacion: number | null): string {
  return presentacion ? `Bolsa ${presentacion}` : 'Otro'
}

export function nombreProducto(presentacion: number, canal: Canal): string {
  return `Bolsa ${presentacion} x ${canal}`
}

export function ordenarClases<T extends Clase>(a: T, b: T): number {
  return (b.presentacion ?? -1) - (a.presentacion ?? -1) || CANALES.indexOf(a.canal) - CANALES.indexOf(b.canal)
}

export type ItemConProducto = {
  descripcion: string
  cantidad: number
  subtotal?: number
  productos?: { nombre: string } | null
}

// Junta las líneas de un pedido por bolsa + canal: "24 × Bolsa 300" aunque se hayan cargado en dos renglones.
export function agruparItems(items: ItemConProducto[]): (Clase & { cantidad: number; subtotal: number })[] {
  const out = new Map<string, Clase & { cantidad: number; subtotal: number }>()
  for (const it of items) {
    const c = clasificarItem({ descripcion: it.descripcion, producto: it.productos?.nombre })
    const k = `${c.presentacion}-${c.canal}`
    const g = out.get(k) ?? { ...c, cantidad: 0, subtotal: 0 }
    g.cantidad += Number(it.cantidad)
    g.subtotal += Number(it.subtotal ?? 0)
    out.set(k, g)
  }
  return Array.from(out.values()).sort(ordenarClases)
}

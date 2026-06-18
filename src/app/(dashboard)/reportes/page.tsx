import { createClient } from '@/lib/supabase/server'
import { ReportesView, type PuntoMes, type TopProducto } from './ReportesView'

export const dynamic = 'force-dynamic'

function mesKey(fecha: string) {
  return fecha.slice(0, 7) // YYYY-MM
}

function mesLabel(key: string) {
  const [y, m] = key.split('-')
  return `${m}/${y.slice(2)}`
}

export default async function ReportesPage() {
  const supabase = createClient()

  const [{ data: pedidos }, { data: pagos }, { data: items }] = await Promise.all([
    supabase.from('pedidos').select('fecha, total'),
    supabase.from('pagos').select('fecha, monto'),
    supabase.from('pedido_items').select('descripcion, cantidad, subtotal'),
  ])

  const facturado = (pedidos ?? []).reduce((s, p) => s + Number(p.total), 0)
  const cobrado = (pagos ?? []).reduce((s, p) => s + Number(p.monto), 0)
  const adeudado = facturado - cobrado

  // Agregación por mes (ventas + cobranzas)
  const mapMes = new Map<string, { ventas: number; cobranzas: number }>()
  for (const p of pedidos ?? []) {
    const k = mesKey(p.fecha)
    const cur = mapMes.get(k) ?? { ventas: 0, cobranzas: 0 }
    cur.ventas += Number(p.total)
    mapMes.set(k, cur)
  }
  for (const p of pagos ?? []) {
    const k = mesKey(p.fecha)
    const cur = mapMes.get(k) ?? { ventas: 0, cobranzas: 0 }
    cur.cobranzas += Number(p.monto)
    mapMes.set(k, cur)
  }
  const porMes: PuntoMes[] = Array.from(mapMes.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([k, v]) => ({ label: mesLabel(k), ventas: v.ventas, cobranzas: v.cobranzas }))

  // Top productos por descripción
  const mapProd = new Map<string, { cantidad: number; monto: number }>()
  for (const it of items ?? []) {
    const cur = mapProd.get(it.descripcion) ?? { cantidad: 0, monto: 0 }
    cur.cantidad += Number(it.cantidad)
    cur.monto += Number(it.subtotal)
    mapProd.set(it.descripcion, cur)
  }
  const topProductos: TopProducto[] = Array.from(mapProd.entries())
    .map(([descripcion, v]) => ({ descripcion, ...v }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 10)

  return (
    <ReportesView
      facturado={facturado}
      cobrado={cobrado}
      adeudado={adeudado}
      porMes={porMes}
      topProductos={topProductos}
    />
  )
}

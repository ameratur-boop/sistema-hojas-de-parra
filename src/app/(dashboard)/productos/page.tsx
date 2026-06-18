import { createClient } from '@/lib/supabase/server'
import type { Producto } from '@/lib/types'
import { ProductosManager } from './ProductosManager'

export const dynamic = 'force-dynamic'

export default async function ProductosPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('productos')
    .select('*')
    .order('activo', { ascending: false })
    .order('precio', { ascending: false })
  return <ProductosManager productos={(data as Producto[]) ?? []} />
}

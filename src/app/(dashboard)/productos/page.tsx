import { createClient } from '@/lib/supabase/server'
import type { Producto } from '@/lib/types'
import { ProductosManager } from './ProductosManager'

export const dynamic = 'force-dynamic'

export default async function ProductosPage() {
  const { data } = await createClient().from('productos').select('*')
  return <ProductosManager productos={(data as Producto[]) ?? []} />
}

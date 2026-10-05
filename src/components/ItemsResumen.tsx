import { agruparItems, nombreBolsa, type ItemConProducto } from '@/lib/productos'
import { formatNumber } from '@/lib/format'
import { CanalTag } from '@/components/ui'

export function ItemsResumen({ items }: { items: ItemConProducto[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1">
      {agruparItems(items).map((g) => (
        <li key={`${g.presentacion}-${g.canal}`} className="inline-flex items-center gap-2 whitespace-nowrap">
          <span className="text-ink">
            <span className="font-medium">{formatNumber(g.cantidad)}</span>
            <span className="text-ink-3"> × </span>
            {nombreBolsa(g.presentacion)}
          </span>
          {g.canal === 'menor' && <CanalTag canal="menor" />}
        </li>
      ))}
    </ul>
  )
}

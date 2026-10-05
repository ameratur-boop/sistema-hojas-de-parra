'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Cliente, Producto } from '@/lib/types'
import type { ItemConProducto } from '@/lib/productos'
import {
  Button,
  EmptyState,
  PageHeader,
  RowActions,
  SearchInput,
  TableWrap,
  Td,
  Th,
  linkClass,
  rowClass,
} from '@/components/ui'
import { Modal } from '@/components/Modal'
import { PedidoForm } from '@/components/PedidoForm'
import { PagoForm } from '@/components/PagoForm'
import { ItemsResumen } from '@/components/ItemsResumen'
import { IconPlus } from '@/components/icons'
import { formatMoney, formatDate, formatNumber } from '@/lib/format'
import { eliminarPedido } from './actions'

export type PedidoFila = {
  id: string
  cliente_id: string
  fecha: string
  envio: string | null
  total: number
  clientes: { nombre: string } | null
  pedido_items: ItemConProducto[]
}

export function PedidosManager({
  pedidos,
  total,
  clientes,
  productos,
}: {
  pedidos: PedidoFila[]
  total: number
  clientes: Cliente[]
  productos: Producto[]
}) {
  const router = useRouter()
  const [modal, setModal] = useState<null | 'pedido' | 'pago'>(null)
  const [busqueda, setBusqueda] = useState('')
  const [, start] = useTransition()

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return pedidos
    return pedidos.filter((p) => (p.clientes?.nombre ?? '').toLowerCase().includes(q))
  }, [pedidos, busqueda])

  function borrar(p: PedidoFila) {
    if (!confirm(`¿Eliminar el pedido de ${p.clientes?.nombre ?? 'este cliente'} del ${formatDate(p.fecha)} por ${formatMoney(p.total)}?`)) return
    start(async () => {
      const res = await eliminarPedido(p.id, p.cliente_id)
      if (res.error) alert(res.error)
      router.refresh()
    })
  }

  return (
    <>
      <PageHeader
        title="Pedidos"
        meta={
          total > pedidos.length
            ? `Últimos ${formatNumber(pedidos.length)} de ${formatNumber(total)}. El historial completo está en la ficha de cada cliente.`
            : `${formatNumber(total)} pedidos`
        }
      >
        <Button variant="secondary" onClick={() => setModal('pago')}>
          Registrar pago
        </Button>
        <Button onClick={() => setModal('pedido')}>
          <IconPlus />
          Nuevo pedido
        </Button>
      </PageHeader>

      {pedidos.length === 0 ? (
        <EmptyState title="Todavía no hay pedidos">Cargá el primero con “Nuevo pedido” o desde la carga rápida del inicio.</EmptyState>
      ) : (
        <>
          <div className="mb-3">
            <SearchInput
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente"
              aria-label="Buscar pedidos por cliente"
            />
          </div>
          {filtrados.length === 0 ? (
            <EmptyState title={`Sin pedidos de “${busqueda}”`}>Probá con otra parte del nombre.</EmptyState>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th className="hidden sm:table-cell">Fecha</Th>
                  <Th>Cliente</Th>
                  <Th className="hidden sm:table-cell">Detalle</Th>
                  <Th num>Total</Th>
                  <Th>
                    <span className="sr-only">Acciones</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id} className={rowClass}>
                    <Td className="hidden whitespace-nowrap text-ink-2 sm:table-cell">{formatDate(p.fecha)}</Td>
                    <Td className="sm:min-w-36">
                      <Link href={`/clientes/${p.cliente_id}`} className={linkClass}>
                        {p.clientes?.nombre ?? '—'}
                      </Link>
                      <div className="mt-1 space-y-0.5 text-xs text-ink-3 sm:hidden">
                        <p>{formatDate(p.fecha)}</p>
                        <ItemsResumen items={p.pedido_items} />
                      </div>
                    </Td>
                    <Td className="hidden min-w-44 sm:table-cell">
                      <ItemsResumen items={p.pedido_items} />
                      {p.envio && <p className="mt-0.5 text-xs text-ink-3">{p.envio}</p>}
                    </Td>
                    <Td num className="font-medium text-ink">
                      {formatMoney(p.total)}
                    </Td>
                    <Td className="w-px py-2 pl-0">
                      <RowActions que={`pedido de ${p.clientes?.nombre ?? 'cliente'}`} onBorrar={() => borrar(p)} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </>
      )}

      <Modal open={modal === 'pedido'} onClose={() => setModal(null)} title="Nuevo pedido" size="lg">
        <PedidoForm
          clientes={clientes}
          productos={productos}
          onDone={() => setModal(null)}
          onCancel={() => setModal(null)}
        />
      </Modal>

      <Modal open={modal === 'pago'} onClose={() => setModal(null)} title="Registrar pago">
        <PagoForm clientes={clientes} onDone={() => setModal(null)} onCancel={() => setModal(null)} />
      </Modal>
    </>
  )
}

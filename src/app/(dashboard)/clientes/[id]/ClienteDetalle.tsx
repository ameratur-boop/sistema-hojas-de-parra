'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Cliente, Producto, Pago, ResumenCliente } from '@/lib/types'
import type { ItemConProducto } from '@/lib/productos'
import {
  Button,
  EmptyState,
  PageHeader,
  RowActions,
  SectionHeader,
  TableWrap,
  Td,
  Th,
  focusRing,
  rowClass,
} from '@/components/ui'
import { Modal } from '@/components/Modal'
import { PedidoForm } from '@/components/PedidoForm'
import { PagoForm } from '@/components/PagoForm'
import { ItemsResumen } from '@/components/ItemsResumen'
import { IconChevronLeft, IconPlus } from '@/components/icons'
import { formatMoney, formatDate, diasDesde } from '@/lib/format'
import { eliminarPedido, eliminarPago } from '@/app/(dashboard)/pedidos/actions'

export type PedidoConItems = {
  id: string
  fecha: string
  envio: string | null
  notas: string | null
  total: number
  created_at: string
  pedido_items: ItemConProducto[]
}

type Movimiento =
  | { tipo: 'pedido'; id: string; fecha: string; orden: string; importe: number; pedido: PedidoConItems; saldo: number }
  | { tipo: 'pago'; id: string; fecha: string; orden: string; importe: number; pago: Pago; saldo: number }

const METODO: Record<string, string> = { transferencia: 'Transferencia', efectivo: 'Efectivo', otro: 'Otro medio' }

export function ClienteDetalle({
  cliente,
  resumen,
  pedidos,
  pagos,
  productos,
}: {
  cliente: Cliente
  resumen: ResumenCliente | null
  pedidos: PedidoConItems[]
  pagos: Pago[]
  productos: Producto[]
}) {
  const router = useRouter()
  const [modal, setModal] = useState<null | 'pedido' | 'pago'>(null)
  const [, start] = useTransition()

  const saldo = Number(resumen?.saldo ?? 0)

  // Cuenta corriente: orden cronológico para acumular el saldo, se muestra del más nuevo al más viejo.
  const movimientos = useMemo(() => {
    const base = [
      ...pedidos.map((p) => ({ tipo: 'pedido' as const, id: p.id, fecha: p.fecha, orden: p.created_at, importe: Number(p.total), pedido: p })),
      ...pagos.map((p) => ({ tipo: 'pago' as const, id: p.id, fecha: p.fecha, orden: p.created_at, importe: Number(p.monto), pago: p })),
    ].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.orden.localeCompare(b.orden))
    let acumulado = 0
    return base
      .map((m) => {
        acumulado += m.tipo === 'pedido' ? m.importe : -m.importe
        return { ...m, saldo: acumulado } as Movimiento
      })
      .reverse()
  }, [pedidos, pagos])

  function borrar(m: Movimiento) {
    const que = m.tipo === 'pedido' ? 'el pedido' : 'el pago'
    if (!confirm(`¿Eliminar ${que} del ${formatDate(m.fecha)} por ${formatMoney(m.importe)}?`)) return
    start(async () => {
      const res = m.tipo === 'pedido' ? await eliminarPedido(m.id, cliente.id) : await eliminarPago(m.id, cliente.id)
      if (res.error) alert(res.error)
      router.refresh()
    })
  }

  const dias = diasDesde(resumen?.deuda_desde)
  const contacto = [cliente.telefono, cliente.email, cliente.direccion].filter(Boolean).join(' · ')

  return (
    <>
      <Link
        href="/clientes"
        className={`-ml-1 mb-3 inline-flex items-center gap-1 rounded-sm text-[13px] text-ink-3 transition-colors hover:text-ink ${focusRing}`}
      >
        <IconChevronLeft />
        Clientes
      </Link>

      <PageHeader title={cliente.nombre} meta={contacto || 'Sin datos de contacto'}>
        <Button variant="secondary" onClick={() => setModal('pago')}>
          Registrar pago
        </Button>
        <Button onClick={() => setModal('pedido')}>
          <IconPlus />
          Nuevo pedido
        </Button>
      </PageHeader>

      <dl className="mb-8 grid grid-cols-1 overflow-hidden rounded-lg border border-line bg-surface sm:grid-cols-3 sm:divide-x sm:divide-line">
        <div className="border-b border-line px-5 py-4 sm:border-b-0">
          <dt className="text-[13px] text-ink-3">Saldo</dt>
          <dd className={`mt-1 text-2xl font-semibold tabular-nums ${saldo > 0 ? 'text-danger' : saldo < 0 ? 'text-accent' : 'text-ink'}`}>
            {formatMoney(Math.abs(saldo))}
            {saldo < 0 && <span className="ml-2 text-sm font-medium">a favor</span>}
          </dd>
          <p className="mt-1 text-xs text-ink-3">
            {saldo > 0 && resumen?.deuda_desde
              ? `Debe desde el ${formatDate(resumen.deuda_desde)}${dias ? `, hace ${dias} días` : ''}`
              : saldo > 0
                ? 'Con deuda'
                : 'Sin deuda'}
          </p>
        </div>
        <div className="border-b border-line px-5 py-4 sm:border-b-0">
          <dt className="text-[13px] text-ink-3">Compró</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatMoney(resumen?.total_pedidos)}</dd>
          <p className="mt-1 text-xs text-ink-3">
            {pedidos.length} pedido{pedidos.length === 1 ? '' : 's'} · último {formatDate(resumen?.ultimo_pedido)}
          </p>
        </div>
        <div className="px-5 py-4">
          <dt className="text-[13px] text-ink-3">Pagó</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatMoney(resumen?.total_pagado)}</dd>
          <p className="mt-1 text-xs text-ink-3">
            {pagos.length} pago{pagos.length === 1 ? '' : 's'} · último {formatDate(resumen?.ultimo_pago)}
          </p>
        </div>
      </dl>

      <SectionHeader title="Cuenta corriente" meta={`${movimientos.length} movimientos`} />
      {movimientos.length === 0 ? (
        <EmptyState title="Sin movimientos">Los pedidos y pagos de este cliente van a aparecer acá.</EmptyState>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th className="hidden sm:table-cell">Fecha</Th>
              <Th>Detalle</Th>
              <Th num className="hidden sm:table-cell">
                Pedido
              </Th>
              <Th num className="hidden sm:table-cell">
                Pago
              </Th>
              <Th num className="sm:hidden">
                Importe
              </Th>
              <Th num>Saldo</Th>
              <Th>
                <span className="sr-only">Acciones</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => (
              <tr key={`${m.tipo}-${m.id}`} className={rowClass}>
                <Td className="hidden whitespace-nowrap text-ink-2 sm:table-cell">{formatDate(m.fecha)}</Td>
                <Td className="sm:min-w-56">
                  <p className="mb-0.5 text-xs text-ink-3 sm:hidden">{formatDate(m.fecha)}</p>
                  {m.tipo === 'pedido' ? (
                    <>
                      <ItemsResumen items={m.pedido.pedido_items} />
                      {(m.pedido.envio || m.pedido.notas) && (
                        <p className="mt-0.5 text-xs text-ink-3">
                          {[m.pedido.envio, m.pedido.notas].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-ink-2">Pago · {METODO[m.pago.metodo ?? ''] ?? 'Sin medio'}</span>
                      {m.pago.notas && <p className="mt-0.5 text-xs text-ink-3">{m.pago.notas}</p>}
                    </>
                  )}
                </Td>
                <Td num className="hidden text-ink sm:table-cell">
                  {m.tipo === 'pedido' ? formatMoney(m.importe) : ''}
                </Td>
                <Td num className="hidden text-accent sm:table-cell">
                  {m.tipo === 'pago' ? formatMoney(m.importe) : ''}
                </Td>
                <Td num className={`sm:hidden ${m.tipo === 'pago' ? 'text-accent' : 'text-ink'}`}>
                  {m.tipo === 'pago' ? `−${formatMoney(m.importe)}` : formatMoney(m.importe)}
                </Td>
                <Td num className={`font-medium ${m.saldo > 0 ? 'text-ink' : 'text-ink-3'}`}>
                  {formatMoney(m.saldo)}
                </Td>
                <Td className="w-px py-2 pl-0">
                  <RowActions que={`${m.tipo} del ${formatDate(m.fecha)}`} onBorrar={() => borrar(m)} />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal open={modal === 'pedido'} onClose={() => setModal(null)} title={`Nuevo pedido de ${cliente.nombre}`} size="lg">
        <PedidoForm
          clientes={[]}
          productos={productos}
          clienteFijo={cliente.id}
          onDone={() => setModal(null)}
          onCancel={() => setModal(null)}
        />
      </Modal>

      <Modal open={modal === 'pago'} onClose={() => setModal(null)} title={`Pago de ${cliente.nombre}`}>
        <PagoForm
          clientes={[]}
          clienteFijo={cliente.id}
          saldo={saldo}
          onDone={() => setModal(null)}
          onCancel={() => setModal(null)}
        />
      </Modal>
    </>
  )
}

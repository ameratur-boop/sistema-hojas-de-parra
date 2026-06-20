'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Cliente, Producto, Pago, ResumenCliente } from '@/lib/types'
import { Button, Card, CardBody, Badge, EmptyState } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { PedidoForm } from '@/components/PedidoForm'
import { PagoForm } from '@/components/PagoForm'
import { formatMoney, formatDate } from '@/lib/format'
import { eliminarPedido, eliminarPago } from '@/app/(dashboard)/pedidos/actions'

type PedidoConItems = {
  id: string
  fecha: string
  envio: string | null
  total: number
  created_via: string
  pedido_items: { id: string; descripcion: string; cantidad: number; precio_unitario: number; subtotal: number }[]
}

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

  function borrarPedido(id: string) {
    if (!confirm('¿Eliminar este pedido?')) return
    start(async () => {
      await eliminarPedido(id, cliente.id)
      router.refresh()
    })
  }

  function borrarPago(id: string) {
    if (!confirm('¿Eliminar este pago?')) return
    start(async () => {
      await eliminarPago(id, cliente.id)
      router.refresh()
    })
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">{cliente.nombre}</h1>
          <p className="text-sm text-slate-400">
            {[cliente.telefono, cliente.email].filter(Boolean).join(' · ') || 'Sin contacto'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setModal('pago')}>
            Registrar pago
          </Button>
          <Button onClick={() => setModal('pedido')}>+ Nuevo pedido</Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardBody className="pt-5">
            <p className="text-sm text-slate-400">Total pedidos</p>
            <p className="text-xl font-bold text-slate-100">{formatMoney(resumen?.total_pedidos)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <p className="text-sm text-slate-400">Pagado</p>
            <p className="text-xl font-bold text-emerald-400">{formatMoney(resumen?.total_pagado)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <p className="text-sm text-slate-400">Saldo</p>
            <p className={`text-xl font-bold ${saldo > 0 ? 'text-red-400' : 'text-slate-100'}`}>
              {formatMoney(saldo)}
            </p>
          </CardBody>
        </Card>
      </div>

      <h2 className="mb-2 text-sm font-semibold text-slate-300">Pedidos</h2>
      {pedidos.length === 0 ? (
        <EmptyState>Sin pedidos.</EmptyState>
      ) : (
        <div className="mb-6 space-y-2">
          {pedidos.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex items-start justify-between pt-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{formatDate(p.fecha)}</span>
                    {p.created_via === 'telegram' && <Badge color="slate">Telegram</Badge>}
                    {p.envio && <span className="text-xs text-slate-500">· {p.envio}</span>}
                  </div>
                  <ul className="mt-1 text-sm text-slate-300">
                    {p.pedido_items.map((it) => (
                      <li key={it.id}>
                        {it.cantidad} × {it.descripcion} × {formatMoney(it.precio_unitario)} ={' '}
                        {formatMoney(it.subtotal)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-100">{formatMoney(p.total)}</p>
                  <button
                    onClick={() => borrarPedido(p.id)}
                    className="text-xs text-slate-500 hover:text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold text-slate-300">Pagos</h2>
      {pagos.length === 0 ? (
        <EmptyState>Sin pagos registrados.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-700/60">
              {pagos.map((pg) => (
                <tr key={pg.id} className="hover:bg-slate-700/40">
                  <td className="px-4 py-3 text-slate-300">{formatDate(pg.fecha)}</td>
                  <td className="px-4 py-3 text-slate-400">{pg.metodo ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-400">
                    {formatMoney(pg.monto)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => borrarPago(pg.id)}
                      className="text-xs text-slate-500 hover:text-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal === 'pedido'} onClose={() => setModal(null)} title="Nuevo pedido">
        <PedidoForm
          clientes={[]}
          productos={productos}
          clienteFijo={cliente.id}
          onDone={() => setModal(null)}
          onCancel={() => setModal(null)}
        />
      </Modal>

      <Modal open={modal === 'pago'} onClose={() => setModal(null)} title="Registrar pago">
        <PagoForm
          clientes={[]}
          clienteFijo={cliente.id}
          onDone={() => setModal(null)}
          onCancel={() => setModal(null)}
        />
      </Modal>
    </>
  )
}

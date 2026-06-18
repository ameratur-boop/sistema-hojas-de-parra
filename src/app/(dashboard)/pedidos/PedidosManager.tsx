'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Cliente, Producto } from '@/lib/types'
import { Button, Badge, EmptyState } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { PedidoForm } from '@/components/PedidoForm'
import { PagoForm } from '@/components/PagoForm'
import { formatMoney, formatDate } from '@/lib/format'
import { eliminarPedido } from './actions'

export type PedidoFila = {
  id: string
  cliente_id: string
  fecha: string
  envio: string | null
  total: number
  created_via: string
  clientes: { nombre: string } | null
}

export function PedidosManager({
  pedidos,
  clientes,
  productos,
}: {
  pedidos: PedidoFila[]
  clientes: Cliente[]
  productos: Producto[]
}) {
  const router = useRouter()
  const [modal, setModal] = useState<null | 'pedido' | 'pago'>(null)
  const [, start] = useTransition()

  function borrar(p: PedidoFila) {
    if (!confirm('¿Eliminar este pedido?')) return
    start(async () => {
      const res = await eliminarPedido(p.id, p.cliente_id)
      if (res.error) alert(res.error)
      router.refresh()
    })
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Pedidos</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setModal('pago')}>
            Registrar pago
          </Button>
          <Button onClick={() => setModal('pedido')}>+ Nuevo pedido</Button>
        </div>
      </div>

      {pedidos.length === 0 ? (
        <EmptyState>Todavía no hay pedidos cargados.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Envío</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pedidos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{formatDate(p.fecha)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <Link href={`/clientes/${p.cliente_id}`} className="hover:text-emerald-700">
                      {p.clientes?.nombre ?? '—'}
                    </Link>
                    {p.created_via === 'telegram' && (
                      <span className="ml-2 align-middle">
                        <Badge color="slate">Telegram</Badge>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.envio ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(p.total)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => borrar(p)} className="text-slate-500 hover:text-red-600">
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

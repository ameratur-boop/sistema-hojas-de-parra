'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Cliente, ResumenCliente } from '@/lib/types'
import { Button, Card, CardBody, EmptyState } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { PagoForm } from '@/components/PagoForm'
import { formatMoney, formatDate, diasDesde } from '@/lib/format'

export function MorososView({
  morosos,
  totalAdeudado,
  clientes,
}: {
  morosos: ResumenCliente[]
  totalAdeudado: number
  clientes: Cliente[]
}) {
  const [pagoCliente, setPagoCliente] = useState<ResumenCliente | null>(null)

  return (
    <>
      <h1 className="mb-5 text-xl font-bold text-slate-800">Morosos</h1>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card>
          <CardBody className="pt-5">
            <p className="text-sm text-slate-500">Total adeudado</p>
            <p className="text-2xl font-bold text-red-600">{formatMoney(totalAdeudado)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <p className="text-sm text-slate-500">Clientes con deuda</p>
            <p className="text-2xl font-bold text-slate-800">{morosos.length}</p>
          </CardBody>
        </Card>
      </div>

      {morosos.length === 0 ? (
        <EmptyState>🎉 No hay morosos. Todos al día.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Debe desde</th>
                <th className="px-4 py-3 text-right font-medium">Saldo</th>
                <th className="px-4 py-3 font-medium">Último pago</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {morosos.map((m, i) => {
                const dias = diasDesde(m.deuda_desde)
                return (
                  <tr key={m.cliente_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <Link href={`/clientes/${m.cliente_id}`} className="hover:text-emerald-700">
                        {m.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(m.deuda_desde)}
                      {dias !== null && (
                        <span className="ml-2 text-xs text-red-500">
                          hace {dias} día{dias === 1 ? '' : 's'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      {formatMoney(m.saldo)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(m.ultimo_pago)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" onClick={() => setPagoCliente(m)}>
                        Cobrar
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={pagoCliente !== null}
        onClose={() => setPagoCliente(null)}
        title={`Registrar pago — ${pagoCliente?.nombre ?? ''}`}
      >
        {pagoCliente && (
          <PagoForm
            clientes={clientes}
            clienteFijo={pagoCliente.cliente_id}
            onDone={() => setPagoCliente(null)}
            onCancel={() => setPagoCliente(null)}
          />
        )}
      </Modal>
    </>
  )
}

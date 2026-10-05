'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ResumenCliente } from '@/lib/types'
import { Button, EmptyState, SectionHeader, TableWrap, Td, Th, linkClass, rowClass } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { PagoForm } from '@/components/PagoForm'
import { formatMoney, formatDate, diasDesde } from '@/lib/format'

function antiguedad(dias: number | null) {
  if (dias === null) return null
  const texto = dias === 0 ? 'hoy' : `${dias} día${dias === 1 ? '' : 's'}`
  const tono = dias > 60 ? 'text-danger' : dias > 30 ? 'text-warn' : 'text-ink-3'
  return <span className={`text-xs ${tono}`}>{texto}</span>
}

export function MorososView({ morosos }: { morosos: ResumenCliente[] }) {
  const [pagoCliente, setPagoCliente] = useState<ResumenCliente | null>(null)
  const total = morosos.reduce((s, m) => s + Number(m.saldo), 0)

  return (
    <section>
      <SectionHeader
        title="Deudores"
        meta={
          morosos.length > 0 && (
            <>
              {morosos.length} cliente{morosos.length === 1 ? '' : 's'} ·{' '}
              <span className="font-medium text-danger">{formatMoney(total)}</span> por cobrar
            </>
          )
        }
      />

      {morosos.length === 0 ? (
        <EmptyState title="Nadie debe plata">Cuando un cliente quede con saldo pendiente va a aparecer acá.</EmptyState>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Cliente</Th>
              <Th>Debe desde</Th>
              <Th className="hidden sm:table-cell">Último pago</Th>
              <Th num>Saldo</Th>
              <Th>
                <span className="sr-only">Acciones</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {morosos.map((m) => (
              <tr key={m.cliente_id} className={rowClass}>
                <Td>
                  <Link href={`/clientes/${m.cliente_id}`} className={linkClass}>
                    {m.nombre}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap">
                  <span className="text-ink-2">{formatDate(m.deuda_desde)}</span>{' '}
                  {antiguedad(diasDesde(m.deuda_desde))}
                </Td>
                <Td className="hidden whitespace-nowrap text-ink-3 sm:table-cell">{formatDate(m.ultimo_pago)}</Td>
                <Td num className="font-semibold text-ink">
                  {formatMoney(m.saldo)}
                </Td>
                <Td className="w-px py-2 text-right">
                  <Button variant="secondary" size="sm" onClick={() => setPagoCliente(m)}>
                    Cobrar
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal
        open={pagoCliente !== null}
        onClose={() => setPagoCliente(null)}
        title={`Cobrar a ${pagoCliente?.nombre ?? ''}`}
      >
        {pagoCliente && (
          <PagoForm
            clientes={[]}
            clienteFijo={pagoCliente.cliente_id}
            saldo={Number(pagoCliente.saldo)}
            onDone={() => setPagoCliente(null)}
            onCancel={() => setPagoCliente(null)}
          />
        )}
      </Modal>
    </section>
  )
}

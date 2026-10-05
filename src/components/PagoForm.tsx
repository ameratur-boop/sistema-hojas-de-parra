'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Cliente } from '@/lib/types'
import { Button, Field, FormActions, FormError, Input, Select } from '@/components/ui'
import { registrarPago } from '@/app/(dashboard)/pedidos/actions'
import { formatMoney, hoyAR } from '@/lib/format'

export function PagoForm({
  clientes,
  clienteFijo,
  saldo,
  onDone,
  onCancel,
}: {
  clientes: Pick<Cliente, 'id' | 'nombre'>[]
  clienteFijo?: string
  saldo?: number
  onDone?: () => void
  onCancel?: () => void
}) {
  const router = useRouter()
  const [clienteId, setClienteId] = useState(clienteFijo ?? '')
  const [fecha, setFecha] = useState(hoyAR)
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState('transferencia')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!clienteId) return setError('Elegí un cliente.')
    if (!(Number(monto) > 0)) return setError('Ingresá un monto mayor a cero.')
    start(async () => {
      const res = await registrarPago({
        cliente_id: clienteId,
        fecha,
        monto: Number(monto),
        metodo,
        notas,
      })
      if (res.error) return setError(res.error)
      router.refresh()
      onDone?.()
    })
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      {!clienteFijo && (
        <Field label="Cliente" htmlFor="pago-cliente">
          <Select id="pago-cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Elegir cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Monto" htmlFor="pago-monto">
          <Input
            id="pago-monto"
            type="number"
            inputMode="numeric"
            min={0}
            step="any"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Fecha" htmlFor="pago-fecha">
          <Input id="pago-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
      </div>
      {saldo !== undefined && saldo > 0 && (
        <p className="-mt-1 text-[13px] text-ink-3">
          Saldo pendiente {formatMoney(saldo)}.{' '}
          <button
            type="button"
            onClick={() => setMonto(String(saldo))}
            className="font-medium text-accent hover:underline"
          >
            Cobrar todo
          </button>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Método" htmlFor="pago-metodo">
          <Select id="pago-metodo" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
            <option value="otro">Otro</option>
          </Select>
        </Field>
        <Field label="Nota" hint="opcional" htmlFor="pago-notas">
          <Input id="pago-notas" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </Field>
      </div>
      {error && <FormError>{error}</FormError>}
      <FormActions>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Registrar pago'}
        </Button>
      </FormActions>
    </form>
  )
}

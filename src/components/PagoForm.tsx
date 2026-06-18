'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Cliente } from '@/lib/types'
import { Button, Input, Label, Select } from '@/components/ui'
import { registrarPago } from '@/app/(dashboard)/pedidos/actions'

const hoy = () => new Date().toISOString().slice(0, 10)

export function PagoForm({
  clientes,
  clienteFijo,
  onDone,
  onCancel,
}: {
  clientes: Cliente[]
  clienteFijo?: string
  onDone?: () => void
  onCancel?: () => void
}) {
  const router = useRouter()
  const [clienteId, setClienteId] = useState(clienteFijo ?? '')
  const [fecha, setFecha] = useState(hoy())
  const [monto, setMonto] = useState<number | ''>('')
  const [metodo, setMetodo] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!clienteId) return setError('Elegí un cliente.')
    if (!monto || Number(monto) <= 0) return setError('Ingresá un monto válido.')
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
    <form onSubmit={guardar} className="space-y-3">
      {!clienteFijo && (
        <div>
          <Label>Cliente *</Label>
          <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Elegir cliente…</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <Label>Monto *</Label>
          <Input
            type="number"
            min={0}
            value={monto}
            onChange={(e) => setMonto(e.target.value === '' ? '' : Number(e.target.value))}
            autoFocus
          />
        </div>
      </div>
      <div>
        <Label>Método</Label>
        <Select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
          <option value="">—</option>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="otro">Otro</option>
        </Select>
      </div>
      <div>
        <Label>Notas</Label>
        <Input value={notas} onChange={(e) => setNotas(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Registrar pago'}
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Cliente, Producto, ItemNuevo } from '@/lib/types'
import { Button, Input, Label, Select, Textarea } from '@/components/ui'
import { formatMoney } from '@/lib/format'
import { crearPedido } from '@/app/(dashboard)/pedidos/actions'

type Linea = ItemNuevo & { _key: number }

const hoy = () => new Date().toISOString().slice(0, 10)

function lineaVacia(): Linea {
  return { _key: Math.random(), producto_id: '', descripcion: '', cantidad: 1, precio_unitario: 0 }
}

export function PedidoForm({
  clientes,
  productos,
  clienteFijo,
  onDone,
  onCancel,
}: {
  clientes: Cliente[]
  productos: Producto[]
  clienteFijo?: string
  onDone?: () => void
  onCancel?: () => void
}) {
  const router = useRouter()
  const [clienteId, setClienteId] = useState(clienteFijo ?? '')
  const [fecha, setFecha] = useState(hoy())
  const [envio, setEnvio] = useState('')
  const [notas, setNotas] = useState('')
  const [lineas, setLineas] = useState<Linea[]>([lineaVacia()])
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const total = useMemo(
    () => lineas.reduce((s, l) => s + (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0), 0),
    [lineas],
  )

  function setLinea(key: number, patch: Partial<Linea>) {
    setLineas((ls) => ls.map((l) => (l._key === key ? { ...l, ...patch } : l)))
  }

  function elegirProducto(key: number, productoId: string) {
    const p = productos.find((x) => x.id === productoId)
    if (p) {
      setLinea(key, {
        producto_id: p.id,
        descripcion: p.nombre,
        precio_unitario: p.precio,
      })
    } else {
      setLinea(key, { producto_id: '' })
    }
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!clienteId) return setError('Elegí un cliente.')
    const items = lineas
      .filter((l) => l.descripcion.trim() && Number(l.cantidad) > 0)
      .map((l) => ({
        producto_id: l.producto_id || null,
        descripcion: l.descripcion.trim(),
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario),
      }))
    if (!items.length) return setError('Agregá al menos un item con descripción y cantidad.')

    start(async () => {
      const res = await crearPedido({ cliente_id: clienteId, fecha, envio, notas, items })
      if (res.error) return setError(res.error)
      router.refresh()
      onDone?.()
    })
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {!clienteFijo && (
          <div className="col-span-2">
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
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <Label>Envío / detalle</Label>
          <Input value={envio} onChange={(e) => setEnvio(e.target.value)} placeholder="opcional" />
        </div>
      </div>

      <div>
        <Label>Items</Label>
        <div className="space-y-2">
          {lineas.map((l) => {
            const sub = (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0)
            return (
              <div key={l._key} className="rounded-lg border border-slate-700 p-2">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[140px] flex-1">
                    <span className="text-xs text-slate-500">Producto</span>
                    <Select
                      value={l.producto_id || ''}
                      onChange={(e) => elegirProducto(l._key, e.target.value)}
                    >
                      <option value="">Personalizado</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="w-20">
                    <span className="text-xs text-slate-500">Cant.</span>
                    <Input
                      type="number"
                      min={0}
                      value={l.cantidad}
                      onChange={(e) => setLinea(l._key, { cantidad: Number(e.target.value) })}
                    />
                  </div>
                  <div className="w-28">
                    <span className="text-xs text-slate-500">Precio</span>
                    <Input
                      type="number"
                      min={0}
                      value={l.precio_unitario}
                      onChange={(e) => setLinea(l._key, { precio_unitario: Number(e.target.value) })}
                    />
                  </div>
                  <div className="w-24 text-right">
                    <span className="block text-xs text-slate-500">Subtotal</span>
                    <span className="text-sm font-medium">{formatMoney(sub)}</span>
                  </div>
                  {lineas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLineas((ls) => ls.filter((x) => x._key !== l._key))}
                      className="px-2 text-lg text-slate-500 hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
                <input
                  className="mt-2 w-full rounded border border-slate-700 px-2 py-1 text-xs"
                  placeholder="Descripción (ej: 300g)"
                  value={l.descripcion}
                  onChange={(e) => setLinea(l._key, { descripcion: e.target.value })}
                />
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => setLineas((ls) => [...ls, lineaVacia()])}
          className="mt-2 text-sm font-medium text-emerald-400 hover:underline"
        >
          + Agregar item
        </button>
      </div>

      <div>
        <Label>Notas</Label>
        <Textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
      </div>

      <div className="flex items-center justify-between border-t border-slate-700 pt-3">
        <span className="text-sm text-slate-400">Total</span>
        <span className="text-lg font-bold text-slate-100">{formatMoney(total)}</span>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar pedido'}
        </Button>
      </div>
    </form>
  )
}

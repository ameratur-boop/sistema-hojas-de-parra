'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Cliente, Producto } from '@/lib/types'
import { Button, Field, FormError, Input, Select, focusRing } from '@/components/ui'
import { IconClose, IconPlus } from '@/components/icons'
import { formatMoney, hoyAR } from '@/lib/format'
import { CANAL_LABEL, clasificar, nombreBolsa, ordenarClases } from '@/lib/productos'
import { crearPedido } from '@/app/(dashboard)/pedidos/actions'

type Linea = { key: number; productoId: string; cantidad: string; precio: string }

let siguienteKey = 0
const lineaVacia = (): Linea => ({ key: siguienteKey++, productoId: '', cantidad: '', precio: '' })

export function PedidoForm({
  clientes,
  productos,
  clienteFijo,
  onDone,
  onCancel,
}: {
  clientes: Pick<Cliente, 'id' | 'nombre'>[]
  productos: Producto[]
  clienteFijo?: string
  onDone?: () => void
  onCancel?: () => void
}) {
  const router = useRouter()
  const [clienteId, setClienteId] = useState(clienteFijo ?? '')
  const [fecha, setFecha] = useState(hoyAR)
  const [envio, setEnvio] = useState('')
  const [notas, setNotas] = useState('')
  const [lineas, setLineas] = useState<Linea[]>(() => [lineaVacia()])
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const catalogo = useMemo(
    () =>
      productos
        .map((p) => ({ ...p, ...clasificar(p.nombre) }))
        .sort(ordenarClases)
        .map((p) => ({ ...p, etiqueta: `${nombreBolsa(p.presentacion)} · ${CANAL_LABEL[p.canal]}` })),
    [productos],
  )

  const subtotal = (l: Linea) => (Number(l.cantidad) || 0) * (Number(l.precio) || 0)
  const total = lineas.reduce((s, l) => s + subtotal(l), 0)

  function setLinea(key: number, patch: Partial<Linea>) {
    setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function elegirProducto(key: number, productoId: string) {
    const p = catalogo.find((x) => x.id === productoId)
    setLinea(key, { productoId, precio: p ? String(p.precio) : '' })
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!clienteId) return setError('Elegí un cliente.')
    const completas = lineas.filter((l) => l.productoId && Number(l.cantidad) > 0)
    if (!completas.length) return setError('Agregá al menos una bolsa con cantidad.')
    if (completas.length !== lineas.filter((l) => l.productoId || l.cantidad).length) {
      return setError('Hay líneas incompletas: elegí la bolsa y la cantidad, o quitalas.')
    }

    const items = completas.map((l) => ({
      producto_id: l.productoId,
      descripcion: catalogo.find((p) => p.id === l.productoId)?.nombre ?? '',
      cantidad: Number(l.cantidad),
      precio_unitario: Number(l.precio) || 0,
    }))

    start(async () => {
      const res = await crearPedido({ cliente_id: clienteId, fecha, envio, notas, items })
      if (res.error) return setError(res.error)
      router.refresh()
      onDone?.()
    })
  }

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {!clienteFijo && (
          <Field label="Cliente" htmlFor="ped-cliente" className="col-span-2">
            <Select id="ped-cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)} autoFocus>
              <option value="">Elegir cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Fecha" htmlFor="ped-fecha">
          <Input id="ped-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
        <Field label="Envío" hint="opcional" htmlFor="ped-envio">
          <Input id="ped-envio" value={envio} onChange={(e) => setEnvio(e.target.value)} placeholder="Ej: Andreani, retira" />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-2">Bolsas</legend>
        <div className="hidden grid-cols-[minmax(0,1fr)_5.5rem_7.5rem_7rem_2.25rem] gap-2 px-0.5 pb-1.5 text-xs text-ink-3 sm:grid">
          <span>Producto</span>
          <span>Cantidad</span>
          <span>Precio c/u</span>
          <span className="text-right">Subtotal</span>
        </div>
        <ul className="space-y-2">
          {lineas.map((l, i) => (
            <li
              key={l.key}
              className="grid grid-cols-[minmax(0,1fr)_2.25rem] gap-2 rounded-md border border-line p-2 sm:grid-cols-[minmax(0,1fr)_5.5rem_7.5rem_7rem_2.25rem] sm:items-center sm:border-0 sm:p-0"
            >
              <Select
                aria-label={`Producto, línea ${i + 1}`}
                value={l.productoId}
                onChange={(e) => elegirProducto(l.key, e.target.value)}
              >
                <option value="">Elegir bolsa</option>
                {catalogo.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.etiqueta}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => setLineas((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : [lineaVacia()]))}
                aria-label={`Quitar línea ${i + 1}`}
                className={`grid size-9 place-items-center justify-self-end rounded-md text-ink-3 transition-colors hover:bg-danger/10 hover:text-danger sm:order-last ${focusRing}`}
              >
                <IconClose width={16} height={16} />
              </button>
              <div className="col-span-2 grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-2 sm:col-span-1 sm:contents">
                <Input
                  aria-label={`Cantidad, línea ${i + 1}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="Cant."
                  value={l.cantidad}
                  onChange={(e) => setLinea(l.key, { cantidad: e.target.value })}
                />
                <Input
                  aria-label={`Precio por bolsa, línea ${i + 1}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="Precio"
                  value={l.precio}
                  onChange={(e) => setLinea(l.key, { precio: e.target.value })}
                />
                <span className="text-right text-sm font-medium tabular-nums text-ink-2">{formatMoney(subtotal(l))}</span>
              </div>
            </li>
          ))}
        </ul>
        <Button variant="ghost" size="sm" className="mt-2 -ml-2.5" onClick={() => setLineas((ls) => [...ls, lineaVacia()])}>
          <IconPlus />
          Agregar bolsa
        </Button>
      </fieldset>

      <Field label="Notas" hint="opcional" htmlFor="ped-notas">
        <Input id="ped-notas" value={notas} onChange={(e) => setNotas(e.target.value)} />
      </Field>

      {error && <FormError>{error}</FormError>}

      <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
        <p className="text-sm text-ink-3">
          Total <span className="ml-1 text-lg font-semibold tabular-nums text-ink">{formatMoney(total)}</span>
        </p>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar pedido'}
          </Button>
        </div>
      </div>
    </form>
  )
}

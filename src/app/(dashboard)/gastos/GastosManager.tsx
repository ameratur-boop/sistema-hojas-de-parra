'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Gasto } from '@/lib/types'
import {
  Button,
  EmptyState,
  Field,
  FormActions,
  FormError,
  Input,
  PageHeader,
  Panel,
  RowActions,
  SearchInput,
  SectionHeader,
  Select,
  TableWrap,
  Td,
  Th,
  focusRing,
  rowClass,
} from '@/components/ui'
import { Modal } from '@/components/Modal'
import { IconPlus } from '@/components/icons'
import { formatDate, formatMoney } from '@/lib/format'
import { etiqueta, periodos } from '@/lib/analytics'
import { CATEGORIAS, labelCategoria, type CategoriaGasto } from '@/lib/gastos'
import { crearGasto, editarGasto, eliminarGasto } from './actions'

type Movimiento = { fecha: string; monto: number }
type Form = { fecha: string; categoria: CategoriaGasto | ''; descripcion: string; monto: string; metodo: string }

const ULTIMOS_12 = 'ultimos12'
const METODO: Record<string, string> = { transferencia: 'Transferencia', efectivo: 'Efectivo', otro: 'Otro' }

const suma = (xs: Movimiento[], desde: string, hasta: string) =>
  xs.reduce((s, x) => (x.fecha >= desde && x.fecha < hasta ? s + x.monto : s), 0)

function finDeMes(clave: string, meses = 1) {
  const [y, m] = clave.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + meses, 1)).toISOString().slice(0, 10)
}

export function GastosManager({
  gastos,
  faltaTabla,
  ventas,
  cobros,
  hoy,
}: {
  gastos: Gasto[]
  faltaTabla: boolean
  ventas: Movimiento[]
  cobros: Movimiento[]
  hoy: string
}) {
  const router = useRouter()
  const meses = useMemo(() => periodos(hoy, 'mes', 12).reverse(), [hoy])
  const [mes, setMes] = useState(meses[0])
  const [categoria, setCategoria] = useState<CategoriaGasto | ''>('')
  const [busqueda, setBusqueda] = useState('')

  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>({ fecha: hoy, categoria: '', descripcion: '', monto: '', metodo: 'transferencia' })
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  // Rango [desde, hasta) del período elegido y del anterior de igual largo
  const rango = useMemo(() => {
    if (mes === ULTIMOS_12) {
      const desde = meses[11]
      return { desde, hasta: finDeMes(meses[0]), prevDesde: finDeMes(desde, -12), etiqueta: 'los 12 meses previos' }
    }
    return { desde: mes, hasta: finDeMes(mes), prevDesde: finDeMes(mes, -1), etiqueta: 'el mes anterior' }
  }, [mes, meses])

  const enRango = useMemo(
    () =>
      gastos
        .filter((g) => g.fecha >= rango.desde && g.fecha < rango.hasta)
        .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.created_at.localeCompare(a.created_at)),
    [gastos, rango],
  )
  const totalGastos = enRango.reduce((s, g) => s + g.monto, 0)
  const gastosPrev = suma(gastos, rango.prevDesde, rango.desde)
  const totalVentas = suma(ventas, rango.desde, rango.hasta)
  const totalCobrado = suma(cobros, rango.desde, rango.hasta)
  const resultado = totalVentas - totalGastos

  const porCategoria = useMemo(() => {
    const m = new Map<string, number>()
    for (const g of enRango) m.set(g.categoria, (m.get(g.categoria) ?? 0) + g.monto)
    return Array.from(m, ([clave, monto]) => ({ clave, monto })).sort((a, b) => b.monto - a.monto)
  }, [enRango])
  const maxCategoria = Math.max(...porCategoria.map((c) => c.monto), 1)

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return enRango.filter(
      (g) => (!categoria || g.categoria === categoria) && (!q || (g.descripcion ?? '').toLowerCase().includes(q)),
    )
  }, [enRango, categoria, busqueda])

  function abrirNuevo() {
    setEditId(null)
    setForm({ fecha: hoy, categoria: categoria || '', descripcion: '', monto: '', metodo: 'transferencia' })
    setError(null)
    setOpen(true)
  }

  function abrirEditar(g: Gasto) {
    setEditId(g.id)
    setForm({
      fecha: g.fecha,
      categoria: g.categoria as CategoriaGasto,
      descripcion: g.descripcion ?? '',
      monto: String(g.monto),
      metodo: g.metodo ?? '',
    })
    setError(null)
    setOpen(true)
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!(Number(form.monto) > 0)) return setError('Ingresá un monto mayor a cero.')
    if (!form.categoria) return setError('Elegí una categoría.')
    const data = {
      fecha: form.fecha,
      categoria: form.categoria,
      descripcion: form.descripcion,
      monto: Number(form.monto),
      metodo: form.metodo,
    }
    start(async () => {
      const res = editId ? await editarGasto(editId, data) : await crearGasto(data)
      if (res.error) return setError(res.error)
      setOpen(false)
      router.refresh()
    })
  }

  function borrar(g: Gasto) {
    if (!confirm(`¿Eliminar el gasto de ${formatMoney(g.monto)} del ${formatDate(g.fecha)}?`)) return
    start(async () => {
      const res = await eliminarGasto(g.id)
      if (res.error) alert(res.error)
      router.refresh()
    })
  }

  if (faltaTabla) {
    return (
      <>
        <PageHeader title="Gastos" />
        <EmptyState title="La sección de gastos todavía no está activada">
          Falta crear la tabla en la base de datos (migración 0002_gastos.sql). Una vez hecho, desde acá vas a poder
          cargar compras de hojas, envases, fletes y demás gastos.
        </EmptyState>
      </>
    )
  }

  const deltaGastos = gastosPrev > 0 ? Math.round(((totalGastos - gastosPrev) / gastosPrev) * 100) : null

  return (
    <>
      <PageHeader title="Gastos">
        <Select aria-label="Período" value={mes} onChange={(e) => setMes(e.target.value)} className="w-auto">
          {meses.map((m) => (
            <option key={m} value={m}>
              {etiqueta(m, 'mes', true)}
            </option>
          ))}
          <option value={ULTIMOS_12}>Últimos 12 meses</option>
        </Select>
        <Button onClick={abrirNuevo}>
          <IconPlus />
          Registrar gasto
        </Button>
      </PageHeader>

      <dl className="mb-8 flex flex-wrap gap-px overflow-hidden rounded-lg border border-line bg-line">
        <div className="min-w-[9.5rem] flex-1 bg-surface px-4 py-4">
          <dt className="text-[13px] text-ink-3">Gastos</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatMoney(totalGastos)}</dd>
          <p className="mt-1 text-xs text-ink-3">
            {deltaGastos === null ? (
              `Sin gastos en ${rango.etiqueta}`
            ) : (
              <>
                <span className={deltaGastos > 0 ? 'text-danger' : deltaGastos < 0 ? 'text-accent' : ''}>
                  {deltaGastos > 0 ? '+' : ''}
                  {deltaGastos}%
                </span>{' '}
                vs. {rango.etiqueta}
              </>
            )}
          </p>
        </div>
        <div className="min-w-[9.5rem] flex-1 bg-surface px-4 py-4">
          <dt className="text-[13px] text-ink-3">Ventas</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatMoney(totalVentas)}</dd>
          <p className="mt-1 text-xs text-ink-3">Cobrado {formatMoney(totalCobrado)}</p>
        </div>
        <div className="min-w-[9.5rem] flex-1 bg-surface px-4 py-4">
          <dt className="text-[13px] text-ink-3">Resultado</dt>
          <dd className={`mt-1 text-xl font-semibold tabular-nums ${resultado < 0 ? 'text-danger' : 'text-accent'}`}>
            {formatMoney(resultado)}
          </dd>
          <p className="mt-1 text-xs text-ink-3">Ventas menos gastos</p>
        </div>
        <div className="min-w-[9.5rem] flex-1 bg-surface px-4 py-4">
          <dt className="text-[13px] text-ink-3">Caja</dt>
          <dd className={`mt-1 text-xl font-semibold tabular-nums ${totalCobrado - totalGastos < 0 ? 'text-danger' : 'text-ink'}`}>
            {formatMoney(totalCobrado - totalGastos)}
          </dd>
          <p className="mt-1 text-xs text-ink-3">Cobrado menos gastos</p>
        </div>
      </dl>

      {enRango.length === 0 ? (
        <EmptyState title={`Sin gastos en ${mes === ULTIMOS_12 ? 'los últimos 12 meses' : etiqueta(mes, 'mes', true)}`}>
          Registrá compras de hojas, envases, fletes, sueldos o cualquier otro gasto con “Registrar gasto”.
        </EmptyState>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <section>
            <SectionHeader title="Por categoría" />
            <Panel className="p-2">
              <ul>
                {porCategoria.map((c) => {
                  const activa = categoria === c.clave
                  return (
                    <li key={c.clave}>
                      <button
                        type="button"
                        aria-pressed={activa}
                        onClick={() => setCategoria(activa ? '' : (c.clave as CategoriaGasto))}
                        className={`w-full rounded-md px-2.5 py-2 text-left transition-colors duration-150 ${focusRing} ${
                          activa ? 'bg-raised' : 'hover:bg-raised/50'
                        }`}
                      >
                        <span className="flex items-baseline justify-between gap-3 text-sm">
                          <span className={activa ? 'font-medium text-ink' : 'text-ink-2'}>{labelCategoria(c.clave)}</span>
                          <span className="tabular-nums text-ink">{formatMoney(c.monto)}</span>
                        </span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised">
                            <span
                              className="block h-full rounded-full bg-ink-3"
                              style={{ width: `${(c.monto / maxCategoria) * 100}%` }}
                            />
                          </span>
                          <span className="w-9 text-right text-xs tabular-nums text-ink-3">
                            {Math.round((c.monto / (totalGastos || 1)) * 100)}%
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Panel>
          </section>

          <section className="min-w-0">
            <SectionHeader
              title={categoria ? labelCategoria(categoria) : 'Movimientos'}
              meta={`${visibles.length} gasto${visibles.length === 1 ? '' : 's'}`}
            >
              {categoria && (
                <Button variant="ghost" size="sm" onClick={() => setCategoria('')}>
                  Ver todas las categorías
                </Button>
              )}
            </SectionHeader>
            <div className="mb-3">
              <SearchInput
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar en el detalle"
                aria-label="Buscar gastos"
              />
            </div>
            {visibles.length === 0 ? (
              <EmptyState title="Ningún gasto coincide">Probá con otra palabra o quitá el filtro de categoría.</EmptyState>
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th className="hidden sm:table-cell">Fecha</Th>
                    <Th>Detalle</Th>
                    <Th className="hidden md:table-cell">Método</Th>
                    <Th num>Monto</Th>
                    <Th>
                      <span className="sr-only">Acciones</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((g) => (
                    <tr key={g.id} className={rowClass}>
                      <Td className="hidden whitespace-nowrap text-ink-2 sm:table-cell">{formatDate(g.fecha)}</Td>
                      <Td>
                        <p className="text-ink">{g.descripcion || labelCategoria(g.categoria)}</p>
                        <p className="mt-0.5 text-xs text-ink-3">
                          <span className="sm:hidden">{formatDate(g.fecha)} · </span>
                          {labelCategoria(g.categoria)}
                        </p>
                      </Td>
                      <Td className="hidden text-ink-3 md:table-cell">{METODO[g.metodo ?? ''] ?? '—'}</Td>
                      <Td num className="font-medium text-ink">
                        {formatMoney(g.monto)}
                      </Td>
                      <Td className="w-px py-2 pl-0">
                        <RowActions
                          que={`gasto del ${formatDate(g.fecha)}`}
                          onEditar={() => abrirEditar(g)}
                          onBorrar={() => borrar(g)}
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </section>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Editar gasto' : 'Registrar gasto'}>
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto" htmlFor="gasto-monto">
              <Input
                id="gasto-monto"
                type="number"
                inputMode="numeric"
                min={0}
                step="any"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                autoFocus
              />
            </Field>
            <Field label="Fecha" htmlFor="gasto-fecha">
              <Input
                id="gasto-fecha"
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </Field>
            <Field label="Categoría" htmlFor="gasto-cat">
              <Select
                id="gasto-cat"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value as CategoriaGasto })}
              >
                <option value="">Elegir</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.clave} value={c.clave}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Método" htmlFor="gasto-metodo">
              <Select id="gasto-metodo" value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value })}>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="otro">Otro</option>
              </Select>
            </Field>
          </div>
          <Field label="Detalle" hint="opcional" htmlFor="gasto-desc">
            <Input
              id="gasto-desc"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej: flete a Mendoza, 50 kg de hojas"
            />
          </Field>
          {error && <FormError>{error}</FormError>}
          <FormActions>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando…' : editId ? 'Guardar cambios' : 'Registrar gasto'}
            </Button>
          </FormActions>
        </form>
      </Modal>
    </>
  )
}

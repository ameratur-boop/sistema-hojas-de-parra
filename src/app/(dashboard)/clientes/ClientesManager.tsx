'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Cliente } from '@/lib/types'
import {
  Button,
  EmptyState,
  Field,
  FormActions,
  FormError,
  Input,
  PageHeader,
  RowActions,
  SearchInput,
  Segmented,
  Select,
  TableWrap,
  Td,
  Textarea,
  Th,
  linkClass,
  rowClass,
} from '@/components/ui'
import { Modal } from '@/components/Modal'
import { IconPlus } from '@/components/icons'
import { formatDate, formatMoney, formatNumber } from '@/lib/format'
import { crearCliente, editarCliente, eliminarCliente, type ClienteInput } from './actions'

export type FilaCliente = Cliente & {
  saldo: number
  ultimoPedido: string | null
  bolsas: { mayor: number; menor: number }
}

type Estado = 'todos' | 'deuda' | 'aldia'
type Orden = 'nombre' | 'bolsas' | 'deuda' | 'reciente'

const MINIMOS = [0, 50, 200, 500, 1000]
const vacio: ClienteInput = { nombre: '', telefono: '', email: '', direccion: '', notas: '' }
const totalBolsas = (f: FilaCliente) => f.bolsas.mayor + f.bolsas.menor

export function ClientesManager({ filas }: { filas: FilaCliente[] }) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState<Estado>('todos')
  const [minimo, setMinimo] = useState(0)
  const [orden, setOrden] = useState<Orden>('nombre')

  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ClienteInput>(vacio)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const conDeuda = filas.filter((f) => f.saldo > 0).length

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const digitos = q.replace(/\D/g, '')
    return filas
      .filter((f) => {
        if (q && !f.nombre.toLowerCase().includes(q) && !(digitos && f.telefono?.replace(/\D/g, '').includes(digitos))) {
          return false
        }
        if (estado === 'deuda' && f.saldo <= 0) return false
        if (estado === 'aldia' && f.saldo > 0) return false
        return totalBolsas(f) >= minimo
      })
      .sort((a, b) => {
        if (orden === 'bolsas') return totalBolsas(b) - totalBolsas(a)
        if (orden === 'deuda') return b.saldo - a.saldo
        if (orden === 'reciente') return (b.ultimoPedido ?? '').localeCompare(a.ultimoPedido ?? '')
        return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      })
  }, [filas, busqueda, estado, minimo, orden])

  const hayFiltros = busqueda.trim() !== '' || estado !== 'todos' || minimo > 0

  function abrirNuevo() {
    setEditId(null)
    setForm(vacio)
    setError(null)
    setOpen(true)
  }

  function abrirEditar(c: Cliente) {
    setEditId(c.id)
    setForm({
      nombre: c.nombre,
      telefono: c.telefono ?? '',
      email: c.email ?? '',
      direccion: c.direccion ?? '',
      notas: c.notas ?? '',
    })
    setError(null)
    setOpen(true)
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) return setError('El nombre es obligatorio.')
    start(async () => {
      const res = editId ? await editarCliente(editId, form) : await crearCliente(form)
      if (res.error) return setError(res.error)
      setOpen(false)
      router.refresh()
    })
  }

  function borrar(c: FilaCliente) {
    if (!confirm(`¿Eliminar a ${c.nombre}?`)) return
    start(async () => {
      const res = await eliminarCliente(c.id)
      if (res.error) alert(res.error)
      router.refresh()
    })
  }

  return (
    <>
      <PageHeader title="Clientes" meta={`${filas.length} clientes · ${conDeuda} con deuda`}>
        <Button onClick={abrirNuevo}>
          <IconPlus />
          Nuevo cliente
        </Button>
      </PageHeader>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o teléfono"
          aria-label="Buscar clientes"
        />
        <Segmented<Estado>
          label="Estado de cuenta"
          value={estado}
          onChange={setEstado}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'deuda', label: 'Con deuda' },
            { value: 'aldia', label: 'Al día' },
          ]}
        />
        <div className="flex w-full gap-2 sm:contents">
          <Select
            aria-label="Cantidad de bolsas compradas"
            value={minimo}
            onChange={(e) => setMinimo(Number(e.target.value))}
            className="min-w-0 flex-1 sm:w-auto sm:flex-none"
          >
            {MINIMOS.map((m) => (
              <option key={m} value={m}>
                {m === 0 ? 'Cualquier cantidad' : `Más de ${formatNumber(m)} bolsas`}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Ordenar"
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            className="min-w-0 flex-1 sm:ml-auto sm:w-auto sm:flex-none"
          >
            <option value="nombre">Orden: nombre</option>
            <option value="bolsas">Orden: más bolsas</option>
            <option value="deuda">Orden: mayor deuda</option>
            <option value="reciente">Orden: compra más reciente</option>
          </Select>
        </div>
      </div>

      {filas.length === 0 ? (
        <EmptyState title="Todavía no hay clientes">Creá el primero con “Nuevo cliente”.</EmptyState>
      ) : visibles.length === 0 ? (
        <EmptyState title="Ningún cliente coincide">
          <button
            type="button"
            className="font-medium text-accent hover:underline"
            onClick={() => {
              setBusqueda('')
              setEstado('todos')
              setMinimo(0)
            }}
          >
            Limpiar filtros
          </button>
        </EmptyState>
      ) : (
        <>
          {hayFiltros && (
            <p className="mb-2 text-[13px] text-ink-3">
              {visibles.length} de {filas.length} clientes
            </p>
          )}
          <TableWrap>
            <thead>
              <tr>
                <Th>Cliente</Th>
                <Th num className="hidden sm:table-cell">
                  Bolsas compradas
                </Th>
                <Th className="hidden md:table-cell">Último pedido</Th>
                <Th num>Saldo</Th>
                <Th>
                  <span className="sr-only">Acciones</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((c) => (
                <tr key={c.id} className={rowClass}>
                  <Td className="sm:min-w-44">
                    <Link href={`/clientes/${c.id}`} className={linkClass}>
                      {c.nombre}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-3">
                      {c.telefono}
                      <span className="sm:hidden">
                        {c.telefono && ' · '}
                        {formatNumber(totalBolsas(c))} bolsas
                      </span>
                    </p>
                  </Td>
                  <Td num className="hidden sm:table-cell">
                    <span className="font-medium text-ink">{formatNumber(totalBolsas(c))}</span>
                    {c.bolsas.menor > 0 && (
                      <p className="mt-0.5 text-xs text-ink-3">
                        {formatNumber(c.bolsas.mayor)} por mayor · {formatNumber(c.bolsas.menor)} por menor
                      </p>
                    )}
                  </Td>
                  <Td className="hidden whitespace-nowrap text-ink-3 md:table-cell">{formatDate(c.ultimoPedido)}</Td>
                  <Td num>
                    {c.saldo > 0 ? (
                      <span className="font-semibold text-danger">{formatMoney(c.saldo)}</span>
                    ) : c.saldo < 0 ? (
                      <span className="text-accent">{formatMoney(-c.saldo)} a favor</span>
                    ) : (
                      <span className="text-ink-3">Al día</span>
                    )}
                  </Td>
                  <Td className="w-px py-2 pl-0">
                    <RowActions que={c.nombre} onEditar={() => abrirEditar(c)} onBorrar={() => borrar(c)} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Editar cliente' : 'Nuevo cliente'}>
        <form onSubmit={guardar} className="space-y-4">
          <Field label="Nombre" htmlFor="cli-nombre">
            <Input
              id="cli-nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono" hint="opcional" htmlFor="cli-tel">
              <Input
                id="cli-tel"
                type="tel"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </Field>
            <Field label="Email" hint="opcional" htmlFor="cli-email">
              <Input
                id="cli-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Dirección" hint="opcional" htmlFor="cli-dir">
            <Input id="cli-dir" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </Field>
          <Field label="Notas" hint="opcional" htmlFor="cli-notas">
            <Textarea
              id="cli-notas"
              rows={2}
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
            />
          </Field>
          {error && <FormError>{error}</FormError>}
          <FormActions>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </FormActions>
        </form>
      </Modal>
    </>
  )
}

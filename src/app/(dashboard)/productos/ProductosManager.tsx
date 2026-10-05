'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Producto } from '@/lib/types'
import {
  Badge,
  Button,
  CanalTag,
  EmptyState,
  Field,
  FormActions,
  FormError,
  Input,
  PageHeader,
  RowActions,
  Select,
  TableWrap,
  Td,
  Th,
  rowClass,
} from '@/components/ui'
import { Modal } from '@/components/Modal'
import { IconPlus } from '@/components/icons'
import { formatMoney, formatNumber } from '@/lib/format'
import { clasificar, nombreBolsa, ordenarClases, type Canal } from '@/lib/productos'
import { crearProducto, editarProducto, eliminarProducto } from './actions'

type Form = { presentacion: string; canal: Canal; gramaje: string; precio: string; activo: boolean }

const vacio: Form = { presentacion: '', canal: 'mayor', gramaje: '', precio: '', activo: true }

export function ProductosManager({ productos }: { productos: Producto[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(vacio)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const filas = useMemo(
    () =>
      productos
        .map((p) => ({ ...p, ...clasificar(p.nombre) }))
        .sort((a, b) => Number(b.activo) - Number(a.activo) || ordenarClases(a, b)),
    [productos],
  )

  function abrirNuevo() {
    setEditId(null)
    setForm(vacio)
    setError(null)
    setOpen(true)
  }

  function abrirEditar(p: (typeof filas)[number]) {
    setEditId(p.id)
    setForm({
      presentacion: p.presentacion ? String(p.presentacion) : '',
      canal: p.canal,
      gramaje: p.gramaje ? String(p.gramaje) : '',
      precio: String(p.precio),
      activo: p.activo,
    })
    setError(null)
    setOpen(true)
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const data = {
      presentacion: Number(form.presentacion),
      canal: form.canal,
      gramaje: form.gramaje ? Number(form.gramaje) : null,
      precio: Number(form.precio) || 0,
      activo: form.activo,
    }
    start(async () => {
      const res = editId ? await editarProducto(editId, data) : await crearProducto(data)
      if (res.error) return setError(res.error)
      setOpen(false)
      router.refresh()
    })
  }

  function borrar(p: (typeof filas)[number]) {
    if (!confirm(`¿Eliminar ${nombreBolsa(p.presentacion)} ${p.canal === 'menor' ? 'por menor' : 'por mayor'}?`)) return
    start(async () => {
      const res = await eliminarProducto(p.id)
      if (res.error) alert(res.error)
      router.refresh()
    })
  }

  return (
    <>
      <PageHeader title="Productos" meta="Lista de precios por bolsa y canal de venta">
        <Button onClick={abrirNuevo}>
          <IconPlus />
          Nuevo producto
        </Button>
      </PageHeader>

      {filas.length === 0 ? (
        <EmptyState title="No hay productos cargados">Agregá cada bolsa con su precio por mayor y por menor.</EmptyState>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Bolsa</Th>
              <Th>Canal</Th>
              <Th num className="hidden sm:table-cell">
                Peso
              </Th>
              <Th num>Precio</Th>
              <Th className="hidden sm:table-cell">Estado</Th>
              <Th>
                <span className="sr-only">Acciones</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {filas.map((p) => (
              <tr key={p.id} className={`${rowClass} ${p.activo ? '' : 'opacity-60'}`}>
                <Td className="font-medium text-ink">
                  {nombreBolsa(p.presentacion)}
                  {p.presentacion && <span className="ml-1.5 font-normal text-ink-3">hojas</span>}
                  {!p.activo && (
                    <span className="ml-2 sm:hidden">
                      <Badge>Inactivo</Badge>
                    </span>
                  )}
                </Td>
                <Td>
                  <CanalTag canal={p.canal} />
                </Td>
                <Td num className="hidden text-ink-3 sm:table-cell">
                  {p.gramaje ? `${formatNumber(p.gramaje)} g` : '—'}
                </Td>
                <Td num className="font-medium text-ink">
                  {formatMoney(p.precio)}
                </Td>
                <Td className="hidden sm:table-cell">
                  {p.activo ? <Badge tone="accent">Activo</Badge> : <Badge>Inactivo</Badge>}
                </Td>
                <Td className="w-px py-2 pl-0">
                  <RowActions
                    que={`${nombreBolsa(p.presentacion)} ${p.canal === 'menor' ? 'por menor' : 'por mayor'}`}
                    onEditar={() => abrirEditar(p)}
                    onBorrar={() => borrar(p)}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Editar producto' : 'Nuevo producto'}>
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bolsa de" hint="hojas" htmlFor="prod-pres">
              <Input
                id="prod-pres"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="300"
                value={form.presentacion}
                onChange={(e) => setForm({ ...form, presentacion: e.target.value })}
                autoFocus
              />
            </Field>
            <Field label="Canal" htmlFor="prod-canal">
              <Select
                id="prod-canal"
                value={form.canal}
                onChange={(e) => setForm({ ...form, canal: e.target.value as Canal })}
              >
                <option value="mayor">Por mayor</option>
                <option value="menor">Por menor</option>
              </Select>
            </Field>
            <Field label="Precio" htmlFor="prod-precio">
              <Input
                id="prod-precio"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
              />
            </Field>
            <Field label="Peso" hint="gramos, opcional" htmlFor="prod-peso">
              <Input
                id="prod-peso"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.gramaje}
                onChange={(e) => setForm({ ...form, gramaje: e.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-ink-2">
            <input
              type="checkbox"
              className="size-4 accent-[oklch(0.53_0.12_150)]"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            Disponible para nuevos pedidos
          </label>
          {error && <FormError>{error}</FormError>}
          <FormActions>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </FormActions>
        </form>
      </Modal>
    </>
  )
}

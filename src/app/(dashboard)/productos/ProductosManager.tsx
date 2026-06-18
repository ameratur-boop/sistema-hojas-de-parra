'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Producto } from '@/lib/types'
import { Button, Input, Label, Badge, EmptyState } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { formatMoney } from '@/lib/format'
import { crearProducto, editarProducto, eliminarProducto, type ProductoInput } from './actions'

const vacio: ProductoInput = { nombre: '', gramaje: null, precio: 0, activo: true }

export function ProductosManager({ productos }: { productos: Producto[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductoInput>(vacio)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function abrirNuevo() {
    setEditId(null)
    setForm(vacio)
    setError(null)
    setOpen(true)
  }

  function abrirEditar(p: Producto) {
    setEditId(p.id)
    setForm({ nombre: p.nombre, gramaje: p.gramaje, precio: p.precio, activo: p.activo })
    setError(null)
    setOpen(true)
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) return setError('El nombre es obligatorio.')
    start(async () => {
      const res = editId ? await editarProducto(editId, form) : await crearProducto(form)
      if (res.error) return setError(res.error)
      setOpen(false)
      router.refresh()
    })
  }

  function borrar(p: Producto) {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    start(async () => {
      const res = await eliminarProducto(p.id)
      if (res.error) alert(res.error)
      router.refresh()
    })
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Productos</h1>
        <Button onClick={abrirNuevo}>+ Nuevo producto</Button>
      </div>

      {productos.length === 0 ? (
        <EmptyState>No hay productos cargados.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Gramaje</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{p.gramaje ? `${p.gramaje}g` : '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(p.precio)}</td>
                  <td className="px-4 py-3">
                    {p.activo ? <Badge color="green">Activo</Badge> : <Badge>Inactivo</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => abrirEditar(p)}
                      className="mr-3 text-slate-500 hover:text-emerald-700"
                    >
                      Editar
                    </button>
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

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Editar producto' : 'Nuevo producto'}>
        <form onSubmit={guardar} className="space-y-3">
          <div>
            <Label>Nombre *</Label>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Gramaje (g)</Label>
              <Input
                type="number"
                value={form.gramaje ?? ''}
                onChange={(e) => setForm({ ...form, gramaje: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div>
              <Label>Precio</Label>
              <Input
                type="number"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.activo ?? true}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            Activo
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

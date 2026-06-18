'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Cliente } from '@/lib/types'
import { Button, Input, Label, Textarea, EmptyState } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { crearCliente, editarCliente, eliminarCliente, type ClienteInput } from './actions'

const vacio: ClienteInput = { nombre: '', telefono: '', email: '', direccion: '', notas: '' }

export function ClientesManager({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ClienteInput>(vacio)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

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
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    start(async () => {
      const res = editId ? await editarCliente(editId, form) : await crearCliente(form)
      if (res.error) {
        setError(res.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  function borrar(c: Cliente) {
    if (!confirm(`¿Eliminar a "${c.nombre}"? Se borran sus pedidos y pagos.`)) return
    start(async () => {
      const res = await eliminarCliente(c.id)
      if (res.error) alert(res.error)
      router.refresh()
    })
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Clientes</h1>
        <Button onClick={abrirNuevo}>+ Nuevo cliente</Button>
      </div>

      {clientes.length === 0 ? (
        <EmptyState>Todavía no hay clientes. Creá el primero.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <Link href={`/clientes/${c.id}`} className="hover:text-emerald-700">
                      {c.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => abrirEditar(c)}
                      className="mr-3 text-slate-500 hover:text-emerald-700"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => borrar(c)}
                      className="text-slate-500 hover:text-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Editar cliente' : 'Nuevo cliente'}>
        <form onSubmit={guardar} className="space-y-3">
          <div>
            <Label>Nombre *</Label>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Teléfono</Label>
              <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Dirección</Label>
            <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </div>
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

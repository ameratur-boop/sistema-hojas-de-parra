'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Label } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { crearCliente } from '@/app/(dashboard)/clientes/actions'

// Alta rápida de cliente, manual (sin IA): solo el nombre es obligatorio,
// el teléfono es opcional.
export function NuevoClienteRapido() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!nombre.trim()) return setError('Poné al menos el nombre.')
    start(async () => {
      const res = await crearCliente({ nombre, telefono })
      if (res.error) return setError(res.error)
      setNombre('')
      setTelefono('')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + Cliente
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo cliente">
        <form onSubmit={guardar} className="space-y-3">
          <div>
            <Label>Nombre *</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Agrimpay"
              autoFocus
            />
          </div>
          <div>
            <Label>Teléfono (opcional)</Label>
            <Input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 1122334455"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
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

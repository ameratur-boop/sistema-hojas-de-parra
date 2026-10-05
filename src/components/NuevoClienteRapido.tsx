'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Field, FormActions, FormError, Input } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { IconPlus } from '@/components/icons'
import { crearCliente } from '@/app/(dashboard)/clientes/actions'

// Alta rápida: solo nombre y teléfono. La ficha completa se edita desde Clientes.
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
    if (!nombre.trim()) return setError('Escribí el nombre del cliente.')
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
        <IconPlus />
        Nuevo cliente
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo cliente">
        <form onSubmit={guardar} className="space-y-4">
          <Field label="Nombre" htmlFor="ncr-nombre">
            <Input id="ncr-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </Field>
          <Field label="Teléfono" hint="opcional" htmlFor="ncr-tel">
            <Input id="ncr-tel" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </Field>
          {error && <FormError>{error}</FormError>}
          <FormActions>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando…' : 'Crear cliente'}
            </Button>
          </FormActions>
        </form>
      </Modal>
    </>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Operacion } from '@/lib/interpret'
import { Button, Input } from '@/components/ui'
import { interpretarTexto, confirmarOperacion } from '@/app/(dashboard)/quick-actions'

const EJEMPLOS = [
  'Shawarmada 24x300 y 12x100',
  'Sukaria pagó 500 mil',
  'gasté 50 mil en flete',
  'saldo de Medaura',
  'quién debe',
]

export function QuickAdd() {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [pending, start] = useTransition()
  const [confirmacion, setConfirmacion] = useState<{ op: Operacion; resumen: string } | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function limpiar() {
    setConfirmacion(null)
    setInfo(null)
    setError(null)
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    limpiar()
    const t = texto.trim()
    if (!t) return
    start(async () => {
      const res = await interpretarTexto(t)
      if (res.kind === 'error') setError(res.mensaje)
      else if (res.kind === 'info') setInfo(res.mensaje)
      else setConfirmacion({ op: res.op, resumen: res.resumen })
    })
  }

  function confirmar() {
    if (!confirmacion) return
    start(async () => {
      const res = await confirmarOperacion(confirmacion.op)
      limpiar()
      setTexto('')
      setInfo(res.mensaje)
      router.refresh()
    })
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-[15px] font-semibold text-ink">Carga rápida</h2>
        <p className="text-[13px] text-ink-3">Pedidos, pagos, gastos o consultas, escritos como en WhatsApp</p>
      </div>

      <form onSubmit={enviar} className="flex gap-2">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Cliente, cantidades o monto"
          aria-label="Texto para la carga rápida"
        />
        <Button type="submit" disabled={pending || !texto.trim()}>
          {pending && !confirmacion ? 'Leyendo…' : 'Interpretar'}
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {EJEMPLOS.map((ej) => (
          <button
            key={ej}
            type="button"
            onClick={() => setTexto(ej)}
            className="h-8 rounded-md border border-line px-2.5 text-xs text-ink-3 transition-colors hover:border-ink-3/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            {ej}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      {info && (
        <p role="status" className="mt-4 whitespace-pre-wrap rounded-md bg-raised px-3 py-2.5 text-sm leading-relaxed text-ink-2">
          {info}
        </p>
      )}

      {confirmacion && (
        <div className="mt-4 rounded-md border border-accent/30 bg-accent/5 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{confirmacion.resumen}</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={confirmar} disabled={pending}>
              {pending ? 'Guardando…' : 'Confirmar y guardar'}
            </Button>
            <Button variant="ghost" onClick={limpiar} disabled={pending}>
              Descartar
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

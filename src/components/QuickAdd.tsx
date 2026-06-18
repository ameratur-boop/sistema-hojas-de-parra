'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Operacion } from '@/lib/interpret'
import { Button, Input } from '@/components/ui'
import { interpretarTexto, confirmarOperacion } from '@/app/(dashboard)/quick-actions'

const EJEMPLOS = [
  'Agrimpay pagó 500 mil',
  'nuevo cliente Juan tel 1122334455',
  'Agrimpay 24x300 y 24x100',
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
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">⚡</span>
        <h2 className="text-sm font-semibold text-slate-700">Carga rápida</h2>
        <span className="text-xs text-slate-400">escribí en lenguaje normal</span>
      </div>

      <form onSubmit={enviar} className="flex gap-2">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder='Ej: "Agrimpay pagó 500 mil"'
          className="bg-white"
        />
        <Button type="submit" disabled={pending || !texto.trim()}>
          {pending ? '…' : 'Enviar'}
        </Button>
      </form>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {EJEMPLOS.map((ej) => (
          <button
            key={ej}
            type="button"
            onClick={() => setTexto(ej)}
            className="rounded-full bg-white px-2.5 py-0.5 text-xs text-slate-500 hover:text-emerald-700"
          >
            {ej}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {info && (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
          {info}
        </pre>
      )}

      {confirmacion && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <pre className="whitespace-pre-wrap text-sm text-slate-700">{confirmacion.resumen}</pre>
          <div className="mt-3 flex gap-2">
            <Button onClick={confirmar} disabled={pending}>
              {pending ? 'Guardando…' : '✅ Confirmar'}
            </Button>
            <Button variant="secondary" onClick={limpiar} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

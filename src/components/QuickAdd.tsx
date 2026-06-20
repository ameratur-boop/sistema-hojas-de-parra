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
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">⚡</span>
        <h2 className="text-sm font-semibold text-slate-200">Carga rápida</h2>
        <span className="text-xs text-slate-500">escribí en lenguaje normal</span>
      </div>

      <form onSubmit={enviar} className="flex gap-2">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder='Ej: "Agrimpay pagó 500 mil"'
          className="bg-slate-800"
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
            className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400 hover:text-emerald-400"
          >
            {ej}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {info && (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200">
          {info}
        </pre>
      )}

      {confirmacion && (
        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800 p-3">
          <pre className="whitespace-pre-wrap text-sm text-slate-200">{confirmacion.resumen}</pre>
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

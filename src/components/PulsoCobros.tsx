'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Pulso } from '@/lib/pulso'
import { fechaAR, formatDate, formatMoney } from '@/lib/format'
import { etiqueta } from '@/lib/analytics'
import { linkClass } from '@/components/ui'

const INTERVALO_MS = 30_000

function haceCuanto(desde: string, ahora: number): string {
  const s = Math.max(0, Math.round((ahora - Date.parse(desde)) / 1000))
  if (s < 60) return 'recién'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86_400) return `hace ${Math.floor(s / 3600)} h`
  const dias = Math.floor(s / 86_400)
  return dias === 1 ? 'ayer' : `hace ${dias} días`
}

function variacion(actual: number, anterior: number) {
  if (anterior <= 0) return null
  const pct = Math.round(((actual - anterior) / anterior) * 100)
  return { pct, texto: `${pct > 0 ? '+' : ''}${pct}%` }
}

export function PulsoCobros({ inicial }: { inicial: Pulso }) {
  const router = useRouter()
  const [pulso, setPulso] = useState(inicial)
  const [ahora, setAhora] = useState<number | null>(null)
  const [conectado, setConectado] = useState(true)
  const [nuevos, setNuevos] = useState<Set<string>>(() => new Set())
  const vistos = useRef(new Set(inicial.ultimos.map((p) => p.id)))

  // Polling liviano: se pausa con la pestaña oculta y se pone al día al volver.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined

    async function actualizar() {
      try {
        const res = await fetch('/api/pulso', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const data = (await res.json()) as Pulso
        const recien = data.ultimos.filter((p) => !vistos.current.has(p.id)).map((p) => p.id)
        if (recien.length) {
          recien.forEach((id) => vistos.current.add(id))
          setNuevos(new Set(recien))
          router.refresh()
        }
        setPulso(data)
        setConectado(true)
        setAhora(Date.now())
      } catch {
        setConectado(false)
      }
    }

    function arrancar() {
      clearInterval(timer)
      timer = setInterval(actualizar, INTERVALO_MS)
    }
    function alCambiarVisibilidad() {
      if (document.hidden) return clearInterval(timer)
      actualizar()
      arrancar()
    }

    setAhora(Date.now())
    arrancar()
    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
    }
  }, [router])

  const vsMes = variacion(pulso.cobradoMes, pulso.mesAnteriorMismoDia)
  const maxDia = Math.max(...pulso.dias.map((d) => d.monto), 1)

  return (
    <section aria-labelledby="pulso-titulo" className="rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
        <h2 id="pulso-titulo" className="text-[15px] font-semibold text-ink">
          Pulso de cobranzas
        </h2>
        <p className="flex items-center gap-2 text-xs text-ink-3" aria-live="polite">
          <span className="relative flex size-2">
            {conectado && <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />}
            <span className={`relative inline-flex size-2 rounded-full ${conectado ? 'bg-accent' : 'bg-warn'}`} />
          </span>
          {conectado ? 'En vivo · se actualiza cada 30 s' : 'Sin conexión, reintentando'}
        </p>
      </div>

      <div className="grid gap-px bg-line xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="flex flex-col bg-surface px-4 py-4 sm:px-5">
          <dl className="grid grid-cols-3 gap-4">
            <div>
              <dt className="text-[13px] text-ink-3">Hoy</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatMoney(pulso.cobradoHoy)}</dd>
              <p className="mt-0.5 text-xs text-ink-3">
                {pulso.pagosHoy} pago{pulso.pagosHoy === 1 ? '' : 's'}
              </p>
            </div>
            <div>
              <dt className="text-[13px] text-ink-3">Esta semana</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatMoney(pulso.cobradoSemana)}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-3">Este mes</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatMoney(pulso.cobradoMes)}</dd>
              {vsMes && (
                <p className={`mt-0.5 text-xs ${vsMes.pct >= 0 ? 'text-accent' : 'text-danger'}`}>
                  {vsMes.texto} <span className="text-ink-3">vs. mes anterior al mismo día</span>
                </p>
              )}
            </div>
          </dl>

          <div className="mt-5 flex flex-1 flex-col">
            <p className="mb-2 text-xs text-ink-3">Cobrado por día, últimas 2 semanas</p>
            <ol className="flex min-h-16 flex-1 items-end gap-1" aria-label="Cobrado por día en las últimas dos semanas">
              {pulso.dias.map((d) => {
                const esHoy = d.fecha === pulso.hoy
                return (
                  <li
                    key={d.fecha}
                    className="group relative flex h-full flex-1 items-end"
                    title={`${etiqueta(d.fecha, 'dia', true)}: ${formatMoney(d.monto)}`}
                  >
                    <span className="sr-only">{`${etiqueta(d.fecha, 'dia', true)}: ${formatMoney(d.monto)}`}</span>
                    <span
                      aria-hidden
                      className={`w-full rounded-t-[3px] transition-colors ${
                        d.monto === 0 ? 'bg-line' : esHoy ? 'bg-accent' : 'bg-accent/45 group-hover:bg-accent/70'
                      }`}
                      style={{ height: d.monto === 0 ? 2 : `${Math.max(6, (d.monto / maxDia) * 100)}%` }}
                    />
                  </li>
                )
              })}
            </ol>
            <div className="mt-1.5 flex justify-between text-[11px] text-ink-3">
              <span>{etiqueta(pulso.dias[0].fecha, 'dia')}</span>
              <span>Hoy</span>
            </div>
          </div>
        </div>

        <div className="bg-surface px-4 py-4 sm:px-5">
          <p className="mb-2 text-[13px] text-ink-3">Últimos pagos</p>
          {pulso.ultimos.length === 0 ? (
            <p className="py-6 text-sm text-ink-3">Todavía no hay pagos registrados.</p>
          ) : (
            <ul className="divide-y divide-line/60">
              {pulso.ultimos.map((p) => (
                <li
                  key={p.id}
                  className={`-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 ${
                    nuevos.has(p.id) ? 'animate-[pago-nuevo_2.4s_ease-out]' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <Link href={`/clientes/${p.cliente_id}`} className={`block truncate text-sm ${linkClass}`}>
                      {p.cliente}
                    </Link>
                    <p className="text-xs text-ink-3">
                      {ahora ? `Cargado ${haceCuanto(p.created_at, ahora)}` : formatDate(p.fecha)}
                      {ahora && p.fecha !== fechaAR(p.created_at) && ` · fecha ${formatDate(p.fecha)}`}
                      {p.metodo ? ` · ${p.metodo}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-accent">{formatMoney(p.monto)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

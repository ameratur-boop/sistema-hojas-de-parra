'use client'

import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  Badge,
  EmptyState,
  PageHeader,
  Panel,
  SectionHeader,
  Segmented,
  TableWrap,
  Td,
  Th,
  rowClass,
} from '@/components/ui'
import { CANALES, CANAL_COLOR, CANAL_LABEL, nombreBolsa, type Canal } from '@/lib/productos'
import {
  etiqueta,
  periodos,
  resumirPorPeriodo,
  resumirPorProducto,
  VENTANA,
  type Cobro,
  type Granularidad,
  type Linea,
  type Periodo,
  type PorCanal,
} from '@/lib/analytics'
import { formatDate, formatMoney, formatMoneyCorto, formatNumber } from '@/lib/format'

type Metrica = 'monto' | 'bolsas'
type FiltroCanal = 'todos' | Canal
type Dato = { clave: string; label: string } & PorCanal

// Hex de los tokens (Recharts pinta SVG con colores literales)
const C = { superficie: '#161a18', linea: '#2a2f2c', tinta3: '#909793', elevado: '#1e2320' }

const TEXTO: Record<Granularidad, { unidad: string; ventana: string; anterior: string; detalle: string }> = {
  dia: { unidad: 'día', ventana: 'Últimos 30 días', anterior: 'los 30 días previos', detalle: 'Detalle por día' },
  semana: { unidad: 'semana', ventana: 'Últimas 12 semanas', anterior: 'las 12 semanas previas', detalle: 'Detalle por semana' },
  mes: { unidad: 'mes', ventana: 'Últimos 12 meses', anterior: 'los 12 meses previos', detalle: 'Detalle por mes' },
}

function totales(ps: Periodo[], canal: FiltroCanal) {
  const canales = canal === 'todos' ? CANALES : [canal]
  let ventas = 0
  let bolsas = 0
  let pedidos = 0
  let cobrado = 0
  for (const p of ps) {
    for (const c of canales) {
      ventas += p.monto[c]
      bolsas += p.bolsas[c]
    }
    pedidos += canal === 'todos' ? p.pedidos.todos : p.pedidos[canal]
    cobrado += p.cobrado
  }
  return { ventas, bolsas, pedidos, cobrado, ticket: pedidos ? ventas / pedidos : 0 }
}

function Delta({ actual, previo, anterior }: { actual: number; previo: number; anterior: string }) {
  if (previo <= 0) return <p className="mt-1 text-xs text-ink-3">Sin datos de {anterior}</p>
  const pct = Math.round(((actual - previo) / previo) * 100)
  return (
    <p className="mt-1 text-xs text-ink-3">
      <span className={pct > 0 ? 'text-accent' : pct < 0 ? 'text-danger' : ''}>
        {pct > 0 ? '+' : ''}
        {pct}%
      </span>{' '}
      vs. {anterior}
    </p>
  )
}

export function AnaliticasView({ lineas, cobros, hoy }: { lineas: Linea[]; cobros: Cobro[]; hoy: string }) {
  const [g, setG] = useState<Granularidad>('mes')
  const [metrica, setMetrica] = useState<Metrica>('monto')
  const [canal, setCanal] = useState<FiltroCanal>('todos')

  const { serie, previa, productos } = useMemo(() => {
    const n = VENTANA[g]
    const doble = periodos(hoy, g, n * 2)
    const claves = doble.slice(n)
    return {
      serie: resumirPorPeriodo(lineas, cobros, claves, g),
      previa: resumirPorPeriodo(lineas, cobros, doble.slice(0, n), g),
      productos: resumirPorProducto(lineas, claves, g),
    }
  }, [lineas, cobros, hoy, g])

  const t = TEXTO[g]
  const actual = totales(serie, canal)
  const prev = totales(previa, canal)
  const series = canal === 'todos' ? CANALES : [canal]
  const fmt = metrica === 'monto' ? formatMoney : formatNumber
  const valor = (x: PorCanal) => series.reduce((s, c) => s + x[c], 0)

  const datos: Dato[] = serie.map((p) => ({
    clave: p.clave,
    label: etiqueta(p.clave, g),
    ...(metrica === 'monto' ? p.monto : p.bolsas),
  }))
  const hayDatos = datos.some((d) => valor(d) > 0)

  const filasProducto = productos.map((p) => {
    const v = metrica === 'monto' ? p.monto : p.bolsas
    return { presentacion: p.presentacion, mayor: v.mayor, menor: v.menor, total: v.mayor + v.menor }
  })
  const totalProductos = filasProducto.reduce((s, f) => s + f.total, 0)
  const maxProducto = Math.max(...filasProducto.map((f) => f.total), 1)
  const tituloGrafico = `${metrica === 'monto' ? 'Ventas' : 'Bolsas vendidas'} por ${t.unidad}`

  return (
    <>
      <PageHeader title="Analíticas" meta={`${t.ventana} al ${formatDate(hoy)}`} />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Segmented<Granularidad>
          label="Agrupar por"
          value={g}
          onChange={setG}
          options={[
            { value: 'dia', label: 'Día' },
            { value: 'semana', label: 'Semana' },
            { value: 'mes', label: 'Mes' },
          ]}
        />
        <Segmented<Metrica>
          label="Medir en"
          value={metrica}
          onChange={setMetrica}
          options={[
            { value: 'monto', label: 'Plata' },
            { value: 'bolsas', label: 'Bolsas' },
          ]}
        />
        <Segmented<FiltroCanal>
          label="Canal de venta"
          value={canal}
          onChange={setCanal}
          options={[
            { value: 'todos', label: 'Todo' },
            { value: 'mayor', label: 'Por mayor' },
            { value: 'menor', label: 'Por menor' },
          ]}
        />
      </div>

      <dl className="mb-6 flex flex-wrap gap-px overflow-hidden rounded-lg border border-line bg-line">
        <div className="min-w-[9.5rem] flex-1 bg-surface px-4 py-4">
          <dt className="text-[13px] text-ink-3">Ventas</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatMoney(actual.ventas)}</dd>
          <Delta actual={actual.ventas} previo={prev.ventas} anterior={t.anterior} />
        </div>
        <div className="min-w-[9.5rem] flex-1 bg-surface px-4 py-4">
          <dt className="text-[13px] text-ink-3">Bolsas vendidas</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatNumber(actual.bolsas)}</dd>
          <Delta actual={actual.bolsas} previo={prev.bolsas} anterior={t.anterior} />
        </div>
        <div className="min-w-[9.5rem] flex-1 bg-surface px-4 py-4">
          <dt className="text-[13px] text-ink-3">Promedio por {t.unidad}</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatMoney(actual.ventas / VENTANA[g])}</dd>
          <p className="mt-1 text-xs text-ink-3">{formatNumber(actual.bolsas / VENTANA[g])} bolsas</p>
        </div>
        <div className="min-w-[9.5rem] flex-1 bg-surface px-4 py-4">
          <dt className="text-[13px] text-ink-3">Pedidos</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatNumber(actual.pedidos)}</dd>
          <p className="mt-1 text-xs text-ink-3">Ticket promedio {formatMoney(actual.ticket)}</p>
        </div>
        {canal === 'todos' && (
          <div className="min-w-[9.5rem] flex-1 bg-surface px-4 py-4">
            <dt className="text-[13px] text-ink-3">Cobrado</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatMoney(actual.cobrado)}</dd>
            <Delta actual={actual.cobrado} previo={prev.cobrado} anterior={t.anterior} />
          </div>
        )}
      </dl>

      <Panel className="mb-8 px-4 pb-3 pt-4 sm:px-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h2 className="text-[15px] font-semibold text-ink">{tituloGrafico}</h2>
          {series.length > 1 && (
            <ul className="flex gap-4 text-xs text-ink-2" aria-label="Referencias">
              {series.map((c) => (
                <li key={c} className="flex items-center gap-1.5">
                  <span aria-hidden className="size-2.5 rounded-sm" style={{ background: CANAL_COLOR[c] }} />
                  {CANAL_LABEL[c]}
                </li>
              ))}
            </ul>
          )}
        </div>
        {hayDatos ? (
          <figure className="h-72" aria-label={`${tituloGrafico}. El detalle está en la tabla de abajo.`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="22%">
                <CartesianGrid vertical={false} stroke={C.linea} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: C.tinta3, fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: C.linea }}
                  interval="preserveStartEnd"
                  minTickGap={10}
                />
                <YAxis
                  width={metrica === 'monto' ? 72 : 48}
                  tick={{ fill: C.tinta3, fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => (metrica === 'monto' ? formatMoneyCorto(v) : formatNumber(v))}
                />
                <Tooltip
                  cursor={{ fill: C.elevado, opacity: 0.7 }}
                  isAnimationActive={false}
                  content={({ active, payload }) => {
                    const d = payload?.[0]?.payload as Dato | undefined
                    if (!active || !d) return null
                    return (
                      <div className="min-w-44 rounded-md border border-line bg-raised px-3 py-2 text-xs shadow-lg shadow-black/40">
                        <p className="mb-1.5 font-medium text-ink">{etiqueta(d.clave, g, true)}</p>
                        {series.map((c) => (
                          <p key={c} className="flex items-center justify-between gap-6 py-0.5">
                            <span className="flex items-center gap-1.5 text-ink-2">
                              <span aria-hidden className="size-2 rounded-sm" style={{ background: CANAL_COLOR[c] }} />
                              {CANAL_LABEL[c]}
                            </span>
                            <span className="tabular-nums text-ink">{fmt(d[c])}</span>
                          </p>
                        ))}
                        {series.length > 1 && (
                          <p className="mt-1 flex justify-between border-t border-line pt-1.5 font-medium text-ink">
                            <span>Total</span>
                            <span className="tabular-nums">{fmt(d.mayor + d.menor)}</span>
                          </p>
                        )}
                      </div>
                    )
                  }}
                />
                {series.map((c, i) => (
                  <Bar
                    key={c}
                    dataKey={c}
                    name={CANAL_LABEL[c]}
                    stackId="ventas"
                    fill={CANAL_COLOR[c]}
                    stroke={C.superficie}
                    strokeWidth={series.length > 1 ? 2 : 0}
                    maxBarSize={28}
                    radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                    animationDuration={250}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </figure>
        ) : (
          <EmptyState title="Sin ventas en este período">Cambiá la agrupación para ver un rango más largo.</EmptyState>
        )}
      </Panel>

      <section className="mb-8">
        <SectionHeader
          title="Por bolsa"
          meta={`${metrica === 'monto' ? 'Ventas' : 'Bolsas'} en ${t.ventana.toLowerCase()}, separadas por canal`}
        />
        {filasProducto.length === 0 ? (
          <EmptyState title="Sin ventas en este período" />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Bolsa</Th>
                <Th num>Por mayor</Th>
                <Th num>Por menor</Th>
                <Th num>Total</Th>
                <Th className="w-[34%] min-w-40">Participación</Th>
              </tr>
            </thead>
            <tbody>
              {filasProducto.map((f) => (
                <tr key={String(f.presentacion)} className={rowClass}>
                  <Td className="whitespace-nowrap font-medium text-ink">{nombreBolsa(f.presentacion)}</Td>
                  <Td num className="text-ink-2">{fmt(f.mayor)}</Td>
                  <Td num className={f.menor ? 'text-ink-2' : 'text-ink-3'}>{f.menor ? fmt(f.menor) : '—'}</Td>
                  <Td num className="font-medium text-ink">{fmt(f.total)}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-2 flex-1 gap-0.5 overflow-hidden rounded-sm bg-raised" aria-hidden>
                        {CANALES.map((c) =>
                          f[c] > 0 ? (
                            <span
                              key={c}
                              className="h-full first:rounded-l-sm last:rounded-r-sm"
                              style={{ width: `${(f[c] / maxProducto) * 100}%`, background: CANAL_COLOR[c] }}
                            />
                          ) : null,
                        )}
                      </div>
                      <span className="w-10 text-right text-xs tabular-nums text-ink-3">
                        {Math.round((f.total / (totalProductos || 1)) * 100)}%
                      </span>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line bg-side/50 font-medium">
                <Td className="text-ink">Total</Td>
                <Td num className="text-ink">
                  {fmt(filasProducto.reduce((s, f) => s + f.mayor, 0))}
                </Td>
                <Td num className="text-ink">
                  {fmt(filasProducto.reduce((s, f) => s + f.menor, 0))}
                </Td>
                <Td num className="text-ink">{fmt(totalProductos)}</Td>
                <Td className="text-xs font-normal text-ink-3">
                  {CANALES.map((c) => {
                    const v = filasProducto.reduce((s, f) => s + f[c], 0)
                    return `${CANAL_LABEL[c]} ${Math.round((v / (totalProductos || 1)) * 100)}%`
                  }).join(' · ')}
                </Td>
              </tr>
            </tfoot>
          </TableWrap>
        )}
      </section>

      <section>
        <SectionHeader title={t.detalle} meta={canal === 'todos' ? undefined : CANAL_LABEL[canal]} />
        <TableWrap>
          <thead>
            <tr>
              <Th>{t.unidad[0].toUpperCase() + t.unidad.slice(1)}</Th>
              <Th num>Pedidos</Th>
              <Th num>Bolsas</Th>
              <Th num>Ventas</Th>
              {canal === 'todos' && <Th num>Cobrado</Th>}
            </tr>
          </thead>
          <tbody>
            {[...serie].reverse().map((p, i) => {
              const tot = totales([p], canal)
              const vacio = tot.ventas === 0 && tot.cobrado === 0
              return (
                <tr key={p.clave} className={`${rowClass} ${vacio ? 'text-ink-3' : ''}`}>
                  <Td className="whitespace-nowrap">
                    <span className={vacio ? '' : 'text-ink'}>{etiqueta(p.clave, g, true)}</span>
                    {i === 0 && (
                      <span className="ml-2">
                        <Badge>En curso</Badge>
                      </span>
                    )}
                  </Td>
                  <Td num>{tot.pedidos ? formatNumber(tot.pedidos) : '—'}</Td>
                  <Td num>{tot.bolsas ? formatNumber(tot.bolsas) : '—'}</Td>
                  <Td num className={vacio ? '' : 'font-medium text-ink'}>
                    {tot.ventas ? formatMoney(tot.ventas) : '—'}
                  </Td>
                  {canal === 'todos' && (
                    <Td num className={tot.cobrado ? 'text-accent' : ''}>
                      {tot.cobrado ? formatMoney(tot.cobrado) : '—'}
                    </Td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </TableWrap>
      </section>
    </>
  )
}

'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardBody, CardHeader, CardTitle, EmptyState } from '@/components/ui'
import { formatMoney } from '@/lib/format'

export type PuntoMes = { label: string; ventas: number; cobranzas: number }
export type TopProducto = { descripcion: string; cantidad: number; monto: number }

export function ReportesView({
  facturado,
  cobrado,
  adeudado,
  porMes,
  topProductos,
}: {
  facturado: number
  cobrado: number
  adeudado: number
  porMes: PuntoMes[]
  topProductos: TopProducto[]
}) {
  return (
    <>
      <h1 className="mb-5 text-xl font-bold text-slate-100">Reportes</h1>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardBody className="pt-5">
            <p className="text-sm text-slate-400">Facturado</p>
            <p className="text-xl font-bold text-slate-100">{formatMoney(facturado)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <p className="text-sm text-slate-400">Cobrado</p>
            <p className="text-xl font-bold text-emerald-400">{formatMoney(cobrado)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <p className="text-sm text-slate-400">Por cobrar</p>
            <p className="text-xl font-bold text-red-400">{formatMoney(adeudado)}</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ventas y cobranzas por mes</CardTitle>
        </CardHeader>
        <CardBody>
          {porMes.length === 0 ? (
            <EmptyState>Sin datos todavía.</EmptyState>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" fontSize={12} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                  <YAxis
                    fontSize={12}
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(v) => formatMoney(Number(v))}
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    cursor={{ fill: '#334155', opacity: 0.3 }}
                  />
                  <Legend wrapperStyle={{ color: '#94a3b8' }} />
                  <Bar dataKey="ventas" name="Ventas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cobranzas" name="Cobranzas" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Productos más vendidos</CardTitle>
        </CardHeader>
        <CardBody>
          {topProductos.length === 0 ? (
            <EmptyState>Sin datos todavía.</EmptyState>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400">
                <tr>
                  <th className="py-2 font-medium">Producto</th>
                  <th className="py-2 text-right font-medium">Cantidad</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {topProductos.map((t) => (
                  <tr key={t.descripcion}>
                    <td className="py-2 text-slate-200">{t.descripcion}</td>
                    <td className="py-2 text-right text-slate-300">{t.cantidad}</td>
                    <td className="py-2 text-right font-medium">{formatMoney(t.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </>
  )
}

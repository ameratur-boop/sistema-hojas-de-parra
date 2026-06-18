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
      <h1 className="mb-5 text-xl font-bold text-slate-800">Reportes</h1>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardBody className="pt-5">
            <p className="text-sm text-slate-500">Facturado</p>
            <p className="text-xl font-bold text-slate-800">{formatMoney(facturado)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <p className="text-sm text-slate-500">Cobrado</p>
            <p className="text-xl font-bold text-emerald-600">{formatMoney(cobrado)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <p className="text-sm text-slate-500">Por cobrar</p>
            <p className="text-xl font-bold text-red-600">{formatMoney(adeudado)}</p>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v) => formatMoney(Number(v))} />
                  <Legend />
                  <Bar dataKey="ventas" name="Ventas" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cobranzas" name="Cobranzas" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
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
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Producto</th>
                  <th className="py-2 text-right font-medium">Cantidad</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProductos.map((t) => (
                  <tr key={t.descripcion}>
                    <td className="py-2 text-slate-700">{t.descripcion}</td>
                    <td className="py-2 text-right text-slate-600">{t.cantidad}</td>
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

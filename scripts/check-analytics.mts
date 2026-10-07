// npm run check
import assert from 'node:assert/strict'
import { clasificar, clasificarItem } from '../src/lib/productos.ts'
import { inicioPeriodo, periodos, resumirPorPeriodo, resumirPorProducto, type Linea } from '../src/lib/analytics.ts'

for (const t of ['300g', 'bolsa 300', 'bolsa 300 hojas', 'BOLSAS DE 300', 'bolsa 300 X MAYOR', 'Hojas de parra 300g']) {
  assert.deepEqual(clasificar(t), { presentacion: 300, canal: 'mayor' }, t)
}
assert.deepEqual(clasificar('bolsa 300 x menor'), { presentacion: 300, canal: 'menor' })
assert.deepEqual(clasificarItem({ descripcion: 'bolsa 300 hojas', producto: 'bolsa 300 x menor' }), { presentacion: 300, canal: 'menor' })
assert.deepEqual(clasificarItem({ descripcion: 'Hojas de parra 100g', producto: null }), { presentacion: 100, canal: 'mayor' })

assert.equal(inicioPeriodo('2026-10-05', 'semana'), '2026-10-05') // lunes
assert.equal(inicioPeriodo('2026-10-04', 'semana'), '2026-09-28') // domingo -> lunes anterior
assert.equal(inicioPeriodo('2026-10-05', 'mes'), '2026-10-01')
assert.deepEqual(periodos('2026-01-15', 'mes', 3), ['2025-11-01', '2025-12-01', '2026-01-01'])
assert.deepEqual(periodos('2026-03-01', 'dia', 2), ['2026-02-28', '2026-03-01'])

const lineas: Linea[] = [
  { fecha: '2026-09-29', pedidoId: 'a', presentacion: 300, canal: 'mayor', cantidad: 24, monto: 600000 },
  { fecha: '2026-09-29', pedidoId: 'a', presentacion: 100, canal: 'mayor', cantidad: 10, monto: 100000 },
  { fecha: '2026-10-02', pedidoId: 'b', presentacion: 300, canal: 'menor', cantidad: 2, monto: 80000 },
  { fecha: '2026-08-01', pedidoId: 'c', presentacion: 300, canal: 'mayor', cantidad: 99, monto: 1 },
]
const claves = periodos('2026-10-05', 'semana', 2)
const [sem1, sem2] = resumirPorPeriodo(lineas, [{ fecha: '2026-10-05', monto: 50000 }], claves, 'semana')
assert.deepEqual(sem1.bolsas, { mayor: 34, menor: 2 })
assert.deepEqual(sem1.pedidos, { mayor: 1, menor: 1, todos: 2 })
assert.equal(sem2.cobrado, 50000)
const gastos = [{ fecha: '2026-09-28', monto: 30000 }, { fecha: '2026-10-04', monto: 5000 }, { fecha: '2026-08-01', monto: 1 }]
const conGastos = resumirPorPeriodo(lineas, [], claves, 'semana', gastos)
assert.deepEqual(conGastos.map((p) => p.gastado), [35000, 0])
const prod = resumirPorProducto(lineas, claves, 'semana')
assert.deepEqual(prod.map((p) => p.presentacion), [300, 100])
assert.deepEqual(prod[0].bolsas, { mayor: 24, menor: 2 })

console.log('ok')

// Helpers de formato (moneda y fechas en formato argentino)

export function formatMoney(n: number | null | undefined): string {
  const v = Number(n ?? 0)
  return v.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  // d viene como 'YYYY-MM-DD'; evitar corrimiento de zona horaria
  const [y, m, day] = d.slice(0, 10).split('-')
  if (!y || !m || !day) return d
  return `${day}/${m}/${y}`
}

// Días transcurridos desde una fecha 'YYYY-MM-DD' hasta hoy
export function diasDesde(d: string | null | undefined): number | null {
  if (!d) return null
  const fecha = new Date(d.slice(0, 10) + 'T00:00:00')
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const ms = hoy.getTime() - fecha.getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}

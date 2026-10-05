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

export function formatNumber(n: number | null | undefined): string {
  return Number(n ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

// $ 1,2 M · $ 850 mil: para ejes de gráficos
export function formatMoneyCorto(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$ ${(n / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M`
  if (Math.abs(n) >= 1_000) return `$ ${Math.round(n / 1_000)} mil`
  return `$ ${n}`
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  // d viene como 'YYYY-MM-DD'; evitar corrimiento de zona horaria
  const [y, m, day] = d.slice(0, 10).split('-')
  if (!y || !m || !day) return d
  return `${day}/${m}/${y}`
}

const fmtAR = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

// Fecha en Argentina ('YYYY-MM-DD'). toISOString() da UTC: después de las 21 h ya es mañana.
export function fechaAR(instante: string | number | Date): string {
  return fmtAR.format(new Date(instante))
}

export function hoyAR(): string {
  return fechaAR(Date.now())
}

// Días transcurridos desde una fecha 'YYYY-MM-DD' hasta hoy
export function diasDesde(d: string | null | undefined): number | null {
  if (!d) return null
  const ms = Date.parse(hoyAR()) - Date.parse(d.slice(0, 10))
  return Math.max(0, Math.floor(ms / 86_400_000))
}

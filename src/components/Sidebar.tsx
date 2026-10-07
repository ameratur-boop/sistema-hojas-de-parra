'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconAnaliticas,
  IconClientes,
  IconGastos,
  IconInicio,
  IconPedidos,
  IconProductos,
} from '@/components/icons'

const NAV = [
  { href: '/', label: 'Inicio', Icon: IconInicio },
  { href: '/pedidos', label: 'Pedidos', Icon: IconPedidos },
  { href: '/clientes', label: 'Clientes', Icon: IconClientes },
  { href: '/gastos', label: 'Gastos', Icon: IconGastos },
  { href: '/productos', label: 'Productos', Icon: IconProductos },
  { href: '/analiticas', label: 'Analíticas', Icon: IconAnaliticas },
]

export function Sidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <aside className="sticky top-0 z-20 shrink-0 border-b border-line bg-side md:h-screen md:w-56 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2.5 px-4 pt-3 md:px-5 md:pb-6 md:pt-6">
        <span
          aria-hidden
          className="grid size-7 place-items-center rounded-md bg-accent-strong text-[13px] font-bold text-white"
        >
          B
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink">Baladi</p>
          <p className="text-xs text-ink-3">Hojas de parra</p>
        </div>
      </div>
      <nav
        aria-label="Principal"
        className="flex gap-1 overflow-x-auto px-2 py-2 [scrollbar-width:none] md:flex-col md:px-3 md:py-0"
      >
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex h-10 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 md:h-9 ${
                active ? 'bg-raised text-ink' : 'text-ink-3 hover:bg-raised/60 hover:text-ink'
              }`}
            >
              <Icon className={active ? 'text-accent' : ''} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

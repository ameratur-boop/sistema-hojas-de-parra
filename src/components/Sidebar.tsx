'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Inicio', icon: '🏠' },
  { href: '/pedidos', label: 'Pedidos', icon: '📋' },
  { href: '/clientes', label: 'Clientes', icon: '👤' },
  { href: '/productos', label: 'Productos', icon: '🍃' },
  { href: '/reportes', label: 'Reportes', icon: '📊' },
]

export function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-700 bg-slate-800">
      <div className="px-5 py-5">
        <p className="text-lg font-bold text-slate-100">Baladi</p>
        <p className="text-xs text-slate-500">Hojas de parra</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive(item.href)
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-700 px-5 py-4">
        <p className="text-xs text-slate-500">Sistema Baladi</p>
      </div>
    </aside>
  )
}

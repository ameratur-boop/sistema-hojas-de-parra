'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/', label: 'Morosos', icon: '⚠️' },
  { href: '/pedidos', label: 'Pedidos', icon: '📋' },
  { href: '/clientes', label: 'Clientes', icon: '👤' },
  { href: '/productos', label: 'Productos', icon: '🍃' },
  { href: '/reportes', label: 'Reportes', icon: '📊' },
]

export function Sidebar({ email }: { email: string | null }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-5">
        <p className="text-lg font-bold text-slate-800">Samir</p>
        <p className="text-xs text-slate-400">Hojas de parra</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive(item.href)
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-200 px-3 py-3">
        <p className="truncate px-3 pb-2 text-xs text-slate-400">{email}</p>
        <button
          onClick={logout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

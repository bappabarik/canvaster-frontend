import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '⬛' },
  { to: '/templates', label: 'Templates',  icon: '🖼' },
  { to: '/projects',  label: 'Projects',   icon: '📁' },
  { to: '/assets',    label: 'Assets',     icon: '🗂' },
  { to: '/pricing',   label: 'Pricing',    icon: '💳' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const NavLinks = () => (
    <>
      {navItems.map(item => (
        <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`
          }>
          <span className="text-base">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 lg:relative lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-brand-600">BDP</span>
            <span className="text-xs text-gray-400 ml-1">Bulk Design</span>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-gray-600 p-1" onClick={() => setOpen(false)}>✕</button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"><NavLinks /></nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.credits ?? 0} credits</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary w-full text-xs py-1.5">Sign out</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-brand-600">BDP</span>
          <div className="ml-auto text-xs text-gray-400">{user?.credits ?? 0} credits</div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  ArrowLeftRight,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  Sun,
  Target,
  Wallet,
  X
} from 'lucide-react'
import { Dialog, DialogPanel } from '@headlessui/react'
import ChatWidget from './ChatWidget.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

const COLLAPSE_KEY = 'finanzasapp-sidebar-collapsed'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transacciones', label: 'Transacciones', icon: ArrowLeftRight },
  { to: '/presupuestos', label: 'Presupuestos', icon: PiggyBank },
  { to: '/metas', label: 'Metas', icon: Target }
]

const navLinkClass = ({ isActive }, collapsed) =>
  `flex items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
    collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'
  } ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`

const SidebarContent = ({ collapsed, onNavigate }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <div>
        <div className={`mb-6 flex items-center gap-2 ${collapsed ? 'justify-center' : 'px-1'}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Wallet size={18} aria-hidden="true" />
          </span>
          {!collapsed && (
            <h1 className="text-lg font-bold text-white">FinanzasApp</h1>
          )}
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} title={collapsed ? label : undefined} className={(props) => navLinkClass(props, collapsed)} onClick={onNavigate}>
              <Icon size={18} aria-hidden="true" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="space-y-2">
        {!collapsed && (
          <p className="px-1 text-sm text-slate-300">{user?.username}</p>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          {!collapsed && (theme === 'dark' ? 'Modo claro' : 'Modo oscuro')}
        </button>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <LogOut size={16} aria-hidden="true" />
          {!collapsed && 'Cerrar sesión'}
        </button>
      </div>
    </>
  )
}

SidebarContent.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  onNavigate: PropTypes.func
}

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === 'true'
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const toggleCollapsed = () =>
    setCollapsed((current) => {
      const next = !current
      localStorage.setItem(COLLAPSE_KEY, String(next))
      return next
    })

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col justify-between border-r border-slate-800 bg-slate-900 p-4 transition-all md:flex ${
          collapsed ? 'w-[4.5rem]' : 'w-64'
        }`}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {collapsed ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
          {!collapsed && 'Colapsar menú'}
        </button>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Wallet size={18} aria-hidden="true" />
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">FinanzasApp</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú de navegación"
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </header>

      <Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} className="relative z-50 md:hidden">
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-y-0 left-0 flex w-64 max-w-[80%]">
          <DialogPanel className="flex h-full w-full flex-col justify-between bg-slate-900 p-4 shadow-xl">
            <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú de navegación"
              className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </DialogPanel>
        </div>
      </Dialog>

      <main
        className={`min-w-0 flex-1 p-4 pt-6 md:p-8 ${
          collapsed ? 'md:pl-[6rem]' : 'md:pl-[17.5rem]'
        }`}
      >
        <Outlet />
      </main>

      <button
        type="button"
        onClick={() => setChatOpen(true)}
        title="Abrir asistente financiero"
        aria-label="Abrir asistente financiero"
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 md:bottom-6 dark:bg-indigo-600 dark:hover:bg-indigo-500"
      >
        <MessageCircle size={24} aria-hidden="true" />
      </button>

      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}

export default AppLayout

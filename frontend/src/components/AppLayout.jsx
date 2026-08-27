import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  ArrowLeftRight,
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  Settings,
  Sun,
  Target,
  Wallet,
  X
} from 'lucide-react'
import { Dialog, DialogPanel } from '@headlessui/react'
import ChatWidget from './ChatWidget.jsx'
import PeriodSelector from './PeriodSelector.jsx'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

const COLLAPSE_KEY = 'finanzasapp-sidebar-collapsed'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/transacciones', label: 'Transacciones', icon: ArrowLeftRight },
  { to: '/presupuestos', label: 'Presupuestos', icon: PiggyBank },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/alertas', label: 'Alertas', icon: Bell },
  { to: '/configuracion', label: 'Configuración', icon: Settings }
]

const UnreadAlertsCount = ({ compact }) => {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const token = api.getToken()

        if (!token) {
          return
        }

        const alerts = await api.listAlerts(token)

        if (active) {
          setUnread(alerts.filter((alert) => !alert.read).length)
        }
      } catch {
        /* el badge se actualiza en el próximo evento */
      }
    }

    load()
    window.addEventListener('alerts-updated', load)

    return () => {
      active = false
      window.removeEventListener('alerts-updated', load)
    }
  }, [])

  if (unread === 0) {
    return null
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-[#E11D48] font-semibold text-white ${
        compact ? 'absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px]' : 'ml-auto min-w-5 px-1.5 text-xs'
      }`}
    >
      {unread > 9 ? '9+' : unread}
    </span>
  )
}

UnreadAlertsCount.propTypes = {
  compact: PropTypes.bool
}

UnreadAlertsCount.defaultProps = {
  compact: false
}

const navLinkClass = ({ isActive }, collapsed) =>
  `relative flex items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] ${
    collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2.5'
  } ${isActive ? 'bg-[#0e9f6e] text-white shadow-sm' : 'text-[#3d4a42] hover:bg-[#eff5ef] hover:text-[#171d19] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`

const SidebarContent = ({ collapsed, onNavigate }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <div>
        <div className={`mb-6 flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-1'}`}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0e9f6e] text-white">
            <Wallet size={20} aria-hidden="true" />
          </span>
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-[20px] font-bold tracking-tight text-[#0e9f6e]">FINANZASAPP</span>
              <span className="text-[12px] font-normal text-[#64748B]">control financiero</span>
            </div>
          )}
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} title={collapsed ? label : undefined} className={(props) => navLinkClass(props, collapsed)} onClick={onNavigate}>
              <span className="relative">
                <Icon size={18} aria-hidden="true" />
                {to === '/alertas' && collapsed && <UnreadAlertsCount compact />}
              </span>
              {!collapsed && (
                <>
                  {label}
                  {to === '/alertas' && <UnreadAlertsCount />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        {!collapsed && (
          <div className="mt-6 border-t border-[#E2E8F0] pt-4 dark:border-slate-800">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-slate-400">
              Período
            </p>
            <PeriodSelector />
          </div>
        )}
      </div>
      <div className="space-y-2">
        {!collapsed && (
          <p className="px-1 text-sm text-[#3d4a42] dark:text-slate-300">{user?.username}</p>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#3d4a42] transition-colors hover:bg-[#eff5ef] hover:text-[#171d19] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
        >
          {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          {!collapsed && (theme === 'dark' ? 'Modo claro' : 'Modo oscuro')}
        </button>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0e9f6e] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0a7a53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e]"
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
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col justify-between border-r border-[#E2E8F0] bg-[#f5fbf4]/80 p-4 backdrop-blur transition-all md:flex dark:border-slate-800 dark:bg-slate-900 ${
          collapsed ? 'w-[4.5rem]' : 'w-64'
        }`}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#eff5ef] hover:text-[#171d19] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {collapsed ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
          {!collapsed && 'Colapsar menú'}
        </button>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E2E8F0] bg-white/80 px-4 py-3 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0e9f6e] text-white">
            <Wallet size={18} aria-hidden="true" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-[16px] font-bold tracking-tight text-[#0e9f6e]">FINANZASAPP</span>
            <span className="text-[10px] text-[#64748B]">control financiero</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú de navegación"
            className="rounded-lg p-2 text-[#3d4a42] transition-colors hover:bg-[#eff5ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </header>

      <Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} className="relative z-50 md:hidden">
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-y-0 left-0 flex w-64 max-w-[80%]">
          <DialogPanel className="flex h-full w-full flex-col justify-between bg-[#f5fbf4] p-4 shadow-xl dark:bg-slate-900">
            <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú de navegación"
              className="absolute right-3 top-3 rounded-lg p-2 text-[#64748B] transition-colors hover:bg-[#eff5ef] hover:text-[#171d19] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
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
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0e9f6e] text-white shadow-lg transition-colors hover:bg-[#0a7a53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] md:bottom-6"
      >
        <MessageCircle size={24} aria-hidden="true" />
      </button>

      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}

export default AppLayout

import { useState } from 'react'
import PropTypes from 'prop-types'
import { LogOut, Moon, Sun, Shield, Bell, User, Clock, DollarSign } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useToast } from '../components/ui/ToastProvider.jsx'

const Toggle = ({ enabled, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] ${enabled ? 'bg-[#0e9f6e]' : 'bg-[#E2E8F0]'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : 'translate-x-1'}`}
    />
  </button>
)

Toggle.propTypes = {
  enabled: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired
}

const ConfigPage = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const toast = useToast()
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(false)
  const [weeklyDigest, setWeeklyDigest] = useState(true)

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Configuración" subtitle="Administrá tu cuenta y preferencias" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#64748B]">Perfil</h2>
            <div className="flex items-center gap-4">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username ?? 'Usuario')}&background=0e9f6e&color=fff`}
                alt="Avatar"
                className="h-14 w-14 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="text-base font-semibold text-[#171d19] dark:text-white">{user?.username}</p>
                <p className="text-sm text-[#64748B] dark:text-slate-400">{user?.email ?? 'usuario@ejemplo.com'}</p>
              </div>
              <button
                type="button"
                onClick={() => toast.showSuccess('Función no implementada')}
                className="ml-auto rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm font-medium text-[#3d4a42] hover:bg-[#eff5ef] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Editar perfil
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#64748B]">Cuenta</h2>
            <ul className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
              <li className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-sm text-[#3d4a42] dark:text-slate-300">
                  <User size={16} /> Cambiar contraseña
                </span>
                <button type="button" onClick={() => toast.showSuccess('Función no implementada')} className="text-sm font-medium text-[#0e9f6e] hover:underline">
                  ›
                </button>
              </li>
              <li className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-sm text-[#3d4a42] dark:text-slate-300">
                  <DollarSign size={16} /> Preferencias de moneda
                </span>
                <span className="text-sm text-[#64748B]">USD ($) ›</span>
              </li>
              <li className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-sm text-[#3d4a42] dark:text-slate-300">
                  <Clock size={16} /> Zona horaria
                </span>
                <span className="text-sm text-[#64748B]">GMT-3 (Buenos Aires) ›</span>
              </li>
              <li className="flex items-center justify-between py-3">
                <button type="button" onClick={logout} className="flex items-center gap-2 text-sm font-medium text-[#E11D48] hover:underline">
                  <LogOut size={16} /> Cerrar sesión
                </button>
              </li>
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#64748B]">
              <Bell size={14} /> Notificaciones
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#171d19] dark:text-white">Alertas por email</p>
                  <p className="text-xs text-[#64748B]">Avisos de presupuestos</p>
                </div>
                <Toggle enabled={emailAlerts} onChange={setEmailAlerts} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#171d19] dark:text-white">Alertas por SMS</p>
                  <p className="text-xs text-[#64748B]">Solo críticas</p>
                </div>
                <Toggle enabled={smsAlerts} onChange={setSmsAlerts} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#171d19] dark:text-white">Resumen semanal</p>
                  <p className="text-xs text-[#64748B]">Reporte de gastos</p>
                </div>
                <Toggle enabled={weeklyDigest} onChange={setWeeklyDigest} />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-slate-800">
                <span className="flex items-center gap-2 text-sm text-[#3d4a42] dark:text-slate-300">
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} Tema {theme === 'dark' ? 'oscuro' : 'claro'}
                </span>
                <button type="button" onClick={toggleTheme} className="text-sm font-medium text-[#0e9f6e] hover:underline">
                  Cambiar
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#64748B]">
              <Shield size={14} /> Seguridad
            </h2>
            <div className="space-y-3 text-sm">
              <button type="button" onClick={() => toast.showSuccess('Función no implementada')} className="flex w-full items-center justify-between rounded-lg border border-[#E2E8F0] px-3 py-2 hover:bg-[#F8FAFC] dark:border-slate-700 dark:hover:bg-slate-800">
                <span>Autenticación de dos factores</span>
                <span className="text-[#64748B]">›</span>
              </button>
              <button type="button" onClick={() => toast.showSuccess('Función no implementada')} className="flex w-full items-center justify-between rounded-lg border border-[#E2E8F0] px-3 py-2 hover:bg-[#F8FAFC] dark:border-slate-700 dark:hover:bg-slate-800">
                <span>Dispositivos conectados</span>
                <span className="text-[#64748B]">›</span>
              </button>
              <button type="button" onClick={() => toast.showSuccess('Función no implementada')} className="flex w-full items-center justify-between rounded-lg border border-[#E2E8F0] px-3 py-2 hover:bg-[#F8FAFC] dark:border-slate-700 dark:hover:bg-slate-800">
                <span>Exportar mis datos</span>
                <span className="text-[#64748B]">›</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default ConfigPage

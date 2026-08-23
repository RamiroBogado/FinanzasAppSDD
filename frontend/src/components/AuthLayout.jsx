import PropTypes from 'prop-types'
import { ArrowLeftRight, PiggyBank, Target, Wallet } from 'lucide-react'

const BENEFITS = [
  { icon: ArrowLeftRight, text: 'Registrá ingresos y gastos en segundos' },
  { icon: PiggyBank, text: 'Controlá presupuestos mensuales por categoría' },
  { icon: Target, text: 'Seguí el progreso de tus metas de ahorro' }
]

const AuthLayout = ({ title, subtitle, children }) => (
  <div className="grid min-h-screen lg:grid-cols-2">
    <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-10 text-white lg:flex">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-violet-600/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-950/50">
          <Wallet size={20} aria-hidden="true" />
        </span>
        <span className="text-lg font-bold tracking-tight">FinanzasApp</span>
      </div>
      <div className="relative max-w-md">
        <h2 className="text-3xl font-bold leading-tight tracking-tight">
          Tus finanzas, claras y bajo control.
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-300">
          Todo lo que necesitás para entender en qué va tu plata, sin planillas complicadas.
        </p>
        <ul className="mt-8 space-y-4">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-slate-200">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon size={16} aria-hidden="true" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
      <p className="relative text-xs text-slate-500">FinanzasApp · Gestión financiera personal</p>
    </div>

    <div className="flex flex-col">
      <div className="flex items-center gap-2.5 p-6 lg:hidden">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Wallet size={18} aria-hidden="true" />
        </span>
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">FinanzasApp</span>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:pb-6">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  </div>
)

AuthLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
}

export default AuthLayout

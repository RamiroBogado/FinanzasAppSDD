import { Link } from 'react-router-dom'
import { ArrowLeftRight, ArrowRight, PieChart, Wallet } from 'lucide-react'

const FEATURES = [
  {
    icon: ArrowLeftRight,
    title: 'Transacciones',
    description: 'Registrá ingresos y gastos con categoría, fecha y descripción en segundos.'
  },
  {
    icon: PieChart,
    title: 'Presupuestos',
    description: 'Definí límites mensuales por categoría y mirá cuánto llevás gastado.'
  },
  {
    icon: Wallet,
    title: 'Dashboard',
    description: 'Visualizá tus totales, gastos por categoría y últimos movimientos.'
  }
]

const navLinkClass =
  'rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:text-slate-300 dark:hover:text-white'

const ctaLinkClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950'

const ghostCtaClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'

const HomePage = () => (
  <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Wallet size={20} aria-hidden="true" />
        </span>
        <span className="text-lg font-bold text-slate-900 dark:text-white">FinanzasApp</span>
      </div>
      <nav className="flex items-center gap-2">
        <Link to="/login" className={navLinkClass}>
          Iniciar sesión
        </Link>
        <Link to="/registro" className={`${ctaLinkClass} hidden sm:inline-flex`}>
          Crear cuenta
        </Link>
      </nav>
    </header>

    <main className="flex-1">
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-indigo-100 blur-3xl dark:bg-indigo-900/30"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-violet-100 blur-3xl dark:bg-violet-900/20"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
            Gestión financiera simple
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-6xl dark:text-white">
            Tus finanzas personales, claras y bajo control
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Registrá ingresos y gastos, organizá categorías, definí presupuestos mensuales y seguí
            tu balance desde un solo lugar.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/registro" className={ctaLinkClass}>
              Crear cuenta
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/login" className={ghostCtaClass}>
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-card transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-12 text-center shadow-md">
          <h2 className="text-2xl font-bold text-white md:text-3xl">Empezá a controlar tus gastos hoy</h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">
            Creá tu cuenta gratis y llevá tus finanzas personales al próximo nivel.
          </p>
          <Link
            to="/registro"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Crear cuenta
          </Link>
        </div>
      </section>
    </main>

    <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      FinanzasApp — Finanzas personales multiusuario.
    </footer>
  </div>
)

export default HomePage

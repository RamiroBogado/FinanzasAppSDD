import { Link } from 'react-router-dom'
import {
  ArrowLeftRight,
  ArrowRight,
  PieChart,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react'

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
  },
  {
    icon: Target,
    title: 'Metas de ahorro',
    description: 'Creá objetivos con monto y fecha, y seguí tu progreso en tiempo real.'
  },
  {
    icon: Users,
    title: 'Multiusuario',
    description: 'Tu cuenta es privada: cada usuario ve únicamente sus propios datos.'
  },
  {
    icon: Sparkles,
    title: 'Asistente con IA',
    description: 'Preguntale sobre tus gastos y recibí respuestas basadas en tus datos.'
  }
]

const PREVIEW_KPIS = [
  { label: 'Ingresos', value: '$1.250.000' },
  { label: 'Gastos', value: '$843.200' },
  { label: 'Balance', value: '$406.800' }
]

const PREVIEW_BARS = [
  { month: 'Mar', income: 45, expense: 30 },
  { month: 'Abr', income: 60, expense: 42 },
  { month: 'May', income: 52, expense: 38 },
  { month: 'Jun', income: 75, expense: 50 },
  { month: 'Jul', income: 65, expense: 44 },
  { month: 'Ago', income: 90, expense: 55 }
]

const navLinkClass =
  'rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:text-slate-300 dark:hover:text-white'

const ctaLinkClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950'

const ghostCtaClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'

const ProductPreview = () => (
  <div className="relative mx-auto mt-16 max-w-3xl">
    <div className="absolute -inset-x-8 -top-8 bottom-0 rounded-t-3xl bg-gradient-to-b from-indigo-100/70 to-transparent blur-2xl dark:from-indigo-500/10" aria-hidden="true" />
    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Resumen del mes</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Agosto 2026</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-success-500/10 dark:text-success-500">
          <TrendingUp size={14} aria-hidden="true" />
          Ahorro +18%
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {PREVIEW_KPIS.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="amount truncate text-sm font-bold text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex h-28 items-end justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        {PREVIEW_BARS.map(({ month, income, expense }) => (
          <div key={month} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-full w-full items-end justify-center gap-1">
              <div
                className="w-1/3 max-w-[14px] rounded-t bg-indigo-500 dark:bg-indigo-400"
                style={{ height: `${income}%` }}
              />
              <div
                className="w-1/3 max-w-[14px] rounded-t bg-indigo-200 dark:bg-slate-700"
                style={{ height: `${expense}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-400">{month}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="absolute -right-3 -top-4 hidden rotate-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:block">
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Meta: Vacaciones</p>
      <p className="amount text-sm font-bold text-slate-900 dark:text-white">78% alcanzado</p>
    </div>
  </div>
)

const HomePage = () => (
  <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Wallet size={20} aria-hidden="true" />
        </span>
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">FinanzasApp</span>
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
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(148 163 184 / 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.12) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-indigo-100 blur-3xl dark:bg-indigo-900/30"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 text-center md:pt-24">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-6xl dark:text-white">
            Tus finanzas personales,{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              claras y bajo control
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Registrá ingresos y gastos, organizá categorías, definí presupuestos mensuales y seguí
            tu balance desde un solo lugar.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/registro" className={ctaLinkClass}>
              Crear cuenta gratis
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/login" className={ghostCtaClass}>
              Iniciar sesión
            </Link>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Todo en una sola app
        </p>
        <h2 className="mx-auto mt-3 max-w-xl text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Herramientas simples para decisiones financieras mejores
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-400 dark:group-hover:bg-indigo-600 dark:group-hover:text-white">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-14 text-center shadow-md">
          <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Empezá a controlar tus gastos hoy
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">
            Creá tu cuenta gratis y llevá tus finanzas personales al próximo nivel.
          </p>
          <Link
            to="/registro"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>
    </main>

    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Wallet size={16} aria-hidden="true" />
            </span>
            <span className="font-bold tracking-tight text-slate-900 dark:text-white">FinanzasApp</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Gestión financiera personal simple, clara y privada.
          </p>
        </div>
        <nav aria-label="Producto">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Producto
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/registro" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Crear cuenta</Link></li>
            <li><Link to="/login" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Iniciar sesión</Link></li>
          </ul>
        </nav>
        <nav aria-label="Funcionalidades">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Funcionalidades
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/registro" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Transacciones</Link></li>
            <li><Link to="/registro" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Presupuestos</Link></li>
            <li><Link to="/registro" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Metas de ahorro</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-slate-200 py-5 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        © {new Date().getFullYear()} FinanzasApp · Finanzas personales multiusuario
      </div>
    </footer>
  </div>
)

export default HomePage

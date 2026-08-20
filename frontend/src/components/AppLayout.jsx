import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const AppLayout = () => {
  const { user, logout } = useAuth()

  const navLinkClass = ({ isActive }) =>
    `block rounded px-3 py-2 ${
      isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="flex w-56 flex-col justify-between bg-slate-800 p-4">
        <div>
          <h1 className="mb-6 text-xl font-semibold text-white">FinanzasApp</h1>
          <nav className="space-y-1">
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/transacciones" className={navLinkClass}>
              Transacciones
            </NavLink>
            <NavLink to="/presupuestos" className={navLinkClass}>
              Presupuestos
            </NavLink>
          </nav>
        </div>
        <div>
          <p className="mb-2 text-sm text-slate-300">{user?.username}</p>
          <button
            onClick={logout}
            className="w-full rounded bg-slate-700 py-2 text-white hover:bg-slate-600"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
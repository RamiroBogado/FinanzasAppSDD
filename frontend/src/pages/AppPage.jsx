import { useAuth } from '../context/AuthContext.jsx'

const AppPage = () => {
  const { user, logout } = useAuth()

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow">
        <h1 className="mb-6 text-2xl font-semibold text-slate-800">{user.username}</h1>
        <button
          onClick={logout}
          className="w-full rounded bg-slate-800 py-2 text-white hover:bg-slate-700"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  )
}

export default AppPage
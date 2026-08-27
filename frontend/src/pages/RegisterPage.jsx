import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'

const RegisterPage = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register({ username, email, password })
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Crear cuenta" subtitle="Empezá a controlar tus finanzas hoy">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <label htmlFor="username" className="block text-sm font-medium text-[#3d4a42] dark:text-slate-300">
            Nombre de usuario
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1"
              required
            />
          </label>
          <label htmlFor="email" className="block text-sm font-medium text-[#3d4a42] dark:text-slate-300">
            Correo electrónico
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1"
              required
            />
          </label>
          <label htmlFor="password" className="block text-sm font-medium text-[#3d4a42] dark:text-slate-300">
            Contraseña
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </label>
        </div>
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="mt-6 w-full py-2.5">
          Registrarse
        </Button>
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-[#0e9f6e] hover:underline dark:text-[#0e9f6e]">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default RegisterPage

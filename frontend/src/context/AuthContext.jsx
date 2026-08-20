import { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { api, clearToken, getToken, setToken } from '../api.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()

    if (!token) {
      setLoading(false)
      return
    }

    api
      .me(token)
      .then((data) => setUser(data))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    const { token } = await api.login({ username, password })
    setToken(token)
    const data = await api.me(token)
    setUser(data)
    return data
  }

  const register = (payload) => api.register(payload)

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
}
const TOKEN_KEY = 'finanzas_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)

export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  const data = response.status === 204 ? null : await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Error inesperado del servidor')
  }

  return data
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),
  listTransactions: (token, params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    ).toString()

    return request(`/transactions${query ? `?${query}` : ''}`, { token })
  },
  createTransaction: (token, payload) =>
    request('/transactions', { method: 'POST', body: payload, token }),
  updateTransaction: (token, id, payload) =>
    request(`/transactions/${id}`, { method: 'PUT', body: payload, token }),
  deleteTransaction: (token, id) => request(`/transactions/${id}`, { method: 'DELETE', token }),
  listBudgets: (token, params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    ).toString()

    return request(`/budgets${query ? `?${query}` : ''}`, { token })
  },
  createBudget: (token, payload) =>
    request('/budgets', { method: 'POST', body: payload, token }),
  updateBudget: (token, id, payload) =>
    request(`/budgets/${id}`, { method: 'PUT', body: payload, token }),
  deleteBudget: (token, id) => request(`/budgets/${id}`, { method: 'DELETE', token })
}
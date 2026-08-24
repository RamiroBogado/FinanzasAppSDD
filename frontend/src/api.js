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

async function aiRequest(path, { method = 'POST', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`/ai${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  const data = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || 'Error inesperado del servidor')
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
  deleteBudget: (token, id) => request(`/budgets/${id}`, { method: 'DELETE', token }),
  listGoals: (token) => request('/goals', { token }),
  createGoal: (token, payload) => request('/goals', { method: 'POST', body: payload, token }),
  updateGoal: (token, id, payload) =>
    request(`/goals/${id}`, { method: 'PUT', body: payload, token }),
  deleteGoal: (token, id) => request(`/goals/${id}`, { method: 'DELETE', token }),
  listAlerts: (token) => request('/alerts', { token }),
  checkAlerts: (token, month) =>
    request('/alerts/check', { method: 'POST', body: month ? { month } : {}, token }),
  markAlertRead: (token, id) => request(`/alerts/${id}/read`, { method: 'PUT', token }),
  markAllAlertsRead: (token) => request('/alerts/read-all', { method: 'POST', token }),
  exportTransactions: async (token, params = {}, format) => {
    const query = new URLSearchParams(
      Object.entries({ ...params, format }).filter(([, value]) => value !== undefined && value !== '')
    ).toString()

    const response = await fetch(`/api/transactions/export?${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Error inesperado del servidor')
    }

    const disposition = response.headers.get('Content-Disposition') ?? ''
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? `transacciones.${format}`
    const url = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')

    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
  askChatbot: (token, message) => aiRequest('/chatbot/message', { body: { message }, token }),
  clearChatbot: (token) => aiRequest('/chatbot/clear', { token })
}
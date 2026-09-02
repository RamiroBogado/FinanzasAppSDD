const TOKEN_KEY = 'finanzas_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)

export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

function extractList(response) {
  if (Array.isArray(response)) {
    return response
  }

  if (response && Array.isArray(response.data)) {
    return response.data
  }

  return []
}

/**
 * Construye los query params ignorando valores undefined,
 * null y strings vacíos.
 */
function buildQuery(params = {}) {
  return new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ''
    )
  ).toString()
}

/**
 * Cliente HTTP centralizado.
 *
 * Mantiene autenticación mediante JWT Bearer.
 */
async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  })

  const data =
    response.status === 204
      ? null
      : await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      data?.error || 'Error inesperado del servidor'
    )
  }

  return data
}

export const api = {
  // =========================================================
  // AUTH
  // =========================================================

  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: payload
    }),

  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: payload
    }),

  me: (token) =>
    request('/auth/me', {
      token
    }),

  // =========================================================
  // TRANSACTIONS
  // =========================================================

  listTransactions: (token, params = {}) => {
    const query = buildQuery(params)

    return request(
      `/transactions${query ? `?${query}` : ''}`,
      { token }
    ).then(extractList)
  },

  createTransaction: (token, payload) =>
    request('/transactions', {
      method: 'POST',
      body: payload,
      token
    }),

  updateTransaction: (token, id, payload) =>
    request(`/transactions/${id}`, {
      method: 'PUT',
      body: payload,
      token
    }),

  deleteTransaction: (token, id) =>
    request(`/transactions/${id}`, {
      method: 'DELETE',
      token
    }),

  // =========================================================
  // BUDGETS
  // =========================================================

  listBudgets: (token, params = {}) => {
    const query = buildQuery(params)

    return request(
      `/budgets${query ? `?${query}` : ''}`,
      { token }
    ).then(extractList)
  },

  createBudget: (token, payload) =>
    request('/budgets', {
      method: 'POST',
      body: payload,
      token
    }),

  updateBudget: (token, id, payload) =>
    request(`/budgets/${id}`, {
      method: 'PUT',
      body: payload,
      token
    }),

  deleteBudget: (token, id) =>
    request(`/budgets/${id}`, {
      method: 'DELETE',
      token
    }),

  // =========================================================
  // GOALS
  // =========================================================

  listGoals: (token, params = {}) => {
    const query = buildQuery(params)

    return request(
      `/goals${query ? `?${query}` : ''}`,
      { token }
    ).then(extractList)
  },

  createGoal: (token, payload) =>
    request('/goals', {
      method: 'POST',
      body: payload,
      token
    }),

  updateGoal: (token, id, payload) =>
    request(`/goals/${id}`, {
      method: 'PUT',
      body: payload,
      token
    }),

  deleteGoal: (token, id) =>
    request(`/goals/${id}`, {
      method: 'DELETE',
      token
    }),

  adjustGoal: (token, goalId, type, amount) =>
    request(`/goals/${goalId}/movement`, {
      method: 'POST',
      body: { type, amount },
      token
    }),

  // =========================================================
  // ALERTS
  // =========================================================

  listAlerts: (token, params = {}) => {
    const query = buildQuery(params)

    return request(
      `/alerts${query ? `?${query}` : ''}`,
      { token }
    ).then(extractList)
  },

  checkAlerts: (token, month) =>
    request('/alerts/check', {
      method: 'POST',
      body: month ? { month } : {},
      token
    }),

  markAlertRead: (token, id) =>
    request(`/alerts/${id}/read`, {
      method: 'PUT',
      token
    }),

  markAllAlertsRead: (token) =>
    request('/alerts/read-all', {
      method: 'POST',
      token
    }),

  // =========================================================
  // EXPORT
  // =========================================================

  exportTransactions: async (
    token,
    params = {},
    format
  ) => {
    const query = buildQuery({
      ...params,
      format
    })

    const response = await fetch(
      `/api/transactions/export${query ? `?${query}` : ''}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      const data = await response
        .json()
        .catch(() => null)

      throw new Error(
        data?.error ||
          'Error inesperado del servidor'
      )
    }

    const disposition =
      response.headers.get(
        'Content-Disposition'
      ) ?? ''

    const filename =
      disposition.match(
        /filename="([^"]+)"/
      )?.[1] ??
      `transacciones.${format}`

    const blob = await response.blob()

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url
    link.download = filename

    document.body.appendChild(link)

    link.click()

    link.remove()

    URL.revokeObjectURL(url)
  },

  // =========================================================
  // CHAT
  // =========================================================

  listChatMessages: (token, params = {}) => {
    const query = buildQuery(params)

    return request(
      `/chat/messages${query ? `?${query}` : ''}`,
      { token }
    ).then(extractList)
  },

  sendChatMessage: (token, message) =>
    request('/chat/messages', {
      method: 'POST',
      body: { message },
      token
    }),

  clearChatMessages: (token) =>
    request('/chat/messages', {
      method: 'DELETE',
      token
    }),

  confirmChatAction: (token, id) =>
    request(`/chat/actions/${id}/confirm`, {
      method: 'POST',
      token
    }),

  cancelChatAction: (token, id) =>
    request(`/chat/actions/${id}/cancel`, {
      method: 'POST',
      token
    }),

  // =========================================================
  // CATEGORIES
  // =========================================================

  listCategories: (token, params = {}) => {
    const query = buildQuery(params)

    return request(
      `/categories${query ? `?${query}` : ''}`,
      { token }
    ).then(extractList)
  },

  createCategory: (token, payload) =>
    request('/categories', {
      method: 'POST',
      body: payload,
      token
    }),

  updateCategory: (token, id, payload) =>
    request(`/categories/${id}`, {
      method: 'PUT',
      body: payload,
      token
    }),

  deleteCategory: (token, id) =>
    request(`/categories/${id}`, {
      method: 'DELETE',
      token
    })
}

// =========================================================
// CATEGORIES CACHE
// =========================================================

const CATEGORIES_TTL = 30_000

let categoriesCache = {
  data: [],
  expiry: 0
}

export const getCategories = (token) => {
  if (Date.now() < categoriesCache.expiry) {
    return Promise.resolve(
      categoriesCache.data
    )
  }

  return api
    .listCategories(token)
    .then((data) => {
      categoriesCache = {
        data,
        expiry:
          Date.now() + CATEGORIES_TTL
      }

      return data
    })
}

const invalidateCategoriesCache = () => {
  categoriesCache = {
    data: [],
    expiry: 0
  }
}

export const createCategory = (
  token,
  payload
) =>
  api
    .createCategory(token, payload)
    .then((data) => {
      invalidateCategoriesCache()
      return data
    })

export const updateCategory = (
  token,
  id,
  payload
) =>
  api
    .updateCategory(token, id, payload)
    .then((data) => {
      invalidateCategoriesCache()
      return data
    })

export const deleteCategoryCached = (
  token,
  id
) =>
  api
    .deleteCategory(token, id)
    .then((data) => {
      invalidateCategoriesCache()
      return data
    })

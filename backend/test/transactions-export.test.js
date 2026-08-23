import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import app from '../src/app.js'
import { getDatabase } from '../src/db.js'

let server
let baseUrl

beforeEach(async () => {
  getDatabase().prepare('DELETE FROM goals').run()
  getDatabase().prepare('DELETE FROM budgets').run()
  getDatabase().prepare('DELETE FROM transactions').run()
  getDatabase().prepare('DELETE FROM users').run()
  server = app.listen(0)
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve))
})

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  return {
    status: response.status,
    headers: response.headers,
    body: response.status === 204 ? null : await response.json()
  }
}

async function registerAndLogin({ username = 'rama', email = 'rama@example.com' } = {}) {
  await request('/api/auth/register', {
    method: 'POST',
    body: { username, email, password: 'secret123' }
  })
  const { body } = await request('/api/auth/login', {
    method: 'POST',
    body: { username, password: 'secret123' }
  })
  return body.token
}

async function createTransaction(token, overrides = {}) {
  const payload = {
    type: 'expense',
    amount: 5000,
    date: '2026-08-10',
    category: 'Comida',
    description: 'Supermercado',
    ...overrides
  }

  const { status, body } = await request('/api/transactions', {
    method: 'POST',
    body: payload,
    token
  })

  expect(status).toBe(201)

  return body
}

async function exportFile(token, format, params = '') {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${baseUrl}/api/transactions/export?format=${format}${params}`, {
    headers
  })

  const contentType = response.headers.get('content-type') ?? ''
  const disposition = response.headers.get('content-disposition') ?? ''
  const buffer = Buffer.from(await response.arrayBuffer())

  return {
    status: response.status,
    contentType,
    disposition,
    text: buffer.toString('utf8'),
    buffer
  }
}

function pdfText(buffer) {
  const raw = buffer.toString('latin1')
  let text = ''

  for (const match of raw.matchAll(/<([0-9a-fA-F]+)>/g)) {
    text += Buffer.from(match[1], 'hex').toString('latin1')
  }

  return text
}

describe('protección de la exportación', () => {
  it('exige token para exportar', async () => {
    const result = await exportFile(undefined, 'csv')

    expect(result.status).toBe(401)
    expect(JSON.parse(result.text).error).toBe('No autorizado')
  })

  it('rechaza un formato no soportado', async () => {
    const token = await registerAndLogin()

    for (const format of ['xml', '', 'CSV']) {
      const result = await exportFile(token, encodeURIComponent(format))

      expect(result.status).toBe(400)
      expect(JSON.parse(result.text).error).toBe(
        'El formato de exportación debe ser csv, pdf o xlsx'
      )
    }
  })

  it('valida los filtros de fecha al exportar', async () => {
    const token = await registerAndLogin()
    const result = await exportFile(token, 'csv', '&from=10-08-2026')

    expect(result.status).toBe(400)
    expect(JSON.parse(result.text).error).toBe('La fecha debe tener formato AAAA-MM-DD')
  })
})

describe('exportación CSV', () => {
  it('descarga un CSV con BOM, encabezados y filas propias', async () => {
    const token = await registerAndLogin()
    await createTransaction(token)
    await createTransaction(token, {
      type: 'income',
      amount: 250000,
      date: '2026-08-05',
      category: 'Sueldo',
      description: 'Sueldo agosto'
    })

    const result = await exportFile(token, 'csv')

    expect(result.status).toBe(200)
    expect(result.contentType).toContain('text/csv')
    expect(result.disposition).toMatch(/attachment; filename="transacciones-\d{4}-\d{2}-\d{2}\.csv"/)

    const lines = result.text.replace(/^\uFEFF/, '').trim().split('\r\n')

    expect(lines[0]).toBe('Fecha;Tipo;Categoría;Descripción;Monto')
    expect(lines[1]).toBe('2026-08-10;Gasto;Comida;Supermercado;50.00')
    expect(lines[2]).toBe('2026-08-05;Ingreso;Sueldo;Sueldo agosto;2500.00')
  })

  it('escapa valores que contienen separador o comillas', async () => {
    const token = await registerAndLogin()
    await createTransaction(token, { description: 'Compra; con "comillas"' })

    const result = await exportFile(token, 'csv')
    const lines = result.text.replace(/^\uFEFF/, '').trim().split('\r\n')

    expect(lines[1]).toContain('"Compra; con ""comillas"""')
  })

  it('nunca incluye transacciones de otros usuarios', async () => {
    const tokenA = await registerAndLogin({ username: 'user_a', email: 'a@example.com' })
    const tokenB = await registerAndLogin({ username: 'user_b', email: 'b@example.com' })
    await createTransaction(tokenA, { description: 'Solo de A' })
    await createTransaction(tokenB, { description: 'Solo de B' })

    const result = await exportFile(tokenB, 'csv')

    expect(result.text).toContain('Solo de B')
    expect(result.text).not.toContain('Solo de A')
  })
})

describe('filtros aplicados a la exportación', () => {
  it('exporta únicamente las transacciones dentro del rango solicitado', async () => {
    const token = await registerAndLogin()
    await createTransaction(token, { date: '2026-07-01' })
    await createTransaction(token, { date: '2026-08-01' })

    const result = await exportFile(token, 'csv', '&from=2026-08-01&to=2026-08-31')
    const lines = result.text.replace(/^\uFEFF/, '').trim().split('\r\n')

    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain('2026-08-01')
  })
})

describe('exportación PDF', () => {
  it('genera un PDF válido con resumen de totales', async () => {
    const token = await registerAndLogin()
    await createTransaction(token, { amount: 10000 })
    await createTransaction(token, {
      type: 'income',
      amount: 300000,
      date: '2026-08-02',
      category: 'Sueldo',
      description: 'Cobro'
    })

    const result = await exportFile(token, 'pdf')

    expect(result.status).toBe(200)
    expect(result.contentType).toBe('application/pdf')
    expect(result.disposition).toMatch(/attachment; filename="transacciones-\d{4}-\d{2}-\d{2}\.pdf"/)
    expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-')

    const content = pdfText(result.buffer)

    expect(content).toContain('Exportación de transacciones')
    expect(content).toContain('Resumen de totales')
    expect(content).toContain('Total ingresos')
    expect(content).toContain('Total gastos')
    expect(content).toContain('Saldo')
    expect(content).toContain('3.000,00')
    expect(content).toContain('100,00')
    expect(content).toContain('2.900,00')
  })
})

describe('exportación XLSX', () => {
  it('genera un XLSX válido con hojas Transacciones y Resumen correctas', async () => {
    const token = await registerAndLogin()
    await createTransaction(token, { amount: 10000 })
    await createTransaction(token, {
      type: 'income',
      amount: 300000,
      date: '2026-08-02',
      category: 'Sueldo',
      description: 'Cobro'
    })

    const result = await exportFile(token, 'xlsx')

    expect(result.status).toBe(200)
    expect(result.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    expect(result.buffer.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]))

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(result.buffer)

    const sheet = workbook.getWorksheet('Transacciones')

    expect(sheet).toBeDefined()
    expect(sheet.getRow(1).getCell(1).value).toBe('Fecha')
    expect(sheet.getRow(2).getCell(2).value).toBe('Gasto')
    expect(sheet.getRow(2).getCell(5).value).toBe(100)
    expect(sheet.getRow(3).getCell(2).value).toBe('Ingreso')
    expect(sheet.getRow(3).getCell(5).value).toBe(3000)

    const summary = workbook.getWorksheet('Resumen')

    expect(summary).toBeDefined()
    expect(summary.getCell('B2').value).toBe(3000)
    expect(summary.getCell('B3').value).toBe(100)
    expect(summary.getCell('B4').value).toBe(2900)
  })
})

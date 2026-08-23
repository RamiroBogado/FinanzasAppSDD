import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'

const TYPE_LABELS = { income: 'Ingreso', expense: 'Gasto' }
const HEADERS = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto']
const COLUMN_WIDTHS = [70, 70, 110, 150, 90]

const formatAmount = (cents) => (cents / 100).toFixed(2)

const formatCurrency = (cents) =>
  (cents / 100).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

export function sumByType(transactions) {
  return transactions.reduce(
    (accumulator, transaction) => {
      accumulator[transaction.type] += transaction.amount
      return accumulator
    },
    { income: 0, expense: 0 }
  )
}

function escapeCsv(value) {
  const text = value === null || value === undefined ? '' : String(value)

  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(transactions) {
  const lines = [HEADERS.join(';')]

  for (const transaction of transactions) {
    lines.push(
      [
        transaction.date,
        TYPE_LABELS[transaction.type],
        escapeCsv(transaction.category),
        escapeCsv(transaction.description),
        formatAmount(transaction.amount)
      ].join(';')
    )
  }

  return `\uFEFF${lines.join('\r\n')}\r\n`
}

const TABLE_WIDTH = COLUMN_WIDTHS.reduce((accumulator, width) => accumulator + width, 0)

function drawPdfHeader(doc) {
  const top = doc.page.margins.top
  const left = doc.page.margins.left

  doc.font('Helvetica-Bold').fontSize(16).text('Exportación de transacciones', left, top)
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#64748b')
    .text(`Generado el ${new Date().toLocaleDateString('es-AR')}`, left, top + 22)
  doc.fillColor('#000000')

  const headerY = top + 46
  let x = left
  COLUMN_WIDTHS.forEach((width, index) => {
    doc.font('Helvetica-Bold').fontSize(10).text(HEADERS[index], x, headerY, { width, lineBreak: false })
    x += width
  })
  doc.lineWidth(1).moveTo(left, headerY + 15).lineTo(left + TABLE_WIDTH, headerY + 15).stroke()

  doc.x = left
  doc.y = headerY + 24
}

function drawPdfRow(doc, cells) {
  if (doc.y > doc.page.height - doc.page.margins.bottom - 140) {
    doc.addPage()
    drawPdfHeader(doc)
  }

  const rowTop = doc.y
  let x = doc.page.margins.left

  COLUMN_WIDTHS.forEach((width, index) => {
    doc.font('Helvetica').fontSize(10).text(cells[index], x, rowTop, {
      width,
      lineBreak: false,
      ellipsis: true
    })
    x += width
  })

  doc.x = doc.page.margins.left
  doc.y = rowTop + 18
}

function drawPdfSummary(doc, totals) {
  const balance = totals.income - totals.expense
  const left = doc.page.margins.left

  doc.moveDown(1)
  const boxTop = doc.y
  doc.rect(left, boxTop, 260, 84).stroke()
  doc.font('Helvetica-Bold').fontSize(11).text('Resumen de totales', left + 12, boxTop + 10)
  doc.font('Helvetica').fontSize(10)
  doc.text(`Total ingresos: ${formatCurrency(totals.income)}`, left + 12, boxTop + 32)
  doc.text(`Total gastos: ${formatCurrency(totals.expense)}`, left + 12, boxTop + 50)
  doc.text(`Saldo: ${formatCurrency(balance)}`, left + 12, boxTop + 68)
}

export function toPdf(transactions) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, compress: false })
    const chunks = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    drawPdfHeader(doc)

    for (const transaction of transactions) {
      drawPdfRow(doc, [
        transaction.date,
        TYPE_LABELS[transaction.type],
        transaction.category ?? '-',
        transaction.description ?? '-',
        formatAmount(transaction.amount)
      ])
    }

    drawPdfSummary(doc, sumByType(transactions))
    doc.end()
  })
}

export async function toXlsx(transactions) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Transacciones')

  sheet.columns = HEADERS.map((header, index) => ({
    header,
    key: ['date', 'type', 'category', 'description', 'amount'][index],
    width: [14, 12, 20, 40, 14][index]
  }))
  sheet.getRow(1).font = { bold: true }

  for (const transaction of transactions) {
    sheet.addRow({
      date: transaction.date,
      type: TYPE_LABELS[transaction.type],
      category: transaction.category ?? '',
      description: transaction.description ?? '',
      amount: transaction.amount / 100
    })
  }

  sheet.getColumn('amount').numFmt = '#,##0.00'

  const summary = workbook.addWorksheet('Resumen')
  const totals = sumByType(transactions)
  summary.columns = [
    { header: 'Concepto', key: 'concept', width: 20 },
    { header: 'Monto', key: 'amount', width: 16 }
  ]
  summary.getRow(1).font = { bold: true }
  summary.addRow({ concept: 'Total ingresos', amount: totals.income / 100 })
  summary.addRow({ concept: 'Total gastos', amount: totals.expense / 100 })
  summary.addRow({ concept: 'Saldo', amount: (totals.income - totals.expense) / 100 })
  summary.getColumn('amount').numFmt = '#,##0.00'

  const buffer = await workbook.xlsx.writeBuffer()

  return Buffer.from(buffer)
}

import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { initSchema } from './schema.js'

const isTest = process.env.NODE_ENV === 'test'
const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'finanzas.db')

let database

function ensureDatabasePath() {
  if (!isTest) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }
}

export function getDatabase() {
  if (!database) {
    ensureDatabasePath()
    database = new Database(isTest ? ':memory:' : dbPath)
    initSchema(database)
  }
  return database
}
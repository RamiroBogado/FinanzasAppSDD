import app from './app.js'
import { getDatabase, seedCategoriesFromTransactions } from './db.js'

const PORT = process.env.PORT || 3001

const db = getDatabase()
seedCategoriesFromTransactions(db)

app.listen(PORT, () => {
  console.log(`Backend escuchando en el puerto ${PORT}`)
})
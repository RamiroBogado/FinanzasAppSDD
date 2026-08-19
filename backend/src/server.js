import app from './app.js'
import { getDatabase } from './db.js'

const PORT = process.env.PORT || 3001

getDatabase()

app.listen(PORT, () => {
  console.log(`Backend escuchando en el puerto ${PORT}`)
})
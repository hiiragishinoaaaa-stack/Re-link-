import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDb } from './db.js'
import accountsRouter from './routes/accounts.js'
import postsRouter from './routes/posts.js'
import analyticsRouter from './routes/analytics.js'
import logsRouter from './routes/logs.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors({ origin: '*' }))
app.use(express.json())

// Initialize DB on startup
try {
  getDb()
} catch (err) {
  console.error('[Server] DB initialization failed:', err)
  process.exit(1)
}

app.use('/api/accounts',  accountsRouter)
app.use('/api/posts',     postsRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/logs',      logsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), mode: process.env.NODE_ENV || 'development' })
})

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')))
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Running on http://0.0.0.0:${PORT}`)
  console.log(`[Server] Mode: ${process.env.NODE_ENV || 'development'}`)
})

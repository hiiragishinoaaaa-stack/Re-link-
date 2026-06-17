import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/summary', (_req, res) => {
  const db = getDb()

  const totalAccounts = (db.prepare('SELECT COUNT(*) as n FROM accounts').get() as { n: number }).n
  const totalPosts    = (db.prepare('SELECT COUNT(*) as n FROM posts').get() as { n: number }).n
  const postedPosts   = (db.prepare("SELECT COUNT(*) as n FROM posts WHERE status='posted'").get() as { n: number }).n
  const scheduledPosts= (db.prepare("SELECT COUNT(*) as n FROM posts WHERE status='scheduled'").get() as { n: number }).n
  const draftPosts    = (db.prepare("SELECT COUNT(*) as n FROM posts WHERE status='draft'").get() as { n: number }).n
  const failedPosts   = (db.prepare("SELECT COUNT(*) as n FROM posts WHERE status='failed'").get() as { n: number }).n

  // Mock engagement metrics (replace with real X API data)
  const mockEngagement = {
    totalImpressions: postedPosts * 1500 + Math.floor(Math.random() * 3000),
    totalLikes:       postedPosts * 45   + Math.floor(Math.random() * 100),
    totalRetweets:    postedPosts * 12   + Math.floor(Math.random() * 30),
    totalReplies:     postedPosts * 8    + Math.floor(Math.random() * 20),
  }

  res.json({
    accounts: totalAccounts,
    posts: { total: totalPosts, posted: postedPosts, scheduled: scheduledPosts, draft: draftPosts, failed: failedPosts },
    engagement: mockEngagement,
  })
})

router.get('/posts-by-day', (_req, res) => {
  const db = getDb()
  const rows = db.prepare(`
    SELECT DATE(created_at) AS date, COUNT(*) AS count, status
    FROM posts
    WHERE created_at >= DATE('now', '-30 days')
    GROUP BY DATE(created_at), status
    ORDER BY date ASC
  `).all()
  res.json(rows)
})

router.get('/account/:id', (req, res) => {
  const db = getDb()
  const { id } = req.params

  const account = db.prepare('SELECT id, username, display_name FROM accounts WHERE id = ?').get(id)
  if (!account) return res.status(404).json({ error: 'Not found' })

  const postStats = db.prepare(
    'SELECT status, COUNT(*) as count FROM posts WHERE account_id = ? GROUP BY status'
  ).all(id)

  const recentPosts = db.prepare(
    'SELECT id, content, status, posted_at, created_at FROM posts WHERE account_id = ? ORDER BY created_at DESC LIMIT 10'
  ).all(id)

  // Mock daily metrics for the past 7 days
  const metrics = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      date: date.toISOString().split('T')[0],
      impressions: Math.floor(Math.random() * 4000),
      likes: Math.floor(Math.random() * 180),
      retweets: Math.floor(Math.random() * 50),
    }
  })

  res.json({ account, postStats, recentPosts, metrics })
})

export default router

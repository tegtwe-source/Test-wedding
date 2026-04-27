import getDb from '../../lib/db'

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { name, email, attending, guests, meal, dietary, message } = req.body

  if (!name?.trim() || !email?.trim() || !attending) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const db = getDb()
  db.prepare(`
    INSERT INTO rsvps (name, email, attending, guests, meal, dietary, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    email.trim(),
    attending,
    guests ? parseInt(guests, 10) : null,
    meal || null,
    dietary || null,
    message || null
  )

  res.json({ ok: true })
}

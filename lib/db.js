import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'wedding.db')

let db

export default function getDb() {
  if (!db) {
    db = new Database(DB_PATH)
    db.exec(`
      CREATE TABLE IF NOT EXISTS rsvps (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        email       TEXT    NOT NULL,
        attending   TEXT    NOT NULL,
        guests      INTEGER,
        meal        TEXT,
        dietary     TEXT,
        message     TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }
  return db
}

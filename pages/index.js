import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { db, storage } from '../lib/firebase'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { ref, getDownloadURL, listAll } from 'firebase/storage'

// ── EDIT THESE TO MATCH YOUR WEDDING ──────────────────────────────────────────
const WEDDING_DATE = new Date('2026-09-05T16:00:00')
const COUPLE_NAME1 = 'Sarah'
const COUPLE_NAME2 = 'James'
const VENUE_CEREMONY = 'St. Mary\'s Chapel\n123 Rose Lane\nSpringfield, ST 00000'
const VENUE_RECEPTION = 'The Grand Ballroom\n456 Elm Street\nSpringfield, ST 00000'
const DRESS_CODE = 'Cocktail Attire'
const REGISTRY_URL = 'https://example.com/registry'
const WELCOME_TEXT = 'Join us as we celebrate our love and begin our greatest adventure together.'
// ──────────────────────────────────────────────────────────────────────────────

function useCountdown(target) {
  const [parts, setParts] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    function tick() {
      const diff = target - Date.now()
      if (diff <= 0) { setParts({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setParts({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  return parts
}

export default function Home() {
  const countdown = useCountdown(WEDDING_DATE)
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    async function loadPreviewPhotos() {
      try {
        const listRef = ref(storage, 'gallery')
        const res = await listAll(listRef)
        const urls = await Promise.all(
          res.items.slice(0, 6).map(item => getDownloadURL(item))
        )
        setPhotos(urls)
      } catch {
        // Firebase not configured yet or no photos — silent fail
      }
    }
    loadPreviewPhotos()
  }, [])

  const weddingDateStr = WEDDING_DATE.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <>
      <Head>
        <title>{COUPLE_NAME1} &amp; {COUPLE_NAME2}</title>
        <meta name="description" content={`${COUPLE_NAME1} and ${COUPLE_NAME2}'s wedding — ${weddingDateStr}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <section className="hero">
        <p className="hero-eyebrow">We&apos;re getting married</p>
        <h1 className="hero-names">
          {COUPLE_NAME1} <span className="hero-ampersand">&amp;</span> {COUPLE_NAME2}
        </h1>
        <p className="hero-date">{weddingDateStr}</p>
        <div className="hero-divider" />
        <div className="hero-countdown">
          {[
            { num: countdown.days, label: 'Days' },
            { num: countdown.hours, label: 'Hours' },
            { num: countdown.minutes, label: 'Minutes' },
            { num: countdown.seconds, label: 'Seconds' },
          ].map(({ num, label }) => (
            <div className="countdown-unit" key={label}>
              <span className="countdown-num">{String(num).padStart(2, '0')}</span>
              <span className="countdown-label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="page">
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '3rem', fontSize: '1.05rem', lineHeight: 1.8 }}>
          {WELCOME_TEXT}
        </p>

        <h2 className="section-title">Details</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>Ceremony</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{VENUE_CEREMONY}</p>
          </div>
          <div className="info-card">
            <h3>Reception</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{VENUE_RECEPTION}</p>
          </div>
          <div className="info-card">
            <h3>Dress Code</h3>
            <p>{DRESS_CODE}</p>
          </div>
          {REGISTRY_URL && (
            <div className="info-card">
              <h3>Registry</h3>
              <p>
                <a href={REGISTRY_URL} target="_blank" rel="noopener noreferrer"
                   style={{ color: 'var(--rose)', textDecoration: 'underline' }}>
                  View our registry
                </a>
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
          <Link href="/rsvp" className="btn">RSVP Now</Link>
          <Link href="/gallery" className="btn" style={{ background: 'transparent', color: 'var(--deep)', border: '1px solid var(--deep)' }}>
            View Gallery
          </Link>
        </div>

        {photos.length > 0 && (
          <>
            <h2 className="section-title">Photos</h2>
            <div className="photo-strip">
              {photos.map((url, i) => (
                <img key={i} src={url} alt="" loading="lazy" />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
              <Link href="/gallery" style={{ color: 'var(--rose)', fontSize: '0.9rem' }}>See all photos →</Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}

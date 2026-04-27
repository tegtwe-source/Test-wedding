import { useState, useEffect } from 'react'
import Head from 'next/head'
import { storage } from '../lib/firebase'
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage'

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const listRef = ref(storage, 'gallery')
        const res = await listAll(listRef)
        const items = await Promise.all(
          res.items.map(async item => {
            const [url, meta] = await Promise.all([getDownloadURL(item), getMetadata(item)])
            return { url, name: item.name, time: meta.timeCreated }
          })
        )
        // Newest first
        items.sort((a, b) => new Date(b.time) - new Date(a.time))
        setPhotos(items)
      } catch (err) {
        console.error('Gallery load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight' && lightbox !== null) setLightbox(i => Math.min(i + 1, photos.length - 1))
      if (e.key === 'ArrowLeft' && lightbox !== null) setLightbox(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, photos.length])

  return (
    <>
      <Head><title>Gallery</title></Head>
      <div className="page">
        <div className="page-header">
          <h1>Gallery</h1>
          <p>Moments we treasure — and yours too. <a href="/upload" style={{ color: 'var(--rose)' }}>Share your photos →</a></p>
        </div>

        {loading && <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading photos…</p>}

        {!loading && photos.length === 0 && (
          <div className="empty-state">
            <p>No photos yet — be the first to <a href="/upload" style={{ color: 'var(--rose)' }}>share one!</a></p>
          </div>
        )}

        {photos.length > 0 && (
          <div className="gallery-grid">
            {photos.map((photo, i) => (
              <div key={photo.name} className="gallery-item" onClick={() => setLightbox(i)}>
                <img src={photo.url} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>

      {lightbox !== null && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close">×</button>
          <img
            className="lightbox-img"
            src={photos[lightbox].url}
            alt=""
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

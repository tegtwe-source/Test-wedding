import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    fetch('/api/photos')
      .then(r => r.json())
      .then(data => setPhotos(data.photos || []))
      .catch(() => {})
      .finally(() => setLoading(false))
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
              <div key={photo.key} className="gallery-item" onClick={() => setLightbox(i)}>
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

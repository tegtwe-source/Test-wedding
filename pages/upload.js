import { useState, useRef, useCallback } from 'react'
import Head from 'next/head'

const UPLOAD_PASSWORD = process.env.NEXT_PUBLIC_UPLOAD_PASSWORD || ''
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
const MAX_MB = 20

export default function Upload() {
  const [authed, setAuthed] = useState(!UPLOAD_PASSWORD)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)

  const [files, setFiles] = useState([]) // { file, preview, progress, status }
  const [dragover, setDragover] = useState(false)
  const [uploaderName, setUploaderName] = useState('')
  const [globalStatus, setGlobalStatus] = useState(null) // 'uploading' | 'done'
  const inputRef = useRef()

  function checkPassword(e) {
    e.preventDefault()
    if (pwInput === UPLOAD_PASSWORD) { setAuthed(true) } else { setPwError(true) }
  }

  function addFiles(rawFiles) {
    const incoming = Array.from(rawFiles)
      .filter(f => ACCEPTED.includes(f.type) && f.size <= MAX_MB * 1024 * 1024)
      .map(file => ({ file, preview: URL.createObjectURL(file), progress: 0, status: 'pending' }))
    setFiles(prev => [...prev, ...incoming])
  }

  const onDrop = useCallback(e => {
    e.preventDefault()
    setDragover(false)
    addFiles(e.dataTransfer.files)
  }, [])

  function removeFile(idx) {
    setFiles(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  async function uploadOne(item, idx) {
    // 1. Get a presigned URL from our server-side API route
    const presignRes = await fetch('/api/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: item.file.name,
        contentType: item.file.type,
        fileSize: item.file.size,
        uploaderName,
      }),
    })
    if (!presignRes.ok) throw new Error('Could not get upload URL')
    const { url } = await presignRes.json()

    // 2. PUT the file directly to R2 using the presigned URL
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', url)
      xhr.setRequestHeader('Content-Type', item.file.type)

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          setFiles(prev => prev.map((f, i) => i === idx ? { ...f, progress: pct, status: 'uploading' } : f))
        }
      }
      xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`R2 error ${xhr.status}`))
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.send(item.file)
    })

    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'done', progress: 100 } : f))
  }

  async function uploadAll() {
    if (files.length === 0) return
    setGlobalStatus('uploading')
    await Promise.allSettled(files.map((item, idx) =>
      uploadOne(item, idx).catch(() =>
        setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'error' } : f))
      )
    ))
    setGlobalStatus('done')
  }

  // ── Password gate ──────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <>
        <Head><title>Share Photos</title></Head>
        <div className="page" style={{ maxWidth: 400 }}>
          <div className="page-header">
            <h1>Share Photos</h1>
            <p>Enter the guest code to upload</p>
          </div>
          <form onSubmit={checkPassword} className="rsvp-form">
            {pwError && <div className="alert alert-error">Incorrect code. Please try again.</div>}
            <div className="form-group">
              <label>Guest Code</label>
              <input
                type="password"
                value={pwInput}
                onChange={e => { setPwInput(e.target.value); setPwError(false) }}
                autoFocus
              />
            </div>
            <button className="btn" type="submit">Enter</button>
          </form>
        </div>
      </>
    )
  }

  // ── Upload UI ──────────────────────────────────────────────────────────────
  const allDone = files.length > 0 && files.every(f => f.status === 'done')

  return (
    <>
      <Head><title>Share Photos</title></Head>
      <div className="page">
        <div className="page-header">
          <h1>Share Your Photos</h1>
          <p>Upload memories from the day — they&apos;ll appear in the gallery for everyone to enjoy.</p>
        </div>

        {allDone ? (
          <div className="alert alert-success" style={{ maxWidth: 560 }}>
            All photos uploaded! <a href="/gallery" style={{ color: 'var(--deep)', textDecoration: 'underline' }}>View the gallery →</a>
          </div>
        ) : (
          <>
            <div className="rsvp-form" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Your Name (optional)</label>
                <input
                  value={uploaderName}
                  onChange={e => setUploaderName(e.target.value)}
                  placeholder="Jane Smith"
                  disabled={globalStatus === 'uploading'}
                />
              </div>
            </div>

            <div
              className={`upload-zone${dragover ? ' dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragover(true) }}
              onDragLeave={() => setDragover(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              style={{ maxWidth: 560 }}
            >
              <div className="upload-icon">📷</div>
              <p>Drag &amp; drop photos here, or click to select</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>JPEG, PNG, WebP, GIF, HEIC · Max {MAX_MB} MB each</p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(',')}
              multiple
              style={{ display: 'none' }}
              onChange={e => addFiles(e.target.files)}
            />

            {files.length > 0 && (
              <>
                <div className="upload-previews" style={{ maxWidth: 560, marginTop: '1.5rem' }}>
                  {files.map((item, idx) => (
                    <div key={idx} className="upload-preview-item">
                      <img src={item.preview} alt="" />
                      {item.status !== 'done' && (
                        <button className="remove-btn" onClick={() => removeFile(idx)} aria-label="Remove">×</button>
                      )}
                      {item.status === 'done' && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem' }}>✓</div>
                      )}
                      {item.status === 'error' && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(180,0,0,0.45)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem' }}>✗</div>
                      )}
                      {(item.status === 'uploading') && (
                        <div className="progress-bar-wrap">
                          <div className="progress-bar" style={{ width: `${item.progress}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '1.5rem', maxWidth: 560 }}>
                  <button className="btn" onClick={uploadAll} disabled={globalStatus === 'uploading'}>
                    {globalStatus === 'uploading'
                      ? 'Uploading…'
                      : `Upload ${files.length} photo${files.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}

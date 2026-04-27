import { useState } from 'react'
import Head from 'next/head'
import { db } from '../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const MEAL_OPTIONS = ['Chicken', 'Fish', 'Vegetarian', 'Vegan']

export default function RSVP() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    attending: 'yes',
    guests: '1',
    meal: MEAL_OPTIONS[0],
    dietary: '',
    message: '',
  })
  const [status, setStatus] = useState(null) // 'submitting' | 'success' | 'error'

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    try {
      await addDoc(collection(db, 'rsvps'), {
        ...form,
        guests: parseInt(form.guests, 10),
        submittedAt: serverTimestamp(),
      })
      setStatus('success')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <>
        <Head><title>RSVP Confirmed</title></Head>
        <div className="page" style={{ textAlign: 'center', paddingTop: '5rem' }}>
          <h1 style={{ color: 'var(--deep)', marginBottom: '1rem' }}>Thank you!</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.05rem', lineHeight: 1.8 }}>
            {form.attending === 'yes'
              ? `We can't wait to celebrate with you, ${form.name.split(' ')[0]}!`
              : `We'll miss you, ${form.name.split(' ')[0]}, but thank you for letting us know.`}
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>RSVP</title></Head>
      <div className="page">
        <div className="page-header">
          <h1>RSVP</h1>
          <p>Please respond by August 1st, 2026</p>
        </div>

        {status === 'error' && (
          <div className="alert alert-error">
            Something went wrong. Please try again or contact us directly.
          </div>
        )}

        <form className="rsvp-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input required value={form.name} onChange={set('name')} placeholder="Jane Smith" />
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input required type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" />
          </div>

          <div className="form-group">
            <label>Will you attend?</label>
            <div className="radio-group">
              <label>
                <input type="radio" value="yes" checked={form.attending === 'yes'} onChange={set('attending')} />
                Joyfully accepts
              </label>
              <label>
                <input type="radio" value="no" checked={form.attending === 'no'} onChange={set('attending')} />
                Regretfully declines
              </label>
            </div>
          </div>

          {form.attending === 'yes' && (
            <>
              <div className="form-group">
                <label>Number of Guests (including yourself)</label>
                <select value={form.guests} onChange={set('guests')}>
                  {[1, 2, 3, 4].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Meal Preference</label>
                <select value={form.meal} onChange={set('meal')}>
                  {MEAL_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Dietary Restrictions / Allergies</label>
                <input value={form.dietary} onChange={set('dietary')} placeholder="e.g. Gluten-free, Nut allergy" />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Message to the Couple (optional)</label>
            <textarea rows={4} value={form.message} onChange={set('message')} placeholder="Share a wish or note..." />
          </div>

          <button className="btn" type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Sending...' : 'Send RSVP'}
          </button>
        </form>
      </div>
    </>
  )
}

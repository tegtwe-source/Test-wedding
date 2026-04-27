import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Nav() {
  const { pathname } = useRouter()

  return (
    <nav className="nav">
      <div className="nav-inner">
        <span className="nav-brand">Sarah &amp; James</span>
        <ul className="nav-links">
          <li><Link href="/" className={pathname === '/' ? 'active' : ''}>Home</Link></li>
          <li><Link href="/rsvp" className={pathname === '/rsvp' ? 'active' : ''}>RSVP</Link></li>
          <li><Link href="/gallery" className={pathname === '/gallery' ? 'active' : ''}>Gallery</Link></li>
          <li><Link href="/upload" className={pathname === '/upload' ? 'active' : ''}>Share Photos</Link></li>
        </ul>
      </div>
    </nav>
  )
}

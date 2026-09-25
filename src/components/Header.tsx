import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 border-b-2 px-4"
      style={{ borderColor: 'var(--seaweed)', background: 'var(--linen)' }}
    >
      <nav className="page-wrap flex items-center justify-between py-3">
        <Link to="/" className="no-underline flex items-center">
          <img
            src="/logo-principal-transparente.png"
            alt="Club de lectura"
            className="h-10 w-auto"
          />
        </Link>

        <Link
          to="/biblioteca"
          className="flex items-center gap-2 text-sm font-bold no-underline px-4 py-2 transition-colors"
          style={{ color: 'var(--seaweed)', border: '2px solid var(--seaweed)' }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = 'var(--seaweed)'
            el.style.color = 'var(--linen)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = 'transparent'
            el.style.color = 'var(--seaweed)'
          }}
        >
          biblioteca
        </Link>
      </nav>
    </header>
  )
}

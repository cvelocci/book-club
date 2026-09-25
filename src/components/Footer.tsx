export default function Footer() {
  return (
    <footer
      className="mt-20 border-t-2 relative overflow-hidden"
      style={{ borderColor: 'var(--seaweed)', background: 'var(--linen)' }}
    >
      {/* Imagen decorativa pie de página */}
      <div className="w-full overflow-hidden" style={{ maxHeight: '120px' }}>
        <img
          src="/pie-de-pagina.png"
          alt=""
          aria-hidden="true"
          className="w-full object-cover object-top"
          style={{ display: 'block' }}
        />
      </div>

      <div
        className="page-wrap py-8 flex flex-col sm:flex-row items-center justify-between gap-6"
        style={{ borderTop: '2px solid var(--seaweed)' }}
      >
        <img
          src="/logo-principal-transparente.png"
          alt="Club de lectura"
          className="h-12 w-auto"
        />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--seaweed)', opacity: 0.5 }}>
          club de lectura · umbral
        </p>
      </div>
    </footer>
  )
}

export default function Footer() {
  return (
    <footer style={{ background: "var(--linen)" }}>
      {/* pie-de-pagina reemplaza la línea de borde */}
      <img
        src="/pie-de-pagina.png"
        alt=""
        aria-hidden="true"
        className="w-full block"
        style={{ height: "auto" }}
      />

      <div className="page-wrap py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <img
          src="/logo-principal-transparente.png"
          alt="Club de lectura"
          className="h-17 w-auto"
        />
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--seaweed)", opacity: 0.5 }}
        >
          club de lectura · umbral · ig: clubumbral
        </p>
      </div>
    </footer>
  );
}

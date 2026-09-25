export default function Footer() {
  return (
    <footer>
      <div className="page-wrap py-2 flex flex-col items-center gap-1">
        {/* <div className="m-0 p-0 leading-none">
          <img
            src="/pie-de-pagina.png"
            alt="Club de lectura"
            style={{ display: "block", margin: 0, padding: 0 }}
            className="max-w-full h-auto border-0"
          />
        </div> */}
        <img
          src="/logo-principal-transparente.png"
          alt="Club de lectura"
          className="block h-17 w-auto m-0"
        />
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--seaweed)", opacity: 0.5 }}
        >
          club de lectura
        </p>
        <a
          href="https://www.instagram.com/clubumbral/"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--seaweed)", opacity: 0.5 }}
        >
          ig: clubumbral
        </a>
      </div>
    </footer>
  );
}

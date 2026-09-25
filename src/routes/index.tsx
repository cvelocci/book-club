import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Film,
  ChevronDown,
  ChevronUp,
  Shuffle,
  Clock,
} from "lucide-react";
import { getIndexData, drawBook, previewPool } from "#/lib/books.functions";
import type { Book, DrawEvent, DrawFilters } from "#/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Club de lectura" }] }),
  component: HomePage,
});

/** Formatea 'YYYY-MM-DD' → 'octubre 2026' */
function formatMonth(dateStr: string): string {
  // Parsear como fecha local para evitar desfases de UTC
  const [year, month] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

const emptyFilters = (): DrawFilters => ({
  hasMovie: null,
  nationality: null,
  genre: null,
  shortBook: false,
  consigna: "",
});

// ─── Página principal ─────────────────────────────────────────────────────────

function HomePage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["indexData"],
    queryFn: () => getIndexData(),
  });

  const [filters, setFilters] = useState<DrawFilters>(emptyFilters());
  const [showCandidates, setShowCandidates] = useState(false);
  const [showPast, setShowPast] = useState(true);

  // Preview del pool con filtros actuales
  const { data: preview } = useQuery({
    queryKey: ["poolPreview", filters],
    queryFn: () => previewPool({ data: filters }),
    enabled: !!data,
    staleTime: 10_000,
  });

  const drawMut = useMutation({
    mutationFn: () => drawBook({ data: filters }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["indexData"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      setFilters(emptyFilters());
    },
  });

  const {
    latestDraw,
    pastDraws,
    candidates,
    availableCount,
    nationalities,
    genres,
    excludedAuthor,
  } = data ?? {
    latestDraw: null,
    pastDraws: [],
    candidates: [],
    availableCount: 0,
    nationalities: [],
    genres: [],
    excludedAuthor: null,
  };

  const noBooks = !isLoading && availableCount === 0 && !latestDraw;

  return (
    <div className="page-wrap py-10 space-y-10">
      {/* ── 1. Libro del mes (hero) ── */}
      <section className="space-y-4 rise-in relative">
        {/* Sticker decorativo */}
        <img
          src="/sticker-perro-leyendo.png"
          alt=""
          aria-hidden="true"
          className="sticker hidden lg:block"
          style={{
            width: 130,
            right: 10,
            top: 55,
          }}
        />

        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--pistachio-dark)" }}
        >
          {latestDraw?.target_month
            ? `leemos en ${formatMonth(latestDraw.target_month)}`
            : "¿qué leemos este mes?"}
        </p>

        {isLoading ? (
          <div className="card-flat p-8">
            <p style={{ color: "var(--seaweed)" }}>cargando…</p>
          </div>
        ) : noBooks ? (
          <div
            className="flex items-center gap-3 p-5"
            style={{
              background: "var(--candyfloss)",
              border: "2px solid var(--seaweed)",
            }}
          >
            <BookOpen
              className="w-5 h-5 shrink-0"
              style={{ color: "var(--seaweed)" }}
            />
            <p className="text-sm" style={{ color: "var(--seaweed)" }}>
              todavía no hay libros cargados.{" "}
              <Link to="/biblioteca" className="font-bold">
                cargá los libros del club →
              </Link>
            </p>
          </div>
        ) : latestDraw?.drawn_book ? (
          <WinnerCard book={latestDraw.drawn_book} event={latestDraw} />
        ) : (
          <div className="card-flat p-8">
            <p
              className="display-title text-2xl"
              style={{ color: "var(--seaweed)" }}
            >
              todavía no se sorteó este mes
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--seaweed)" }}>
              usá la sección de abajo para definir una consigna y sortear.
            </p>
          </div>
        )}
      </section>

      {/* ── 2. Consigna y sorteo ── */}
      <section className="card-flat textura-linen p-8 space-y-6 relative">
        {/* Stickers de ambiente */}
        <img
          src="/sticker-lampara.png"
          alt=""
          aria-hidden="true"
          className="sticker hidden md:block"
          style={{
            width: 70,
            top: 25,
            right: 23,
            transform: "rotate(10deg)",
          }}
        />
        <img
          src="/sticker-vaso-cafe.png"
          alt=""
          aria-hidden="true"
          className="sticker hidden md:block"
          style={{
            width: 60,
            bottom: 5,
            right: 20,
            transform: "rotate(-12deg)",
          }}
        />

        <div>
          <h2
            className="display-title text-2xl"
            style={{ color: "var(--seaweed)" }}
          >
            ¿alguna consigna este mes?
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--seaweed)", opacity: 0.75 }}
          >
            Opcional. Elegí atajos, escribí la tuya, o dejá todo vacío para un
            sorteo puro.
          </p>
        </div>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap gap-3">
          <FilterToggle
            label="tiene película"
            icon={<Film className="w-3.5 h-3.5" />}
            active={filters.hasMovie === true}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                hasMovie: f.hasMovie === true ? null : true,
              }))
            }
          />
          <FilterToggle
            label="cortito (< 250 págs)"
            active={filters.shortBook}
            onClick={() =>
              setFilters((f) => ({ ...f, shortBook: !f.shortBook }))
            }
          />
          {nationalities.length > 0 && (
            <NationalitySelect
              value={filters.nationality}
              options={nationalities}
              onChange={(v) => setFilters((f) => ({ ...f, nationality: v }))}
            />
          )}
          {genres.length > 0 && (
            <NationalitySelect
              value={filters.genre}
              options={genres}
              placeholder="género"
              onChange={(v) => setFilters((f) => ({ ...f, genre: v }))}
            />
          )}
        </div>

        {/* Consigna libre */}
        <div className="space-y-1.5">
          <label
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--seaweed)" }}
          >
            consigna libre
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 text-sm bg-transparent"
            style={{
              border: "2px solid var(--seaweed)",
              color: "var(--seaweed)",
            }}
            placeholder="ej: una historia de amor que termine mal, algo escrito por una mujer antes de 1950…"
            value={filters.consigna}
            onChange={(e) =>
              setFilters((f) => ({ ...f, consigna: e.target.value }))
            }
          />
        </div>

        {/* Info de exclusión y pool */}
        <div
          className="space-y-1 text-xs"
          style={{ color: "var(--seaweed)", opacity: 0.8 }}
        >
          {excludedAuthor && (
            <p>
              ↳ se excluye <strong>{excludedAuthor}</strong> (ganó el mes
              anterior)
            </p>
          )}
          {preview !== undefined && (
            <p>
              <strong>{preview.count}</strong>{" "}
              {preview.count === 1 ? "libro elegible" : "libros elegibles"} con
              estos filtros
            </p>
          )}
        </div>

        {/* Error del sorteo */}
        {drawMut.error && (
          <p
            className="text-sm px-4 py-3 font-medium"
            style={{
              background: "var(--candyfloss)",
              border: "2px solid var(--seaweed)",
              color: "var(--seaweed)",
            }}
          >
            {String(drawMut.error)}
          </p>
        )}

        {/* Botón sortear */}
        <DrawButton
          loading={drawMut.isPending}
          disabled={!isLoading && availableCount === 0 && !latestDraw}
          onClick={() => drawMut.mutate()}
        />
      </section>

      {/* ── 3. También compitieron ── */}
      {candidates.length > 0 && (
        <section className="space-y-3">
          <button
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest w-full text-left"
            style={{ color: "var(--seaweed)" }}
            onClick={() => setShowCandidates((v) => !v)}
          >
            <span>
              también compitieron
              {latestDraw?.target_month
                ? ` para ${formatMonth(latestDraw.target_month)}`
                : ""}{" "}
              ({candidates.length})
            </span>
            {showCandidates ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          {showCandidates && (
            <div className="space-y-2">
              {candidates.map((b) => (
                <BookRow key={b.id} book={b} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── 4. Ganadores anteriores ── */}
      {pastDraws.length > 0 && (
        <section className="space-y-3 relative">
          {/* Stickers de archivo */}
          <img
            src="/sticker-libros-apilados.png"
            alt=""
            aria-hidden="true"
            className="sticker hidden lg:block"
            style={{
              width: 80,
              top: -15,
              right: 60,
              transform: "rotate(7deg)",
            }}
          />
          <img
            src="/sticker-libro-abierto.png"
            alt=""
            aria-hidden="true"
            className="sticker hidden lg:block"
            style={{
              width: 65,
              top: -10,
              right: 155,
              transform: "rotate(-5deg)",
            }}
          />

          <button
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest w-full text-left"
            style={{ color: "var(--seaweed)" }}
            onClick={() => setShowPast((v) => !v)}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>ganadores anteriores ({pastDraws.length})</span>
            {showPast ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          {showPast && (
            <div className="space-y-3">
              {pastDraws.map((event) => (
                <PastWinnerRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function WinnerCard({ book, event }: { book: Book; event: DrawEvent }) {
  const monthLabel = event.target_month
    ? formatMonth(event.target_month)
    : new Date(event.created_at).toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric",
      });

  return (
    <div className="card-flat p-8 space-y-4">
      <div className="space-y-1">
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--pistachio-dark)" }}
        >
          ganador · {monthLabel}
        </p>
        <h2
          className="display-title text-4xl leading-none"
          style={{ color: "var(--seaweed)" }}
        >
          {book.title.toLowerCase()}
        </h2>
        <p className="text-lg font-bold" style={{ color: "var(--seaweed)" }}>
          {book.author}
        </p>
        {book.nationality && (
          <p
            className="text-sm"
            style={{ color: "var(--seaweed)", opacity: 0.7 }}
          >
            {book.nationality}
            {book.genre ? ` · ${book.genre}` : ""}
          </p>
        )}
      </div>

      {event.consigna && (
        <div
          className="px-4 py-3 text-sm italic"
          style={{
            borderLeft: "3px solid var(--pistachio)",
            color: "var(--seaweed)",
          }}
        >
          "{event.consigna}"
        </div>
      )}
    </div>
  );
}

function PastWinnerRow({ event }: { event: DrawEvent }) {
  const book = event.drawn_book;
  if (!book) return null;

  const date = new Date(event.created_at).toLocaleDateString("es-AR", {
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className="flex items-center gap-4 px-4 py-3"
      style={{ border: "2px solid var(--seaweed)", background: "var(--linen)" }}
    >
      <span
        className="text-xs font-bold uppercase tracking-wide w-16 shrink-0"
        style={{ color: "var(--seaweed)", opacity: 0.6 }}
      >
        {date}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold truncate" style={{ color: "var(--seaweed)" }}>
          {book.title}
        </p>
        <p
          className="text-xs"
          style={{ color: "var(--seaweed)", opacity: 0.75 }}
        >
          {book.author}
        </p>
      </div>
      {event.consigna && (
        <p
          className="text-xs italic hidden md:block max-w-xs truncate"
          style={{ color: "var(--seaweed)", opacity: 0.7 }}
        >
          "{event.consigna}"
        </p>
      )}
    </div>
  );
}

function BookRow({ book }: { book: Book }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5"
      style={{
        border: "1.5px solid var(--seaweed)",
        background: "var(--linen)",
      }}
    >
      <div className="min-w-0 flex-1">
        <span className="font-medium" style={{ color: "var(--seaweed)" }}>
          {book.title}
        </span>
        <span
          className="text-xs ml-2"
          style={{ color: "var(--seaweed)", opacity: 0.7 }}
        >
          {book.author}
        </span>
      </div>
      {book.genre && (
        <span
          className="text-xs hidden sm:inline"
          style={{ color: "var(--seaweed)", opacity: 0.6 }}
        >
          {book.genre}
        </span>
      )}
    </div>
  );
}

function FilterToggle({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors"
      style={{
        border: "2px solid var(--seaweed)",
        background: active ? "var(--seaweed)" : "transparent",
        color: active ? "var(--linen)" : "var(--seaweed)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function NationalitySelect({
  value,
  options,
  placeholder = "nacionalidad",
  onChange,
}: {
  value: string | null;
  options: string[];
  placeholder?: string;
  onChange: (v: string | null) => void;
}) {
  return (
    <select
      className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide bg-transparent"
      style={{ border: "2px solid var(--seaweed)", color: "var(--seaweed)" }}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">{placeholder}</option>
      {options.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}

function DrawButton({
  loading,
  disabled,
  onClick,
}: {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="flex items-center gap-2 px-6 py-3 font-bold text-sm uppercase tracking-widest transition-colors disabled:opacity-40"
      style={{
        background: "var(--pistachio)",
        color: "var(--seaweed)",
        border: "2px solid var(--seaweed)",
      }}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          const el = e.currentTarget;
          el.style.background = "var(--seaweed)";
          el.style.color = "var(--linen)";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = "var(--pistachio)";
        el.style.color = "var(--seaweed)";
      }}
    >
      <Shuffle className="w-4 h-4" />
      {loading ? "sorteando…" : "sortear libro del mes"}
    </button>
  );
}

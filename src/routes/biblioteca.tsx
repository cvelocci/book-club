import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Search,
  BookOpen,
  Film,
  Pencil,
  Trash2,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Tag,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Badge } from "#/components/ui/badge";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "#/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  listBooks,
  createBook,
  updateBook,
  deleteBook,
  seedDemoBooks,
  importBooks,
  listGenres,
  createGenre,
  deleteGenre,
} from "#/lib/books.functions";
import type { Book, Genre } from "#/lib/types";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [{ title: "Biblioteca · Club de lectura" }],
  }),
  component: BibliotecaPage,
});

/** Formatea 'YYYY-MM-DD' → 'oct. 2026' */
function formatMonthShort(dateStr: string): string {
  const [year, month] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-AR", {
    month: "short",
    year: "numeric",
  });
}

// ─── Formulario vacío ─────────────────────────────────────────────────────────

const emptyForm = (): Partial<Book> => ({
  title: "",
  author: "",
  genre: null,
  proposed_by: null,
  nationality: null,
  has_movie: false,
  pages: null,
  notes: null,
});

// ─── Componente principal ─────────────────────────────────────────────────────

function BibliotecaPage() {
  const qc = useQueryClient();

  // Datos
  const {
    data: books = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["books"],
    queryFn: () => listBooks(),
  });

  const { data: genres = [] } = useQuery({
    queryKey: ["genres"],
    queryFn: () => listGenres(),
  });

  // Filtros
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [estadoFilter, setEstadoFilter] = useState<
    "all" | "disponibles" | "sorteados"
  >("all");

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        !search ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase());
      const matchGenre = genreFilter === "all" || b.genre === genreFilter;
      const matchEstado =
        estadoFilter === "all" ||
        (estadoFilter === "disponibles" && !b.drawn_at) ||
        (estadoFilter === "sorteados" && !!b.drawn_at);
      return matchSearch && matchGenre && matchEstado;
    });
  }, [books, search, genreFilter, estadoFilter]);

  const available = books.filter((b) => !b.drawn_at);

  // Dialog alta/edición
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [form, setForm] = useState<Partial<Book>>(emptyForm());

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEdit(b: Book) {
    setEditing(b);
    setForm({ ...b });
    setFormOpen(true);
  }

  // Dialog borrar
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);

  // Dialog importar
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  // Mutations
  const createMut = useMutation({
    mutationFn: (d: Parameters<typeof createBook>[0]) => createBook(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      setFormOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: (d: Parameters<typeof updateBook>[0]) => updateBook(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      setFormOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (d: Parameters<typeof deleteBook>[0]) => deleteBook(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      setDeleteTarget(null);
    },
  });

  const seedMut = useMutation({
    mutationFn: () => seedDemoBooks(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });

  const importMut = useMutation({
    mutationFn: (raw: string) => importBooks({ data: { raw } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      setImportOpen(false);
      setImportText("");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      updateMut.mutate({ data: { id: editing.id, updates: form } });
    } else {
      createMut.mutate({
        data: form as Parameters<typeof createBook>[0]["data"],
      });
    }
  }

  // genres viene del useQuery de listGenres() — nombres para dropdowns
  const genreNames = genres.map((g: Genre) => g.name);

  return (
    <div className="page-wrap py-8 space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap relative">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-[var(--seaweed)] hover:text-[var(--seaweed)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="display-title text-3xl font-bold text-[var(--seaweed)]">
            Biblioteca
          </h1>
        </div>
        {/* Sticker decorativo */}
        <img
          src="/sticker-perro-libro.png"
          alt=""
          aria-hidden="true"
          className="sticker hidden md:block"
          style={{ width: 55, right: 150, top: 60, transform: "rotate(8deg)" }}
        />
        <img
          src="/sticker-anteojos.png"
          alt=""
          aria-hidden="true"
          className="sticker hidden lg:block"
          style={{ width: 55, right: 10, top: 60, transform: "rotate(-6deg)" }}
        />
        <Button
          onClick={openNew}
          className="bg-[var(--pistachio)] hover:bg-[var(--seaweed)] text-[var(--seaweed)] hover:text-[var(--linen)] gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar libro
        </Button>
      </div>

      {/* ── Contador ── */}
      <div className="card-flat textura-linen p-4 flex flex-wrap gap-4 items-center text-sm text-[var(--seaweed)] relative">
        <img
          src="/sticker-kindle.png"
          alt=""
          aria-hidden="true"
          className="sticker hidden md:block"
          style={{ width: 55, top: 3, right: 50, transform: "rotate(12deg)" }}
        />
        <img
          src="/sticker-manta.png"
          alt=""
          aria-hidden="true"
          className="sticker hidden lg:block"
          style={{ width: 50, top: 3, right: 100, transform: "rotate(-9deg)" }}
        />
        <span className="font-semibold">
          {books.length}{" "}
          {books.length === 1 ? "libro cargado" : "libros cargados"}
        </span>
        <span className="hidden sm:inline opacity-40">·</span>
        <span>
          <span
            className="font-semibold"
            style={{ color: "var(--pistachio-dark)" }}
          >
            {available.length}
          </span>{" "}
          disponibles para sortear
        </span>
        <span className="hidden sm:inline opacity-40">·</span>
        <span>
          <span className="font-semibold">
            {books.filter((b) => !!b.drawn_at).length}
          </span>{" "}
          ya leídos
        </span>
      </div>

      {/* ── Filtros ── */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--seaweed)]" />
          <Input
            className="pl-9"
            placeholder="Buscar por título o autor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Filtro de estado */}
        <div className="flex border-2 border-[var(--seaweed)]">
          {(["all", "disponibles", "sorteados"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setEstadoFilter(v)}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors"
              style={{
                background:
                  estadoFilter === v ? "var(--seaweed)" : "transparent",
                color: estadoFilter === v ? "var(--linen)" : "var(--seaweed)",
              }}
            >
              {v === "all" ? "todos" : v}
            </button>
          ))}
        </div>
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Género" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los géneros</SelectItem>
            {genreNames.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Estado de carga / error / vacío ── */}
      {isLoading && (
        <p className="text-center py-12 text-[var(--seaweed)]">
          Cargando libros…
        </p>
      )}

      {error && (
        <div className="card-flat p-6 text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-[var(--pistachio)] mx-auto" />
          <p className="font-medium text-[var(--seaweed)]">
            Error al cargar la biblioteca
          </p>
          <p className="text-sm text-[var(--seaweed)]">{String(error)}</p>
        </div>
      )}

      {!isLoading && !error && books.length === 0 && (
        <div className="card-flat p-10 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-[var(--pistachio)] mx-auto opacity-40" />
          <p className="display-title text-xl font-semibold text-[var(--seaweed)]">
            La biblioteca está vacía
          </p>
          <p className="text-sm text-[var(--seaweed)] max-w-xs mx-auto">
            Agregá libros de a uno o cargá la lista de ejemplo para probar
            rápido.
          </p>
          <div className="flex gap-3 justify-center flex-wrap pt-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => seedMut.mutate()}
              disabled={seedMut.isPending}
            >
              <Sparkles className="w-4 h-4" />
              {seedMut.isPending ? "Cargando…" : "Cargar lista de ejemplo"}
            </Button>
            <Button
              className="bg-[var(--pistachio)] hover:bg-[var(--seaweed)] text-[var(--seaweed)] hover:text-[var(--linen)] gap-2"
              onClick={openNew}
            >
              <Plus className="w-4 h-4" />
              Agregar libro
            </Button>
          </div>
        </div>
      )}

      {/* ── Tabla ── */}
      {!isLoading && !error && books.length > 0 && (
        <div className="card-flat overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--seaweed)]">
                <TableHead>Título</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead className="hidden md:table-cell">Género</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Propuesto por
                </TableHead>
                <TableHead className="hidden lg:table-cell">Nac.</TableHead>
                <TableHead className="hidden md:table-cell text-center">
                  🎬
                </TableHead>
                <TableHead className="hidden lg:table-cell text-right">
                  Págs.
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  Mes de lectura
                </TableHead>
                <TableHead className="w-20 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-[var(--seaweed)]"
                  >
                    Sin resultados
                    {search && ` para "${search}"`}
                    {genreFilter !== "all" && ` · ${genreFilter}`}
                    {estadoFilter !== "all" && ` · ${estadoFilter}`}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((book) => (
                  <TableRow
                    key={book.id}
                    className={`transition-colors ${
                      book.drawn_at
                        ? "opacity-50 hover:opacity-70"
                        : "hover:bg-[var(--candyfloss)]"
                    }`}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {book.drawn_at && (
                          <span className="badge-sorteado hidden sm:inline">
                            Sorteado
                          </span>
                        )}
                        {book.title}
                      </div>
                    </TableCell>
                    <TableCell className="text-[var(--seaweed)]">
                      {book.author}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {book.genre && (
                        <Badge variant="secondary" className="font-normal">
                          {book.genre}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-[var(--seaweed)]">
                      {book.proposed_by ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-[var(--seaweed)]">
                      {book.nationality ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center">
                      {book.has_movie ? (
                        <Film className="w-4 h-4 text-[var(--pistachio)] mx-auto" />
                      ) : (
                        <span className="text-[1px solid var(--seaweed)]">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right text-[var(--seaweed)]">
                      {book.pages ?? "—"}
                    </TableCell>
                    {/* Leído en */}
                    <TableCell className="hidden sm:table-cell">
                      {book.drawn_for_month ? (
                        <span
                          className="badge-sorteado"
                          title={`Sorteado para ${book.drawn_for_month}`}
                        >
                          {formatMonthShort(book.drawn_for_month)}
                        </span>
                      ) : (
                        <span style={{ opacity: 0.3 }}>—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {book.drawn_at ? (
                        <span
                          className="text-xs px-2 py-1 opacity-40"
                          style={{ color: "var(--seaweed)" }}
                          title="No se puede modificar un libro ya sorteado"
                        >
                          -
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-1.5 hover:bg-[var(--candyfloss)] text-[var(--seaweed)] transition-colors"
                            onClick={() => openEdit(book)}
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1.5 hover:bg-[var(--candyfloss)] text-[var(--seaweed)] transition-colors"
                            onClick={() => setDeleteTarget(book)}
                            title="Borrar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Gestión de géneros ── */}
      <GenreManager genres={genres} />

      {/* ──────────────── Dialogs ──────────────── */}

      {/* Alta / Edición */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="display-title text-xl">
              {editing ? "Editar libro" : "Agregar libro"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  required
                  value={form.title ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="author">Autor *</Label>
                <Input
                  id="author"
                  required
                  value={form.author ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, author: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="genre">Género</Label>
                <Select
                  value={form.genre ?? ""}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, genre: v || null }))
                  }
                >
                  <SelectTrigger id="genre">
                    <SelectValue placeholder="Seleccioná…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin género</SelectItem>
                    {genreNames.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proposed_by">Quién lo propuso</Label>
                <Input
                  id="proposed_by"
                  value={form.proposed_by ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      proposed_by: e.target.value || null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nationality">Nacionalidad</Label>
                <Input
                  id="nationality"
                  value={form.nationality ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      nationality: e.target.value || null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pages">Páginas</Label>
                <Input
                  id="pages"
                  type="number"
                  min={1}
                  value={form.pages ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pages: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={form.notes ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value || null }))
                  }
                  placeholder="Opcional…"
                />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch
                  id="has_movie"
                  checked={!!form.has_movie}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, has_movie: v }))
                  }
                />
                <Label htmlFor="has_movie">¿Tiene película o serie?</Label>
              </div>
            </div>

            {(createMut.error || updateMut.error) && (
              <p className="text-sm text-red-600">
                {String(createMut.error ?? updateMut.error)}
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMut.isPending || updateMut.isPending}
                className="bg-[var(--pistachio)] hover:bg-[var(--seaweed)] text-[var(--seaweed)] hover:text-[var(--linen)]"
              >
                {createMut.isPending || updateMut.isPending
                  ? "Guardando…"
                  : editing
                    ? "Guardar cambios"
                    : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar borrado */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="display-title">
              ¿Borrar este libro?
            </DialogTitle>
            <DialogDescription>
              Se eliminará <strong>«{deleteTarget?.title}»</strong> de{" "}
              {deleteTarget?.author}. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() =>
                deleteTarget &&
                deleteMut.mutate({ data: { id: deleteTarget.id } })
              }
            >
              {deleteMut.isPending ? "Borrando…" : "Borrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Importar desde planilla */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="display-title">
              Importar desde planilla
            </DialogTitle>
            <DialogDescription>
              Copiá las filas de tu planilla (Google Sheets, Excel) y pegálas
              acá. Cada fila debe tener las columnas en este orden:
              <br />
              <code className="text-xs mt-1 block">
                Título · Autor · Género · Propuesto por · Nacionalidad ·
                ¿Película? · Páginas · Notas
              </code>
            </DialogDescription>
          </DialogHeader>

          <Textarea
            rows={8}
            className="font-mono text-xs"
            placeholder={`El aleph\tBorges\tCuentos\tLucía\tArgentina\tno\t192\t`}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />

          {importMut.error && (
            <p className="text-sm text-red-600">{String(importMut.error)}</p>
          )}
          {importMut.isSuccess && (
            <p className="text-sm text-green-700">
              ✓ Libros importados correctamente
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!importText.trim() || importMut.isPending}
              className="bg-[var(--pistachio)] hover:bg-[var(--seaweed)] text-[var(--seaweed)] hover:text-[var(--linen)]"
              onClick={() => importMut.mutate(importText)}
            >
              {importMut.isPending ? "Importando…" : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Gestión de géneros ───────────────────────────────────────────────────────

function GenreManager({ genres }: { genres: Genre[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const createMut = useMutation({
    mutationFn: (name: string) => createGenre({ data: { name } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genres"] });
      setNewName("");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteGenre({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["genres"] }),
  });

  return (
    <section className="space-y-3">
      <button
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest w-full text-left"
        style={{ color: "var(--seaweed)" }}
        onClick={() => setOpen((v) => !v)}
      >
        <Tag className="w-3.5 h-3.5" />
        <span>géneros ({genres.length})</span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {open && (
        <div className="card-flat p-5 space-y-4 textura-linen">
          {/* Lista de géneros */}
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <span
                key={g.id}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold"
                style={{
                  border: "1.5px solid var(--seaweed)",
                  color: "var(--seaweed)",
                }}
              >
                {g.name}
                <button
                  className="hover:text-red-600 transition-colors"
                  disabled={deleteMut.isPending}
                  onClick={() => deleteMut.mutate(g.id)}
                  title="Eliminar género"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {genres.length === 0 && (
              <p
                className="text-sm"
                style={{ color: "var(--seaweed)", opacity: 0.6 }}
              >
                No hay géneros cargados.
              </p>
            )}
          </div>

          {/* Agregar nuevo */}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (newName.trim()) createMut.mutate(newName.trim());
            }}
          >
            <input
              type="text"
              className="flex-1 px-3 py-1.5 text-sm bg-transparent"
              style={{
                border: "2px solid var(--seaweed)",
                color: "var(--seaweed)",
              }}
              placeholder="Nuevo género…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              type="submit"
              disabled={!newName.trim() || createMut.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide disabled:opacity-40"
              style={{
                background: "var(--pistachio)",
                color: "var(--seaweed)",
                border: "2px solid var(--seaweed)",
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              agregar
            </button>
          </form>

          {createMut.error && (
            <p className="text-xs text-red-600">{String(createMut.error)}</p>
          )}
        </div>
      )}
    </section>
  );
}

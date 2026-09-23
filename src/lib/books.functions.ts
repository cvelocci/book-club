import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { supabaseAdmin } from './supabase.server'
import type { Book, DrawEvent, DrawFilters, Genre, IndexData } from './types'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const BookSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  author: z.string().min(1, 'El autor es obligatorio'),
  genre: z.string().optional().nullable(),
  proposed_by: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  has_movie: z.boolean().default(false),
  pages: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  drawn_at: z.string().optional().nullable(),
})

const DrawFiltersSchema = z.object({
  hasMovie: z.boolean().nullable().optional(),
  nationality: z.string().nullable().optional(),
  genre: z.string().nullable().optional(),
  shortBook: z.boolean().default(false),
  consigna: z.string().default(''),
})

// ─── Helper: construir pool de libros elegibles ────────────────────────────────

async function buildPool(
  filters: DrawFilters,
  excludeAuthor: string | null,
): Promise<Book[]> {
  let query = supabaseAdmin
    .from('books')
    .select('*')
    .is('drawn_at', null)

  if (filters.hasMovie === true) query = query.eq('has_movie', true)
  if (filters.hasMovie === false) query = query.eq('has_movie', false)
  if (filters.nationality) query = query.eq('nationality', filters.nationality)
  if (filters.genre) query = query.eq('genre', filters.genre)
  if (filters.shortBook) query = query.lt('pages', 250)
  if (excludeAuthor) query = query.neq('author', excludeAuthor)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Book[]
}

// ─── Helper: obtener el autor del último sorteo ────────────────────────────────

async function getLastWinnerAuthor(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('draw_events')
    .select('drawn_book:books!drawn_book_id(author)')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // @ts-expect-error — Supabase join typing
  return (data?.drawn_book?.author as string | undefined) ?? null
}

// ─── Server functions ─────────────────────────────────────────────────────────

/** Todo lo que necesita la página principal en una sola llamada. */
export const getIndexData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<IndexData> => {
    // Todos los sorteos (con el libro ganador embebido por FK join)
    const { data: allDraws } = await supabaseAdmin
      .from('draw_events')
      .select('*, drawn_book:books!drawn_book_id(*)')
      .order('created_at', { ascending: false })

    const draws = (allDraws ?? []) as DrawEvent[]
    const latestDraw = draws[0] ?? null
    const pastDraws = draws.slice(1)

    // Candidatos del último sorteo (sin el ganador)
    let candidates: Book[] = []
    if (latestDraw?.candidate_ids?.length) {
      const otherIds = latestDraw.candidate_ids.filter(
        (id) => id !== latestDraw.drawn_book_id,
      )
      if (otherIds.length > 0) {
        const { data } = await supabaseAdmin.from('books').select('*').in('id', otherIds)
        candidates = (data ?? []) as Book[]
      }
    }

    // Conteo de libros disponibles
    const { count } = await supabaseAdmin
      .from('books')
      .select('*', { count: 'exact', head: true })
      .is('drawn_at', null)

    // Nacionalidades y géneros únicos en el pool disponible
    const { data: natData } = await supabaseAdmin
      .from('books')
      .select('nationality')
      .is('drawn_at', null)
      .not('nationality', 'is', null)

    const nationalities = [
      ...new Set((natData ?? []).map((b) => b.nationality).filter(Boolean) as string[]),
    ].sort()

    const { data: genreData } = await supabaseAdmin
      .from('books')
      .select('genre')
      .is('drawn_at', null)
      .not('genre', 'is', null)

    const genres = [
      ...new Set((genreData ?? []).map((b) => b.genre).filter(Boolean) as string[]),
    ].sort()

    // Autor excluido del próximo sorteo = ganador del último draw
    const excludedAuthor = (latestDraw?.drawn_book?.author as string | undefined) ?? null

    return {
      latestDraw,
      pastDraws,
      candidates,
      availableCount: count ?? 0,
      nationalities,
      genres,
      excludedAuthor,
    }
  },
)

/** Vista previa: cuántos libros quedarían elegibles con los filtros actuales. */
export const previewPool = createServerFn({ method: 'POST' })
  .validator(DrawFiltersSchema)
  .handler(async ({ data }): Promise<{ count: number }> => {
    const excludeAuthor = await getLastWinnerAuthor()
    const pool = await buildPool(data as DrawFilters, excludeAuthor)
    return { count: pool.length }
  })

/** Realiza el sorteo, guarda el evento y marca el ganador. */
export const drawBook = createServerFn({ method: 'POST' })
  .validator(DrawFiltersSchema)
  .handler(async ({ data }): Promise<{ winner: Book; event: DrawEvent }> => {
    const excludeAuthor = await getLastWinnerAuthor()
    const pool = await buildPool(data as DrawFilters, excludeAuthor)

    if (pool.length === 0) {
      throw new Error(
        'No hay libros elegibles con estos filtros. Probá con menos restricciones.',
      )
    }

    const winner = pool[Math.floor(Math.random() * pool.length)]

    // El sorteo es siempre para el mes siguiente
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const targetMonth = nextMonth.toISOString().slice(0, 10) // 'YYYY-MM-DD'

    // Marcar ganador como sorteado (con el mes objetivo)
    const { error: updateError } = await supabaseAdmin
      .from('books')
      .update({ drawn_at: now.toISOString(), drawn_for_month: targetMonth })
      .eq('id', winner.id)
    if (updateError) throw new Error(updateError.message)

    // Registrar evento
    const { data: event, error: insertError } = await supabaseAdmin
      .from('draw_events')
      .insert({
        drawn_book_id: winner.id,
        candidate_ids: pool.map((b) => b.id),
        filter_has_movie: data.hasMovie ?? null,
        filter_nationality: data.nationality ?? null,
        filter_short_book: data.shortBook || null,
        consigna: data.consigna || null,
        target_month: targetMonth,
      })
      .select('*, drawn_book:books!drawn_book_id(*)')
      .single()

    if (insertError) throw new Error(insertError.message)
    return { winner, event: event as unknown as DrawEvent }
  })

export const listBooks = createServerFn({ method: 'GET' }).handler(async (): Promise<Book[]> => {
  const { data, error } = await supabaseAdmin
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Book[]
})

export const createBook = createServerFn({ method: 'POST' })
  .validator(BookSchema.omit({ drawn_at: true }))
  .handler(async ({ data }): Promise<Book> => {
    const { data: row, error } = await supabaseAdmin
      .from('books')
      .insert(data)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return row as Book
  })

export const updateBook = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().uuid(),
      updates: BookSchema.partial(),
    }),
  )
  .handler(async ({ data }): Promise<Book> => {
    const { data: row, error } = await supabaseAdmin
      .from('books')
      .update(data.updates)
      .eq('id', data.id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return row as Book
  })

export const deleteBook = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<void> => {
    const { error } = await supabaseAdmin.from('books').delete().eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const markDrawn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<Book> => {
    const { data: row, error } = await supabaseAdmin
      .from('books')
      .update({ drawn_at: new Date().toISOString() })
      .eq('id', data.id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return row as Book
  })

export const seedDemoBooks = createServerFn({ method: 'POST' }).handler(
  async (): Promise<number> => {
    const demo = [
      { title: 'Cien años de soledad', author: 'Gabriel García Márquez', genre: 'Realismo mágico', proposed_by: 'Ana', nationality: 'Colombia', has_movie: false, pages: 432 },
      { title: 'El nombre de la rosa', author: 'Umberto Eco', genre: 'Histórica', proposed_by: 'Tomás', nationality: 'Italia', has_movie: true, pages: 502 },
      { title: 'Ficciones', author: 'Jorge Luis Borges', genre: 'Cuentos', proposed_by: 'Lucía', nationality: 'Argentina', has_movie: false, pages: 224 },
      { title: 'La insoportable levedad del ser', author: 'Milan Kundera', genre: 'Novela filosófica', proposed_by: 'Martín', nationality: 'República Checa', has_movie: true, pages: 360 },
      { title: 'Pedro Páramo', author: 'Juan Rulfo', genre: 'Realismo mágico', proposed_by: 'Sofía', nationality: 'México', has_movie: false, pages: 128 },
      { title: 'El aleph', author: 'Jorge Luis Borges', genre: 'Cuentos', proposed_by: 'Diego', nationality: 'Argentina', has_movie: false, pages: 192 },
      { title: 'Rayuela', author: 'Julio Cortázar', genre: 'Experimental', proposed_by: 'Elena', nationality: 'Argentina', has_movie: false, pages: 600 },
      { title: 'La casa de los espíritus', author: 'Isabel Allende', genre: 'Realismo mágico', proposed_by: 'Camila', nationality: 'Chile', has_movie: true, pages: 468 },
      { title: 'El túnel', author: 'Ernesto Sabato', genre: 'Psicológica', proposed_by: 'Ignacio', nationality: 'Argentina', has_movie: false, pages: 168 },
      { title: 'Conversación en La Catedral', author: 'Mario Vargas Llosa', genre: 'Novela política', proposed_by: 'Paula', nationality: 'Perú', has_movie: false, pages: 602 },
      { title: 'Los detectives salvajes', author: 'Roberto Bolaño', genre: 'Novela', proposed_by: 'Rodrigo', nationality: 'Chile', has_movie: false, pages: 640 },
      { title: 'Sobre héroes y tumbas', author: 'Ernesto Sabato', genre: 'Novela', proposed_by: 'Valentina', nationality: 'Argentina', has_movie: false, pages: 541 },
      { title: 'El otoño del patriarca', author: 'Gabriel García Márquez', genre: 'Novela política', proposed_by: 'Marco', nationality: 'Colombia', has_movie: false, pages: 336 },
      { title: 'Bestiario', author: 'Julio Cortázar', genre: 'Cuentos', proposed_by: 'Florencia', nationality: 'Argentina', has_movie: false, pages: 186 },
      { title: 'Altazor', author: 'Vicente Huidobro', genre: 'Poesía', proposed_by: 'Nicolás', nationality: 'Chile', has_movie: false, pages: 112 },
    ]

    const { data, error } = await supabaseAdmin.from('books').insert(demo).select()
    if (error) throw new Error(error.message)
    return data?.length ?? 0
  },
)

/**
 * Importa libros desde texto pegado de una planilla (formato TSV).
 * Columnas esperadas: Título, Autor, Género, Propuesto por, Nacionalidad, ¿Película? (sí/no), Páginas, Notas
 */
export const importBooks = createServerFn({ method: 'POST' })
  .validator(z.object({ raw: z.string().min(1) }))
  .handler(async ({ data }): Promise<number> => {
    const lines = data.raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const books = lines.map((line) => {
      const cols = line.split('\t').map((c) => c.trim())
      const [title = '', author = '', genre, proposed_by, nationality, movieRaw, pagesRaw, notes] =
        cols

      const hasMovie = /^(sí|si|yes|true|1|✓)$/i.test(movieRaw ?? '')
      const pages = pagesRaw ? parseInt(pagesRaw.replace(/\D/g, ''), 10) || null : null

      return {
        title: title || 'Sin título',
        author: author || 'Desconocido',
        genre: genre || null,
        proposed_by: proposed_by || null,
        nationality: nationality || null,
        has_movie: hasMovie,
        pages,
        notes: notes || null,
      }
    })

    const valid = books.filter((b) => b.title && b.author)
    if (valid.length === 0) throw new Error('No se encontraron filas válidas para importar')

    const { data: rows, error } = await supabaseAdmin.from('books').insert(valid).select()
    if (error) throw new Error(error.message)
    return rows?.length ?? 0
  })

// ─── Géneros ──────────────────────────────────────────────────────────────────

export const listGenres = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Genre[]> => {
    const { data, error } = await supabaseAdmin
      .from('genres')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []) as Genre[]
  },
)

export const createGenre = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string().min(1, 'El nombre es obligatorio') }))
  .handler(async ({ data }): Promise<Genre> => {
    const { data: row, error } = await supabaseAdmin
      .from('genres')
      .insert({ name: data.name.trim() })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as Genre
  })

export const deleteGenre = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<void> => {
    const { error } = await supabaseAdmin.from('genres').delete().eq('id', data.id)
    if (error) throw new Error(error.message)
  })

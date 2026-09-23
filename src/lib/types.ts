export type Book = {
  id: string
  title: string
  author: string
  genre: string | null
  proposed_by: string | null
  nationality: string | null
  has_movie: boolean
  pages: number | null
  notes: string | null
  drawn_at: string | null
  drawn_for_month: string | null  // 'YYYY-MM-DD' — mes para el que fue sorteado
  created_at: string
}

export type BookInsert = Omit<Book, 'id' | 'created_at'>
export type BookUpdate = Partial<BookInsert>

export type DrawEvent = {
  id: string
  drawn_book_id: string | null
  candidate_ids: string[]
  filter_has_movie: boolean | null
  filter_nationality: string | null
  filter_short_book: boolean | null
  consigna: string | null
  target_month: string  // 'YYYY-MM-DD' — primer día del mes objetivo
  created_at: string
  drawn_book: Book | null  // joined via Supabase FK
}

export type DrawFilters = {
  hasMovie: boolean | null
  nationality: string | null
  genre: string | null
  shortBook: boolean
  consigna: string
}

export type IndexData = {
  latestDraw: DrawEvent | null
  pastDraws: DrawEvent[]
  candidates: Book[]
  availableCount: number
  nationalities: string[]
  genres: string[]
  excludedAuthor: string | null
}

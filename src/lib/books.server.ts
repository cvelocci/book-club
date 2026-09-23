import { supabase } from './supabase'
import type { Book } from './types'

/**
 * Carga todos los libros del club ordenados por fecha de creación (más recientes primero).
 * Usado desde loaders de servidor — lee con el cliente público (RLS de lectura pública).
 */
export async function loadBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Error al cargar libros: ${error.message}`)
  return (data ?? []) as Book[]
}

/**
 * Devuelve los libros disponibles para el próximo sorteo:
 * - No sorteados aún (drawn_at IS NULL)
 * - Excluye al autor del último libro sorteado (para no repetir)
 * - Excluye el género del último libro sorteado (para no repetir)
 */
export async function getAvailableBooks(
  lastDrawnAuthor?: string | null,
  lastDrawnGenre?: string | null,
): Promise<Book[]> {
  let query = supabase
    .from('books')
    .select('*')
    .is('drawn_at', null)
    .order('created_at', { ascending: true })

  if (lastDrawnAuthor) {
    query = query.not('author', 'ilike', `%${lastDrawnAuthor}%`)
  }
  if (lastDrawnGenre) {
    query = query.not('genre', 'eq', lastDrawnGenre)
  }

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener libros disponibles: ${error.message}`)
  return (data ?? []) as Book[]
}

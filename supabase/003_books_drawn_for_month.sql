-- Migración 003: columna drawn_for_month en books
-- Corré esto en el SQL Editor de Supabase

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS drawn_for_month date;

-- Índice para filtrar rápido por estado (disponible / sorteado)
CREATE INDEX IF NOT EXISTS books_drawn_for_month_idx ON books (drawn_for_month);

-- Si ya tenés la tabla draw_events con datos, podés rellenar los registros existentes:
-- UPDATE books b
-- SET drawn_for_month = de.target_month
-- FROM draw_events de
-- WHERE de.drawn_book_id = b.id
--   AND b.drawn_for_month IS NULL;

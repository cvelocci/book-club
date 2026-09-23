-- Tabla de libros del club
CREATE TABLE IF NOT EXISTS books (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  author       text NOT NULL,
  genre        text,
  proposed_by  text,
  nationality  text,
  has_movie    boolean DEFAULT false,
  pages        integer,
  notes        text,
  drawn_at     timestamptz,  -- NULL = disponible para sorteo; se actualiza al sortear
  created_at   timestamptz DEFAULT now()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS books_drawn_at_idx ON books (drawn_at);
CREATE INDEX IF NOT EXISTS books_genre_idx    ON books (genre);

-- RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Lectura pública (cualquier miembro del club puede ver la lista)
CREATE POLICY "lectura_publica" ON books
  FOR SELECT USING (true);

-- Escritura solo desde el servidor (service_role bypasses RLS por defecto)
-- No se necesita policy explícita para service_role; sí para authenticated si luego se agrega auth.

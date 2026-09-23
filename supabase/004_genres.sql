-- Migración 004: tabla de géneros
-- Corré esto en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS genres (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectura_publica_genres"
  ON genres FOR SELECT USING (true);

-- Cargar los géneros iniciales
INSERT INTO genres (name) VALUES
  ('Novela romántica'),
  ('Romantasy'),
  ('Thriller'),
  ('Thriller psicológico'),
  ('Novela negra'),
  ('Novela distópica'),
  ('Misterio'),
  ('Policíaco'),
  ('Fantasía'),
  ('Ciencia ficción'),
  ('Desarrollo personal'),
  ('Ficción histórica'),
  ('Ficción contemporánea'),
  ('Ensayo divulgativo'),
  ('Biografías'),
  ('Memorias'),
  ('Realismo mágico'),
  ('Otro')
ON CONFLICT (name) DO NOTHING;

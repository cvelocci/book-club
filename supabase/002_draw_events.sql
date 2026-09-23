-- Migración 002: tabla de eventos de sorteo
-- Corré esto en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS draw_events (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  drawn_book_id      uuid        REFERENCES books(id) ON DELETE SET NULL,
  candidate_ids      uuid[]      NOT NULL DEFAULT '{}',
  filter_has_movie   boolean,      -- null = sin filtro, true/false = con filtro
  filter_nationality text,         -- null = sin filtro
  filter_short_book  boolean,      -- null = sin filtro
  consigna           text,         -- consigna libre (solo metadata)
  -- Mes para el que se sorteó (siempre el mes siguiente al sorteo)
  -- Se guarda como primer día del mes: ej. '2026-10-01' para octubre 2026
  target_month       date        NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS draw_events_created_at_idx   ON draw_events (created_at DESC);
CREATE INDEX IF NOT EXISTS draw_events_target_month_idx ON draw_events (target_month DESC);

ALTER TABLE draw_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectura_publica_draw_events"
  ON draw_events FOR SELECT USING (true);

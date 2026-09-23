import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL as string
const anon = process.env.SUPABASE_ANON_KEY as string

if (!url || !anon) {
  throw new Error('Faltan variables de entorno SUPABASE_URL y/o SUPABASE_ANON_KEY')
}

/** Cliente público (lectura, lado cliente/servidor sin privilegios) */
export const supabase = createClient(url, anon)

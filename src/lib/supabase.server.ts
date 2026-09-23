import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL as string
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!url || !serviceKey) {
  throw new Error('Faltan variables de entorno SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
}

/** Cliente con service role — SOLO usar en server functions (nunca exponer al cliente) */
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
})

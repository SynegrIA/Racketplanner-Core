import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/config'

// Crea e inicializa el cliente
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

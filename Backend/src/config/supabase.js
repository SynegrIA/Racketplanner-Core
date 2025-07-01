// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carga las variables de entorno
dotenv.config()

// URL de tu proyecto (encotrada en el dashboard de Supabase)
const SUPABASE_URL = process.env.SUPABASE_URL

// Usa ANON_KEY para operaciones de lectura/escritura estándar desde el servidor.
// Si necesitas acceso con más privilegios, usa SERVICE_ROLE_KEY, pero mucho cuidado
// de no exponerla en el frontend.
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY

// Crea e inicializa el cliente
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

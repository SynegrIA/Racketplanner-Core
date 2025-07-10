import dotenv from 'dotenv'

dotenv.config

export const DOMINIO_BACKEND = import.meta.env.NODE_ENV == 'production' ? import.meta.env.VITE_DOMINIO_BACKEND_PROD : import.meta.env.VITE_DOMINIO_BACKEND_DEV
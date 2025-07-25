import dotenv from 'dotenv'

dotenv.config

export const NODE_ENV = import.meta.env.NODE_ENV || 'development';

export const DOMINIO_BACKEND = NODE_ENV == 'production' ? import.meta.env.VITE_DOMINIO_BACKEND_PROD : import.meta.env.VITE_DOMINIO_BACKEND_DEV
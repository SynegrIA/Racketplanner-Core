import dotenv from 'dotenv'

dotenv.config

export const NODE_ENV = import.meta.env.VITE_NODE_ENV || 'development';

export const DOMINIO_BACKEND = NODE_ENV == 'production' ? import.meta.env.VITE_DOMINIO_BACKEND_PROD : import.meta.env.VITE_DOMINIO_BACKEND_DEV

export const APP_LOCALE = import.meta.env.VITE_APP_LOCALE

export const NUMBER_PREFIX = import.meta.env.VITE_NUMBER_PREFIX

export const APP_THEME = import.meta.env.VITE_THEME || 'default';

export const PASARELA = import.meta.env.VITE_PASARELA

export const NIVELES_JUGADORES = import.meta.env.VITE_NIVELES_JUGADORES === "true" || false
export const NIVELES_LIMIT = {
    MIN: import.meta.env.VITE_NIVEL_MIN,
    MAX: import.meta.env.VITE_NIVEL_MAX
}

export const PARTIDAS_MIXTAS_OPTION = import.meta.env.VITE_PARTIDAS_MIXTAS_OPTION === 'true' || false
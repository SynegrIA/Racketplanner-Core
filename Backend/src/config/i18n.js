import { readFileSync } from 'fs';
import { join } from 'path';
import { APP_LOCALE } from './config.js';
// Importaciones estáticas
import esTranslations from './locales/es.js';
import frTranslations from './locales/fr.js';

// Obtener el idioma de las variables de entorno o usar español por defecto
const LOCALE = APP_LOCALE

// Cargar los archivos de traducción
const translations = {
    es: esTranslations,
    fr: frTranslations
};

/**
 * Traduce un texto usando la clave proporcionada
 * @param {string} key - Clave del mensaje a traducir
 * @param {Object} params - Parámetros para interpolar en el mensaje
 * @returns {string} - Mensaje traducido
 */
export function translate(key, params = {}) {
    // Añadir log para depuración
    console.log(`Traduciendo clave: ${key}, idioma: ${LOCALE}`);
    console.log(`Params:`, params);

    // Obtener la traducción según el idioma configurado
    const localeData = translations[LOCALE] || translations.es;

    // Si no hay datos de traducción, devolver la clave original
    if (!localeData) {
        console.error(`No hay datos de traducción para el idioma ${LOCALE}`);
        return key;
    }

    // Dividir la clave por puntos para acceder a objetos anidados
    const keys = key.split('.');
    let currentObj = localeData;

    // Navegar por el objeto de traducciones
    for (const k of keys) {
        if (currentObj && currentObj[k]) {
            currentObj = currentObj[k];
        } else {
            // Si no se encuentra la clave, devolver la clave original
            console.error(`No se encontró la clave de traducción: ${key}`);
            return replaceParams(key, params);
        }
    }

    let text = key;
    if (typeof currentObj === 'string') {
        text = currentObj;
        console.log(`Texto traducido: ${text}`);
    } else {
        console.error(`La clave ${key} no apunta a un string sino a:`, currentObj);
    }

    // Reemplazar los parámetros en el texto
    return replaceParams(text, params);
}

/**
 * Reemplaza los parámetros en un texto
 * @param {string} text - Texto con marcadores de posición
 * @param {Object} params - Valores para reemplazar
 * @returns {string} - Texto con valores reemplazados
 */
function replaceParams(text, params) {
    let result = text;

    // Reemplazar los parámetros en formato {{param}}
    Object.entries(params).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value);
    });

    return result;
}

export default {
    translate,
    getCurrentLocale: () => LOCALE
};
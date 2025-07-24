import { readFileSync } from 'fs';
import { join } from 'path';
import { APP_LOCALE } from '../../config/config.js';

// Obtener el idioma de las variables de entorno o usar español por defecto
const LOCALE = APP_LOCALE

// Cargar los archivos de traducción
const loadTranslations = () => {
    const translations = {};
    try {
        // Importar dinámicamente los archivos de traducción
        translations.es = require('../../config/locales/es.js').default;
        translations.fr = require('../../config/locales/fr.js').default;
    } catch (error) {
        console.error('Error cargando traducciones:', error);
    }
    return translations;
};

const translations = loadTranslations();

/**
 * Traduce un texto usando la clave proporcionada
 * @param {string} key - Clave del mensaje a traducir
 * @param {Object} params - Parámetros para interpolar en el mensaje
 * @returns {string} - Mensaje traducido
 */
export function translate(key, params = {}) {
    // Obtener la traducción según el idioma configurado
    const localeData = translations[LOCALE] || translations.es;

    // Obtener el texto para la clave dada o usar la clave como fallback
    let text = key;

    // Dividir la clave por puntos para acceder a objetos anidados
    const keys = key.split('.');
    let currentObj = localeData;

    // Navegar por el objeto de traducciones
    for (const k of keys) {
        if (currentObj && currentObj[k]) {
            currentObj = currentObj[k];
        } else {
            // Si no se encuentra la clave, devolver la clave original
            return replaceParams(key, params);
        }
    }

    if (typeof currentObj === 'string') {
        text = currentObj;
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
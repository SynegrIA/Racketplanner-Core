import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
    .use(Backend)               // Para cargar traducciones desde archivos
    .use(LanguageDetector)      // detecta lang del navegador
    .use(initReactI18next)      // pasa i18n a react-i18next
    .init({
        fallbackLng: 'fr',      // idioma por defecto
        interpolation: {
            escapeValue: false,  // React ya hace escaping
        },
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json', // ruta a los archivos de traducción
        },
    });

export default i18n;
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Carga estática de traducciones (por ahora ES y FR)
const resources = {
    es: {
        translation: {
            'booking.title': 'Reservar pista',
            'booking.button': 'Reservar',
        },
    },
    fr: {
        translation: {
            'booking.title': 'Réserver un court',
            'booking.button': 'Réserver',
        },
    },
};

i18n
    .use(LanguageDetector)       // detecta lang del navegador (puedes quitarlo)
    .use(initReactI18next)       // pasa i18n a react-i18next
    .init({
        resources,
        fallbackLng: 'es',         // idioma por defecto
        interpolation: {
            escapeValue: false,      // React ya hace escaping
        },
    });

export default i18n;

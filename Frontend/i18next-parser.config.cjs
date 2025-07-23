// i18next-parser.config.js  ➜  <raíz>/i18next-parser.config.js
module.exports = {
    // 1) Dónde buscar
    input: ['src/**/*.{js,jsx}'],

    // 2) Dónde generar JSON
    output: './src/i18n/locales/{{lng}}/{{ns}}.json',

    // 3) Idiomas y namespace por defecto
    defaultLng: 'es',
    lngs: ['es', 'fr'],
    defaultNs: 'translation',

    // Opciones extra (opcionales)
    keySeparator: '.',
    keepRemoved: true,
    sort: true,
};
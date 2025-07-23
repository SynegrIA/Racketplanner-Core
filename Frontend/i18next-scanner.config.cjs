// i18next-scanner.config.cjs   (en la raíz)
module.exports = {
    input: ['./src/**/*.{js,jsx}'],
    output: './src/i18n/locales/{{locale}}/{{ns}}.json',
    locales: ['es', 'fr'],
    lexers: {
        JSX: ['JsxLexer'],
        JS: ['JavascriptLexer'],
    },
    keyAsDefaultValue: true,

    // Activar detección de textos en funciones t() cuando los añadas
    func: {
        list: ['t'],
        extensions: ['.js', '.jsx']
    },

    // Detección de textos literales
    lngs: ['es', 'fr'],
    ns: ['translation'],
    defaultLng: 'es',
    defaultNs: 'translation',

    // Extraer textos directamente de JSX
    jsx: {
        useLiteralAsDefaultValue: true,
        transSupportBasicHtmlNodes: true,
        transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'b', 'em'],
        autoCloseTag: true
    },

    // No ignorar textos literales
    ignorePatterns: [],

    // Configuración para extraer textos directos
    defaultValue: function (lng, ns, key) {
        return key;
    },
    resource: {
        loadPath: './src/i18n/locales/{{lng}}/{{ns}}.json',
        savePath: './src/i18n/locales/{{lng}}/{{ns}}.json',
        jsonIndent: 2,
        lineEnding: '\n'
    },
    nsSeparator: ':',
    keySeparator: '.',
    interpolation: {
        prefix: '{{',
        suffix: '}}'
    }
};


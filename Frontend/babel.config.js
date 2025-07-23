module.exports = {
    presets: ['@babel/preset-react'],
    plugins: [['i18next-extract', {
        locales: ['es', 'fr'],
        keyAsDefaultValue: true,
        outputPath: 'locales/{{locale}}/{{ns}}.json'
    }]]
};
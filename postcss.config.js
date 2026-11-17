// Mesma configuração padrão do Next 14, com um alvo de navegador explícito e o
// plugin que troca `inset` por top/right/bottom/left para a WebView Chrome 66.
module.exports = {
  plugins: [
    'next/dist/compiled/postcss-flexbugs-fixes',
    [
      'next/dist/compiled/postcss-preset-env',
      {
        browsers: ['chrome >= 64', 'safari >= 12', 'firefox >= 67', 'edge >= 79'],
        autoprefixer: { flexbox: 'no-2009' },
        stage: 3,
        features: { 'custom-properties': false },
      },
    ],
    './scripts/postcss-legacy-tv.js',
  ],
};

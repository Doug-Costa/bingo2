/**
 * Roda depois do `next build`: falha o build se algum JS do site usar sintaxe
 * que a WebView mais antiga das TVs não entende (Android 9 hi352t = Chrome 66,
 * que vai até ES2018). Assim um pacote novo publicado com `?.`/`??` não chega
 * às TVs como tela preta em "Carregando…".
 */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const dir = path.join(__dirname, '..', '.next', 'static', 'chunks');
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js') && !/polyfills-/.test(f)) files.push(p);
  }
})(dir);

const bad = [];
for (const f of files) {
  try {
    acorn.parse(fs.readFileSync(f, 'utf8'), { ecmaVersion: 2018, sourceType: 'script' });
  } catch (e) {
    bad.push(`${path.relative(dir, f)}: ${e.message}`);
  }
}

if (bad.length) {
  console.error('\n[check-legacy-js] JS incompatível com Chrome 66 (TVs antigas):');
  for (const b of bad) console.error('  - ' + b);
  console.error('Adicione o pacote responsável em transpilePackages (next.config.js).\n');
  process.exit(1);
}
console.log(`[check-legacy-js] ${files.length} arquivos JS ok para Chrome 66 (ES2018).`);

// CSS: `inset` só existe a partir do Chrome 87. Sem ele as camadas de tela
// cheia ficam com tamanho zero e a TV mostra tela preta. O plugin
// scripts/postcss-legacy-tv.js troca por top/right/bottom/left; isto garante
// que nenhum CSS escapou dele.
const cssDir = path.join(__dirname, '..', '.next', 'static', 'css');
const cssBad = [];
if (fs.existsSync(cssDir)) {
  for (const f of fs.readdirSync(cssDir).filter((n) => n.endsWith('.css'))) {
    const n = (fs.readFileSync(path.join(cssDir, f), 'utf8').match(/[{;]\s*inset\s*:/g) || []).length;
    if (n) cssBad.push(`${f}: ${n}x inset`);
  }
}
if (cssBad.length) {
  console.error('\n[check-legacy-js] CSS incompatível com Chrome 66 (TVs antigas):');
  for (const b of cssBad) console.error('  - ' + b);
  process.exit(1);
}
console.log('[check-legacy-js] CSS sem `inset` (ok para Chrome 66).');

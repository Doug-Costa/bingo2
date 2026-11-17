/**
 * Plugin PostCSS para a WebView antiga das TVs (Chrome 66, ex.: hi352t).
 *
 * O Chrome antigo descarta a declaração inteira quando não entende um valor, então
 * cada item abaixo some da tela (ou desmonta o layout) nessas TVs. O plugin só
 * acrescenta alternativas: navegadores novos continuam usando o CSS original.
 *
 * 1. `inset` (Chrome 87+) → top/right/bottom/left. Sem isso as camadas
 *    `position: absolute/fixed; inset: 0` ficam com tamanho zero (tela preta).
 * 2. Paradas de cor com duas posições, `#000 0 0` / `transparent 0 17%`
 *    (Chrome 71+) → `#000 0, #000 0`. Sem isso o degradê ou a máscara inteira some.
 * 3. `conic-gradient` / `repeating-conic-gradient` (Chrome 69+) → imagem SVG
 *    equivalente, declarada antes da original (raios, anéis, bordas coloridas).
 * 4. `-webkit-mask` com `exclude` (sintaxe nova) → camadas sem `exclude` +
 *    `-webkit-mask-composite: xor` (sintaxe que o Chrome antigo entende).
 * 5. `gap` em flexbox (Chrome 84+) → margem entre os filhos, só quando o
 *    <html> tem a classe `no-flexgap` (detectada no boot, ver layout.tsx).
 */
const postcss = require('postcss');
const valueParser = require('next/dist/compiled/postcss-value-parser');

// ─── 1. inset ────────────────────────────────────────────────────────────────

function expandInset(decl) {
  const parts = postcss.list.space(decl.value);
  if (parts.length < 1 || parts.length > 4) return;
  const [t, r = t, b = t, l = r] = parts;
  for (const [prop, value] of [['top', t], ['right', r], ['bottom', b], ['left', l]]) {
    decl.cloneBefore({ prop, value });
  }
  decl.remove();
}

// ─── cores (para interpolar o cônico) ───────────────────────────────────────

const NAMED = {
  transparent: [0, 0, 0, 0],
  white: [255, 255, 255, 1],
  black: [0, 0, 0, 1],
  red: [255, 0, 0, 1],
  gold: [255, 215, 0, 1],
};

function parseColor(str) {
  const s = str.trim().toLowerCase();
  if (NAMED[s]) return NAMED[s];
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    if (p.length < 3) return null;
    const ch = (v) => (v.endsWith('%') ? (parseFloat(v) * 255) / 100 : parseFloat(v));
    const a = p[3] === undefined ? 1 : p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
    return [ch(p[0]), ch(p[1]), ch(p[2]), a];
  }
  m = s.match(/^hsla?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    const h = ((parseFloat(p[0]) % 360) + 360) % 360;
    const sat = parseFloat(p[1]) / 100;
    const l = parseFloat(p[2]) / 100;
    const a = p[3] === undefined ? 1 : p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
    const k = (n) => (n + h / 30) % 12;
    const f = (n) => l - sat * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return [f(0) * 255, f(8) * 255, f(4) * 255, a];
  }
  return null;
}

function mix(a, b, t) {
  // Transparente herda o tom do outro lado (como o navegador faz).
  const ca = a[3] === 0 ? [b[0], b[1], b[2], 0] : a;
  const cb = b[3] === 0 ? [a[0], a[1], a[2], 0] : b;
  return ca.map((v, i) => v + (cb[i] - v) * t);
}

const rgba = (c) => `rgba(${c.slice(0, 3).map((v) => Math.round(v)).join(',')},${+c[3].toFixed(3)})`;

// ─── 2. paradas com duas posições ────────────────────────────────────────────

const POS_RE = /^-?[\d.]+(%|px|deg|turn|rad|grad|em|rem|vw|vh)?$/;

/** Divide os argumentos de uma função em grupos separados por vírgula. */
function splitArgs(fnNode) {
  const groups = [[]];
  for (const n of fnNode.nodes) {
    if (n.type === 'div' && n.value === ',') groups.push([]);
    else groups[groups.length - 1].push(n);
  }
  return groups.map((g) => g.filter((n) => n.type !== 'space'));
}

function expandDoubleStops(value) {
  if (!/gradient\(/i.test(value)) return value;
  const parsed = valueParser(value);
  let changed = false;
  parsed.walk((node) => {
    if (node.type !== 'function' || !/gradient$/i.test(node.value)) return;
    const groups = splitArgs(node);
    const out = groups.map((g) => {
      const toks = g.map((n) => valueParser.stringify(n));
      if (toks.length === 3 && !POS_RE.test(toks[0]) && POS_RE.test(toks[1]) && POS_RE.test(toks[2])) {
        changed = true;
        return `${toks[0]} ${toks[1]}, ${toks[0]} ${toks[2]}`;
      }
      return toks.join(' ');
    });
    node.type = 'word';
    node.value = `${node.value}(${out.join(', ')})`;
    return false;
  });
  return changed ? parsed.toString() : value;
}

// ─── 3. conic-gradient → SVG ─────────────────────────────────────────────────

function toDeg(tok) {
  const v = parseFloat(tok);
  if (tok.endsWith('turn')) return v * 360;
  if (tok.endsWith('rad')) return (v * 180) / Math.PI;
  if (tok.endsWith('grad')) return v * 0.9;
  if (tok.endsWith('%')) return v * 3.6;
  return v; // deg ou 0
}

/** Converte os argumentos do cônico numa lista [{ angle, color }] já resolvida. */
function conicStops(groups) {
  let from = 0;
  let cx = 50;
  let cy = 50;
  let first = 0;
  const head = groups[0].map((n) => valueParser.stringify(n));
  if (head[0] === 'from' || head[0] === 'at') {
    first = 1;
    for (let i = 0; i < head.length; i++) {
      if (head[i] === 'from') from = toDeg(head[++i]);
      else if (head[i] === 'at') {
        const x = head[++i];
        const y = head[i + 1] && head[i + 1] !== 'from' ? head[++i] : '50%';
        const pct = (t) => (t === 'center' ? 50 : t === 'left' || t === 'top' ? 0 : t === 'right' || t === 'bottom' ? 100 : parseFloat(t));
        cx = pct(x);
        cy = pct(y);
      }
    }
  }
  const raw = [];
  for (const g of groups.slice(first)) {
    const toks = g.map((n) => valueParser.stringify(n));
    const color = toks[0];
    const c = parseColor(color);
    const pos = toks.slice(1).map(toDeg);
    if (pos.length === 0) raw.push({ color, c, angle: null });
    for (const p of pos) raw.push({ color, c, angle: p });
  }
  if (raw.length < 2) return null;
  // Posições que faltam: primeira 0, última 360, meio distribuído; nunca volta atrás.
  if (raw[0].angle === null) raw[0].angle = 0;
  if (raw[raw.length - 1].angle === null) raw[raw.length - 1].angle = 360;
  for (let i = 1; i < raw.length; i++) {
    if (raw[i].angle !== null) {
      raw[i].angle = Math.max(raw[i].angle, raw[i - 1].angle);
      continue;
    }
    let j = i;
    while (raw[j].angle === null) j++;
    const a = raw[i - 1].angle;
    const b = Math.max(raw[j].angle, a);
    for (let k = i; k < j; k++) raw[k].angle = a + ((b - a) * (k - i + 1)) / (j - i + 1);
  }
  return { from, cx, cy, stops: raw };
}

function wedge(cx, cy, a0, a1) {
  // Ângulo CSS: 0deg = topo, sentido horário.
  const R = 300;
  const pt = (a) => {
    const r = ((a - 90) * Math.PI) / 180;
    return `${(cx + R * Math.cos(r)).toFixed(2)} ${(cy + R * Math.sin(r)).toFixed(2)}`;
  };
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${cx} ${cy}L${pt(a0)}A${R} ${R} 0 ${large} 1 ${pt(a1)}Z`;
}

function conicToSvg(fnNode) {
  const repeating = /^repeating-/i.test(fnNode.value);
  const info = conicStops(splitArgs(fnNode));
  if (!info) return null;
  let { stops } = info;
  const { from, cx, cy } = info;
  if (repeating) {
    const start = stops[0].angle;
    const period = stops[stops.length - 1].angle - start;
    if (!(period > 0.5)) return null;
    const base = stops;
    stops = [];
    for (let off = 0; start + off < 360; off += period) {
      for (const s of base) stops.push({ ...s, angle: s.angle + off });
    }
  }
  const paths = {};
  const add = (color, a0, a1) => {
    if (a1 - a0 <= 0.001) return;
    const key = color;
    (paths[key] = paths[key] || []).push(wedge(cx, cy, from + a0, from + a1 + 0.4)); // 0.4°: sem frestas
  };
  // Antes da 1ª parada / depois da última: cor sólida da ponta.
  const firstS = stops[0];
  const lastS = stops[stops.length - 1];
  if (firstS.angle > 0) add(firstS.color, 0, Math.min(firstS.angle, 360));
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    const a0 = Math.max(0, a.angle);
    const a1 = Math.min(360, b.angle);
    if (a1 <= a0) continue;
    if (a.color === b.color || !a.c || !b.c) {
      add(a.color, a0, a1);
      continue;
    }
    const steps = Math.max(1, Math.ceil((a1 - a0) / 3));
    for (let k = 0; k < steps; k++) {
      const t0 = a0 + ((a1 - a0) * k) / steps;
      const t1 = a0 + ((a1 - a0) * (k + 1)) / steps;
      const mid = ((t0 + t1) / 2 - a.angle) / (b.angle - a.angle);
      add(rgba(mix(a.c, b.c, mid)), t0, t1);
    }
  }
  if (lastS.angle < 360) add(lastS.color, Math.max(0, lastS.angle), 360);
  const body = Object.entries(paths)
    .filter(([color]) => color !== 'transparent')
    .map(([color, ds]) => `<path fill="${color}" d="${ds.join('')}"/>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><clipPath id="c"><rect width="100" height="100"/></clipPath><g clip-path="url(#c)">${body}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')}")`;
}

function conicFallback(value) {
  if (!/conic-gradient\(/i.test(value)) return null;
  const parsed = valueParser(value);
  let ok = true;
  parsed.walk((node) => {
    if (node.type === 'function' && /^(repeating-)?conic-gradient$/i.test(node.value)) {
      const url = conicToSvg(node);
      if (!url) ok = false;
      else {
        node.type = 'word';
        node.value = url;
      }
      return false;
    }
  });
  return ok ? parsed.toString() : null;
}

// ─── 5. gap em flexbox ───────────────────────────────────────────────────────

const lastCompound = (sel) => sel.trim().split(/\s*[\s>+~]\s*/).pop();

function gapValues(decls) {
  let row = null;
  let col = null;
  for (const d of decls) {
    if (d.prop === 'gap' || d.prop === 'grid-gap') {
      const p = postcss.list.space(d.value);
      row = p[0];
      col = p[1] ?? p[0];
    } else if (d.prop === 'row-gap' || d.prop === 'grid-row-gap') row = d.value;
    else if (d.prop === 'column-gap' || d.prop === 'grid-column-gap') col = d.value;
  }
  return { row, col };
}

const isZero = (v) => v == null || /^(0|0px|normal|initial|unset)$/.test(v.trim());

function flexGapFallback(root, { Rule, Declaration }) {
  // Em CSS Modules a classe precisa ser global, senão vira `no-flexgap__hash`.
  const isModule = /\.module\.(css|scss|sass)$/.test(root.source?.input?.file || '');
  const NFG = isModule ? 'html:global(.no-flexgap)' : 'html.no-flexgap';
  // Exibição e direção conhecidas por seletor (e pela última parte dele).
  const display = {};
  const direction = {};
  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes/i.test(rule.parent.name)) return;
    rule.each((d) => {
      if (d.type !== 'decl') return;
      for (const s of rule.selectors) {
        const keys = [s.trim(), lastCompound(s)];
        if (d.prop === 'display') for (const k of keys) display[k] = display[k] || d.value;
        if (d.prop === 'flex-direction' || (d.prop === 'flex-flow' && /row|column/.test(d.value))) {
          const dir = /column/.test(d.value) ? 'column' : 'row';
          for (const k of keys) direction[k] = direction[k] || dir;
        }
      }
    });
  });
  // Margem própria (topo/esquerda) de cada classe simples `.x { ... }` fora de @media.
  const ownMargins = {};
  root.each((rule) => {
    if (rule.type !== 'rule') return;
    for (const s of rule.selectors) {
      const m = s.trim().match(/^\.([\w-]+)$/);
      if (!m) continue;
      rule.each((d) => {
        if (d.type !== 'decl') return;
        const o = (ownMargins[m[1]] = ownMargins[m[1]] || {});
        if (d.prop === 'margin') {
          const p = postcss.list.space(d.value);
          o.top = p[0];
          o.left = p[3] ?? p[1] ?? p[0];
        } else if (d.prop === 'margin-top') o.top = d.value;
        else if (d.prop === 'margin-left') o.left = d.value;
      });
    }
  });
  // Classes com position absolute/fixed (brilho, moldura, faixa): não são itens
  // do flex, então não levam o espaço do gap.
  const abs = new Set();
  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes/i.test(rule.parent.name)) return;
    for (const s of rule.selectors) {
      const m = s.trim().match(/^\.([\w-]+)$/);
      if (m && rule.some((d) => d.type === 'decl' && d.prop === 'position' && /absolute|fixed/.test(d.value))) abs.add(m[1]);
    }
  });
  const look = (map, s) => {
    const hit = map[s.trim()] ?? map[lastCompound(s)];
    if (hit !== undefined) return hit;
    // `.a.b { gap }` com o display em `.a`: procura cada parte da última composição.
    for (const part of lastCompound(s).split(/(?=[.#[:])/)) if (map[part] !== undefined) return map[part];
    return undefined;
  };

  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes/i.test(rule.parent.name)) return;
    if (rule.selector.includes('no-flexgap')) return;
    const decls = rule.nodes.filter((n) => n.type === 'decl');
    if (!decls.some((d) => /^(grid-)?(row-|column-)?gap$/.test(d.prop))) return;
    const { row, col } = gapValues(decls);
    const own = decls.filter((d) => d.prop === 'display').pop()?.value;
    const ownDir = decls.filter((d) => d.prop === 'flex-direction' || d.prop === 'flex-flow').pop()?.value;
    const groups = { row: [], column: [] };
    for (const s of rule.selectors) {
      if (s.includes('::') || s.includes(':before') || s.includes(':after')) continue;
      const disp = own ?? look(display, s);
      if (!disp || !/flex/.test(disp)) continue;
      const dirRaw = ownDir ?? look(direction, s) ?? 'row';
      const dir = /column/.test(dirRaw) ? 'column' : 'row';
      groups[dir].push(s.trim());
    }
    const extra = [];
    if (groups.row.length && !isZero(col)) {
      extra.push(new Rule({ selectors: groups.row.map((s) => `${NFG} ${s}>*+*`), nodes: [new Declaration({ prop: 'margin-left', value: col })] }));
    }
    if (groups.column.length && !isZero(row)) {
      extra.push(new Rule({ selectors: groups.column.map((s) => `${NFG} ${s}>*+*`), nodes: [new Declaration({ prop: 'margin-top', value: row })] }));
    }
    // Ajustes por filho (classes simples do mesmo arquivo):
    // - margem própria (ex.: `.headerLine { margin: -6px 0 0 }`): o gap SOMA com ela;
    // - absoluto: fica com a própria margem (ou 0), sem o gap;
    // - logo depois de uma camada absoluta que é o 1º filho: é o 1º item, sem gap.
    for (const [dir, gap, side] of [['row', col, 'left'], ['column', row, 'top']]) {
      if (!groups[dir].length || isZero(gap)) continue;
      const prop = `margin-${side}`;
      const byValue = {};
      const put = (v, sel) => (byValue[v] = byValue[v] || []).push(...groups[dir].map((s) => `${NFG} ${s}${sel}`));
      for (const [cls, own] of Object.entries(ownMargins)) {
        const v = own[side];
        if (v == null || isZero(v) || abs.has(cls)) continue;
        put(v === 'auto' ? 'auto' : `calc(${v} + ${gap})`, `>*+.${cls}`);
      }
      for (const cls of abs) {
        const v = ownMargins[cls]?.[side];
        put(v == null ? '0' : v, `>*+.${cls}`);
        put('0', `>.${cls}:first-child+*`);
      }
      for (const [v, selectors] of Object.entries(byValue)) {
        extra.push(new Rule({ selectors, nodes: [new Declaration({ prop, value: v })] }));
      }
    }
    let after = rule;
    for (const r of extra) {
      after.after(r);
      after = r;
    }
  });

  // Camada absoluta como 1º filho de um flex de OUTRO arquivo (ex.: faixa da
  // bandeira no topo do lobby): o próximo é o 1º item de verdade e não leva o gap.
  // Quem tem margem própria (posicionamento, ex.: `margin: -400px 0 0 -600px`) fica fora.
  const keep = Object.entries(ownMargins)
    .filter(([, o]) => !isZero(o.top) || !isZero(o.left))
    .map(([c]) => `:not(.${c})`)
    .join('');
  if (abs.size) {
    root.append(
      new Rule({
        selectors: [...abs].map((c) => `${NFG} .${c}.${c}.${c}.${c}:first-child+*${keep}`),
        nodes: [new Declaration({ prop: 'margin-left', value: '0' }), new Declaration({ prop: 'margin-top', value: '0' })],
      }),
    );
  }

}

// ─── plugin ──────────────────────────────────────────────────────────────────

module.exports = () => ({
  postcssPlugin: 'postcss-legacy-tv',
  OnceExit(root, helpers) {
    root.walkDecls((decl) => {
      if (decl.parent?.type === 'atrule') return;
      if (decl.prop === 'inset') {
        expandInset(decl);
        return;
      }
      const expanded = expandDoubleStops(decl.value);
      if (expanded !== decl.value) {
        // Navegador novo: valor original (fica por último). Antigo: o expandido.
        if (/conic-gradient\(/i.test(decl.value)) decl.value = expanded;
        else decl.cloneBefore({ value: expanded });
      }
      const conic = conicFallback(decl.value);
      if (conic) decl.cloneBefore({ value: conic });
      if (/^-webkit-mask$/.test(decl.prop) && /\bexclude\b/.test(decl.value)) {
        const legacy = expandDoubleStops(decl.value).replace(/\s*\bexclude\b/g, '');
        decl.cloneBefore({ value: legacy });
        decl.cloneBefore({ prop: '-webkit-mask-composite', value: 'xor' });
      }
    });
    flexGapFallback(root, helpers);
  },
});
module.exports.postcss = true;

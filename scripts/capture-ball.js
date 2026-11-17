/**
 * Gera a imagem da bola de cada tema (PNG transparente, com brilho e sombras
 * originais) para a bola nativa do APK. Uso: node scripts/capture-ball.js [porta]
 * Precisa do site rodando (next start) na porta dada.
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || '3099';
const THEMES = ['loteriai', 'bingo-show-paraguay', 'bingo-show-blue'];
const OUT = path.join(__dirname, '..', 'public', 'ball-sprites');
const PAD = 60; // espaço em volta da bola para o brilho (px do palco)
const SCALE = 2; // imagem em 2x (bola de 252px → 504px)

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const meta = {};
  for (const theme of THEMES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: SCALE });
    await page.goto(`http://127.0.0.1:${PORT}/draw`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((t) => localStorage.setItem('bingo_show_selected_theme', t), theme);
    await page.goto(`http://127.0.0.1:${PORT}/draw`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[class*="mainBingoBall"]', { timeout: 20000 });
    await page.addStyleTag({
      content: `
        *, *::before, *::after { animation: none !important; transition: none !important; }
        html, body { background: transparent !important; }
        body * { visibility: hidden !important; }
        [class*="mainBingoBall"], [class*="mainBingoBall"] * { visibility: visible !important; }
        [class*="ballGlint"] { visibility: hidden !important; }
      `,
    });
    await new Promise((r) => setTimeout(r, 600));
    const info = await page.evaluate(() => {
      const ball = document.querySelector('[class*="mainBingoBall"]');
      const num = document.querySelector('[class*="ballNumber"]');
      const r = ball.getBoundingClientRect();
      const ns = num ? getComputedStyle(num) : null;
      return {
        x: r.left, y: r.top, w: r.width, h: r.height,
        color: ns ? ns.color : '#fff',
        fontSize: ns ? parseFloat(ns.fontSize) : 110,
        fontWeight: ns ? ns.fontWeight : '800',
        textShadow: ns ? ns.textShadow : 'none',
      };
    });
    const file = path.join(OUT, `${theme}.png`);
    await page.screenshot({
      path: file,
      omitBackground: true,
      clip: { x: info.x - PAD, y: info.y - PAD, width: info.w + PAD * 2, height: info.h + PAD * 2 },
    });
    meta[theme] = {
      sprite: `/ball-sprites/${theme}.png`,
      // fração da largura da imagem ocupada pela bola
      ballFraction: info.w / (info.w + PAD * 2),
      numberColor: info.color,
      numberRatio: info.fontSize / info.w,
      numberWeight: info.fontWeight,
      numberShadow: info.textShadow,
    };
    console.log(theme, Math.round(info.w), 'px', info.color, info.textShadow.slice(0, 40));
    await page.close();
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

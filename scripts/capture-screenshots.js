const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const scenarios = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  for (const s of scenarios) {
    console.log('Capturing scenario ' + s);
    await page.goto(`http://localhost:3010/screenshots-winner?scenario=${s}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 3000)); // wait for animations (confetti, etc)
    await page.screenshot({ path: `/Users/cliente/.gemini/antigravity-ide/brain/0d049c14-586b-4892-b561-11068bb74c22/scenario_${s}.png` });
  }

  await browser.close();
  console.log('All screenshots captured!');
  process.exit(0);
})();

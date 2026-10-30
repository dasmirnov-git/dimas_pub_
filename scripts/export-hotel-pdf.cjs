// Artifact rendering only: export the static print view, independent of calculator inputs.
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
(async () => {
  const root = path.resolve(__dirname, '..');
  const output = path.resolve(root, process.argv[3] || 'hopinn-hotels/Hopinn-for-hotels.pdf');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1209, height: 680 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.argv[2] || 'http://127.0.0.1:8767/hopinn-hotels/', { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
    });
    const screenResult = await page.locator('[data-calc="full-discount"]').textContent();
    await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
    const checks = await page.evaluate(() => {
      const chart = document.querySelector('.price-components').getBoundingClientRect();
      return {
        visibleCalculatorElements: [...document.querySelectorAll('.web-only')].filter(e => e.getClientRects().length).length,
        printRatios: [...document.querySelectorAll('.price-segment')].map(e => +(e.getBoundingClientRect().height / chart.height * 100).toFixed(2)),
        slides: [...document.querySelectorAll('.slide')].map(s => {
          const r = s.getBoundingClientRect();
          const overflow = [...s.querySelectorAll('h1,h2,h3,p,li,.contact-row')].filter(e => e.getClientRects().length).map(e => {
            const b = e.getBoundingClientRect();
            return { text: e.textContent.slice(0, 50), bottom: b.bottom - r.top, right: b.right - r.left };
          }).filter(e => e.bottom > r.height - 8 || e.right > r.width - 8);
          return { id: s.id, overflow };
        }),
      };
    });
    if (errors.length || checks.visibleCalculatorElements || JSON.stringify(checks.printRatios) !== '[40,9,51]' || checks.slides.some(s => s.overflow.length)) {
      throw new Error(JSON.stringify({ errors, checks }));
    }
    await page.pdf({ path: output, printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
    const report = { output, screenResult, errors, checks };
    const reportPath = path.join(root, 'tmp/qa/calculator', path.basename(output) + '.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });

// Screenshot a local HTML file's .canvas element to PNG at 2x device scale.
// Diagram-only utility (Report route: Playwright+CSS -> PNG -> ReportLab Image()).
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const [htmlPath, outPath, selector = '.canvas'] = process.argv.slice(2);
  if (!htmlPath || !outPath) {
    console.error('usage: node shot_diagram.js <input.html> <output.png> [selector]');
    process.exit(2);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 900, height: 1400 } });
  await page.goto('file://' + path.resolve(htmlPath), { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const el = await page.$(selector);
  if (!el) {
    console.error('selector not found: ' + selector);
    await browser.close();
    process.exit(1);
  }
  await el.screenshot({ path: outPath });
  await browser.close();
  console.log('saved: ' + outPath);
})();

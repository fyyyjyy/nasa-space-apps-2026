// Dev tool: runs axe-core on the main screens in headless Chromium at 1280x720 and prints
// violations and incomplete results. Usage: node scripts/a11y-scan.mjs [baseUrl]
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:5199/';
const axeSource = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const dispatch = (e) => page.evaluate((ev) => window.__app.store.dispatch(ev), e);
const waitScreen = (n, t = 120000) =>
  page.waitForFunction((s) => window.__app?.store?.getState().screen === s, n, { timeout: t });

async function scan(name) {
  await page.addScriptTag({ content: axeSource });
  const r = await page.evaluate(async () => {
    const res = await window.axe.run(document, { resultTypes: ['violations', 'incomplete'] });
    const slim = (list) =>
      list.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.any[0]?.message || n.all[0]?.message || n.none[0]?.message || '')),
      }));
    return { violations: slim(res.violations), incomplete: slim(res.incomplete) };
  });
  console.log(`\n=== ${name}: ${r.violations.length} violations, ${r.incomplete.length} incomplete`);
  console.log(JSON.stringify(r, null, 1));
}

await page.goto(BASE);
await waitScreen('OPENING');
await page.waitForTimeout(3000);
console.log('canvas', await page.evaluate(() => [document.getElementById('scene').getAttribute('role'), document.getElementById('scene').getAttribute('aria-label')]));
console.log('h1 count', await page.evaluate(() => document.querySelectorAll('h1:not([hidden])').length));
await scan('opening');

await dispatch({ type: 'SELECT_BODY', body: 'moon' });
await waitScreen('ORBIT');
await page.waitForTimeout(4000);
console.log('canvas', await page.evaluate(() => document.getElementById('scene').getAttribute('aria-label')));
await scan('orbit');

await dispatch({ type: 'SELECT_MISSION', missionId: 'surveyor3' });
await waitScreen('STORY');
await page.waitForTimeout(2500);
console.log('canvas', await page.evaluate(() => document.getElementById('scene').getAttribute('aria-label')));
await page.evaluate(() => {
  const col = document.querySelector('[data-story-column]');
  col.scrollTop = 900;
});
await page.waitForTimeout(1000);
console.log('announcer', await page.evaluate(() => document.querySelector('.visually-hidden[role=status]')?.textContent));
console.log('h1', await page.evaluate(() => [...document.querySelectorAll('h1')].map((h) => h.textContent + (h.hidden ? ' [hidden]' : ''))));
// Reveal everything so contrast checks see final colours.
await page.evaluate(() => document.querySelectorAll('.story-column *').forEach((n) => n.classList.add('is-visible')));
await page.waitForTimeout(800);
await scan('story');

await page.evaluate(() => {
  const col = document.querySelector('[data-story-column]');
  col.scrollTop = col.scrollHeight;
});
await waitScreen('SUMMARY', 20000);
await page.waitForTimeout(1000);
await scan('summary');

await dispatch('OPEN_QUIZ');
await waitScreen('QUIZ', 10000);
await page.waitForTimeout(1200);
console.log('quiz active', await page.evaluate(() => document.activeElement.className));
await page.click('.quiz-dialog__choice');
await page.waitForTimeout(500);
await scan('quiz (answered)');
console.log('feedback', await page.evaluate(() => document.querySelector('.quiz-dialog__feedback').textContent));
console.log('ERRORS', errors);
await browser.close();

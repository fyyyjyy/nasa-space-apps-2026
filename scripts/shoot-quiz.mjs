// Dev tool: opens the quiz at a narrow viewport and saves screenshots to tmp/shots.
// Usage: node scripts/shoot-quiz.mjs [baseUrl] ; env VW, VH, MISSION, BODY
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:5199/';
const VW = Number(process.env.VW || 390);
const VH = Number(process.env.VH || 844);
const MISSION = process.env.MISSION || 'surveyor3';
const BODY = process.env.BODY || 'moon';
const OUT = 'tmp/shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: VW, height: VH }, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const dispatch = (e) => page.evaluate((ev) => window.__app.store.dispatch(ev), e);
const waitScreen = (n, t = 120000) =>
  page.waitForFunction((s) => window.__app?.store?.getState().screen === s, n, { timeout: t });

await page.goto(BASE);
await waitScreen('OPENING');
await page.waitForTimeout(3000);
await dispatch({ type: 'SELECT_BODY', body: BODY });
await waitScreen('ORBIT');
await page.waitForTimeout(4000);
console.log('orbit');
await dispatch({ type: 'SELECT_MISSION', missionId: MISSION });
await waitScreen('STORY');
await page.waitForTimeout(2500);
await page.evaluate(() => {
  const col = document.querySelector('[data-story-column]');
  col.scrollTop = col.scrollHeight;
});
await waitScreen('SUMMARY', 20000);
await page.waitForTimeout(1500);
await dispatch('OPEN_QUIZ');
await waitScreen('QUIZ', 10000);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/quiz-${VW}x${VH}-a.png` });

const metrics = await page.evaluate(() => {
  const d = document.querySelector('.quiz-dialog');
  const r = d.getBoundingClientRect();
  const small = [...d.querySelectorAll('button')]
    .map((b) => b.getBoundingClientRect())
    .filter((b) => b.width < 44 || b.height < 44).length;
  return { rect: [r.left, r.top, r.width, r.height], scrollable: d.scrollHeight > d.clientHeight, small };
});
console.log(JSON.stringify(metrics));

await page.click('.quiz-dialog__choice');
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/quiz-${VW}x${VH}-b.png` });
console.log('ERRORS', errors);
await browser.close();

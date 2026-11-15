// Dev tool: drives the app in headless Chromium and saves screenshots to tmp/shots.
// Usage: node scripts/shoot.mjs [baseUrl] [missionId ...]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const rawArgs = process.argv.slice(2);
const vi = rawArgs.indexOf('--viewport');
if (vi >= 0) rawArgs.splice(vi, 2);
const BASE = rawArgs[0] || 'http://localhost:5199/';
const only = rawArgs.slice(1);
const OUT = process.env.SHOOT_VIEWPORT || vi >= 0 ? 'tmp/shots-mobile' : 'tmp/shots';
mkdirSync(OUT, { recursive: true });

const MISSIONS = [
  ['surveyor3', 'moon', 6],
  ['apollo11', 'moon', 4],
  ['apollo17', 'moon', 4],
  ['viking1', 'mars', 5],
  ['opportunity', 'mars', 4],
  ['insight', 'mars', 5],
];

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
// Viewport: env SHOOT_VIEWPORT=390x844 (or --viewport 390x844 anywhere in argv).
const vpArg = process.argv.includes('--viewport') ? process.argv[process.argv.indexOf('--viewport') + 1] : process.env.SHOOT_VIEWPORT;
const [vw, vh] = (vpArg || '1280x720').split('x').map(Number);
const page = await browser.newPage({ viewport: { width: vw, height: vh }, hasTouch: vw < 768, isMobile: vw < 768, bypassCSP: !!process.env.SHOOT_BYPASS_CSP });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => errors.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));
page.on('response', (r) => {
  if (r.status() >= 400) errors.push(`[http ${r.status()}] ${r.url()}`);
});

const sleep = (ms) => page.waitForTimeout(ms);
const screen = () => page.evaluate(() => window.__app.store.getState().screen);
const dispatch = (e) => page.evaluate((ev) => window.__app.store.dispatch(ev), e);
async function waitScreen(name, timeout = 120000) {
  await page.waitForFunction((n) => window.__app.store.getState().screen === n, name, { timeout });
}
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

await page.goto(BASE);
await page.waitForFunction(() => window.__app?.store?.getState().screen === 'OPENING', null, { timeout: 120000 });
await sleep(3000);
await shot('opening');

for (const [id, body, count] of MISSIONS) {
  if (only.length && !only.includes(id)) continue;
  try {
    if ((await screen()) !== 'OPENING') throw new Error(`expected OPENING, got ${await screen()}`);
    await dispatch({ type: 'SELECT_BODY', body });
    await waitScreen('ORBIT');
    await sleep(4000);
    if (id === 'surveyor3' || id === 'viking1') await shot(`orbit-${body}`);
    await dispatch({ type: 'SELECT_MISSION', missionId: id });
    await waitScreen('STORY');
    await sleep(2500);
    for (let i = 0; i < count; i++) {
      await page.evaluate(
        ([idx]) => {
          const col = document.querySelector('[data-story-column]');
          const sec = col.querySelector(`[data-chapter-index="${idx}"]`);
          const top = sec.getBoundingClientRect().top - col.getBoundingClientRect().top + col.scrollTop;
          col.scrollTop = Math.max(0, top - col.clientHeight * 0.4 + 2);
        },
        [i],
      );
      await sleep(3500);
      await shot(`${id}-ch${i + 1}`);
    }
    // Scroll to the bottom to reach the summary.
    await page.evaluate(() => {
      const col = document.querySelector('[data-story-column]');
      col.scrollTop = col.scrollHeight;
    });
    await waitScreen('SUMMARY', 20000);
    await sleep(2000);
    await shot(`${id}-summary`);
    if (id === 'surveyor3' || id === 'viking1') {
      await dispatch('OPEN_QUIZ');
      await waitScreen('QUIZ', 10000);
      await sleep(1500);
      await shot(`${id}-quiz`);
      await dispatch('CLOSE_QUIZ');
      await waitScreen('SUMMARY', 10000);
    }
    await dispatch({ type: 'RETURN_TO_SPACE', target: 'opening' });
    await waitScreen('OPENING');
    await sleep(1500);
  } catch (err) {
    errors.push(`[script] ${id}: ${err.message}`);
    await shot(`${id}-FAILED`);
    break;
  }
}

if (!only.length || only.includes('journey')) {
  try {
    if ((await screen()) === 'OPENING') {
      await dispatch('START_JOURNEY');
      await sleep(1500);
      await shot('journey-intro');
      const deadline = Date.now() + 15 * 60 * 1000;
      let cardShot = false;
      while (Date.now() < deadline) {
        const s = await screen();
        if (s === 'CLOSING') break;
        if (s === 'JOURNEY_CARD' && !cardShot) {
          await shot('journey-card');
          cardShot = true;
        }
        if (s === 'STORY') {
          await page.evaluate(() => {
            const col = document.querySelector('[data-story-column]');
            col.scrollTop = col.scrollHeight;
          });
        }
        if (s === 'SUMMARY') {
          const st = await page.evaluate(() => window.__app.store.getState().journeyIndex);
          await dispatch(st >= 5 ? 'FINISH_JOURNEY' : 'CONTINUE');
        }
        await sleep(1000);
      }
      await sleep(3000);
      await shot('closing');
    }
  } catch (err) {
    errors.push(`[script] journey: ${err.message}`);
  }
}

console.log('FINAL SCREEN', await screen().catch(() => '?'));
console.log('CONSOLE/NETWORK ISSUES:');
for (const e of [...new Set(errors)]) console.log(' ', e);
await browser.close();

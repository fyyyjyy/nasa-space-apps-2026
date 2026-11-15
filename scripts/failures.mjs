// Dev tool: aborts model, image, audio and texture requests plus a WebGL context loss, and checks
// the story still proceeds. Usage: node scripts/failures.mjs [baseUrl]. Shots go to tmp/failures.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = process.argv[2] || 'http://localhost:5201/';
const OUT = 'tmp/failures';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, bypassCSP: true });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`.slice(0, 160)));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
for (const pat of ['**/models/*.glb', '**/images/*.webp', '**/audio/*.m4a', '**/textures/*.jpg']) {
  await page.route(pat, (r) => r.abort());
}
const screen = () => page.evaluate(() => window.__app.store.getState().screen);
const dispatch = (e) => page.evaluate((ev) => window.__app.store.dispatch(ev), e);
const waitScreen = (n, t = 60000) =>
  page.waitForFunction((s) => window.__app.store.getState().screen === s, n, { timeout: t });
const toasts = () => page.$$eval('.toast', (els) => els.map((e) => e.textContent));
const result = {};

await page.goto(BASE);
await page.waitForFunction(() => window.__app?.store?.getState().screen === 'OPENING', null, { timeout: 120000 });
await page.screenshot({ path: `${OUT}/1-opening-no-texture.png` });
await page.mouse.click(10, 10); // audio unlock gesture with audio blocked
await dispatch({ type: 'SELECT_BODY', body: 'mars' });
await waitScreen('ORBIT');
await dispatch({ type: 'SELECT_MISSION', missionId: 'viking1' });
await waitScreen('FLY_IN');
await page.waitForTimeout(500);
await waitScreen('STORY');
result.storyReached = true;
result.toastsAtStory = await toasts();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/2-story-model-image-blocked.png` });
await page.waitForTimeout(5600);
result.toastsAfter5s = await toasts();
result.imgPlaceholders = await page.$$eval('.story-column img, [class*=placeholder]', (e) => e.length);

// Context loss and restore.
await page.evaluate(() => {
  const c = document.getElementById('scene');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  const ext = gl.getExtension('WEBGL_lose_context');
  window.__ext = ext;
  ext.loseContext();
});
await page.waitForTimeout(600);
result.toastsOnLoss = await toasts();
await page.screenshot({ path: `${OUT}/3-context-lost.png` });
await page.waitForTimeout(5600);
result.toastsOnLossAfter5s = await toasts();
await page.evaluate(() => window.__ext.restoreContext());
await page.waitForTimeout(800);
result.toastsAfterRestore = await toasts();
await page.screenshot({ path: `${OUT}/4-context-restored.png` });
result.screenAfter = await screen();
console.log(JSON.stringify(result, null, 2));
console.log(logs.filter((l) => !/Failed to load resource/.test(l)).slice(0, 25).join('\n'));
await browser.close();

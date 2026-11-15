// Playwright smoke tests (plain node + tiny assert harness; Node 18 / playwright 1.40).
// Usage: npm run e2e            (serves dist/ with vite preview, builds first if dist is missing)
//        E2E_BASE=http://localhost:5173/ npm run e2e   (use an already running server)
//        E2E_ONLY=quiz npm run e2e                     (run tests whose name contains "quiz")
import { chromium } from 'playwright';
import { preview, build } from 'vite';
import { existsSync } from 'node:fs';
import { mkdirSync } from 'node:fs';

const GL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const LONG = 120000; // software WebGL is slow
const OUT = 'tmp/e2e';
mkdirSync(OUT, { recursive: true });

let BASE = process.env.E2E_BASE;
let server = null;
if (!BASE) {
  if (!existsSync('dist/index.html')) await build({ logLevel: 'warn' });
  server = await preview({ preview: { port: 4179, strictPort: false, open: false }, logLevel: 'warn' });
  BASE = server.resolvedUrls.local[0];
}
console.log('Testing', BASE);

const assert = (cond, msg) => {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
};

// Console errors we accept: optional assets (audio/models) that are not shipped yet, and the 404 noise they cause.
const IGNORED_ERRORS = [/Failed to load resource/i, /\.m4a|\.mp3|\.ogg|\.glb/i];

async function openPage(browser, { viewport = { width: 1280, height: 720 }, mobile = false } = {}) {
  const ctx = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile, bypassCSP: true });
  const page = await ctx.newPage();
  page.setDefaultTimeout(LONG);
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORED_ERRORS.some((r) => r.test(m.text()))) errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  const h = {
    page,
    errors,
    screen: () => page.evaluate(() => window.__app.store.getState().screen),
    state: () => page.evaluate(() => window.__app.store.getState()),
    waitScreen: (n, t = LONG) =>
      page.waitForFunction((s) => window.__app?.store?.getState().screen === s, n, { timeout: t }),
    async goto() {
      await page.goto(BASE);
      await h.waitScreen('OPENING');
    },
    async toStory(body, mission) {
      await page.click(`[data-body="${body}"]`);
      await h.waitScreen('ORBIT');
      await h.clickMarker(mission);
      await h.waitScreen('STORY');
    },
    async clickMarker(mission) {
      const sel = `.marker-proxy[data-mission-id="${mission}"]`;
      await page.waitForFunction((s) => {
        const b = document.querySelector(s);
        return b && b.style.display !== 'none';
      }, sel);
      // The camera may still be easing; wait until the marker stops moving, then click for real.
      let prev = null;
      for (let i = 0; i < 40; i++) {
        const r = await page.locator(sel).boundingBox();
        if (r && prev && Math.abs(r.x - prev.x) < 0.5 && Math.abs(r.y - prev.y) < 0.5) break;
        prev = r;
        await page.waitForTimeout(250);
      }
      await page.locator(sel).click({ force: true });
      // A click may first expand a label (touch) and need a second activation.
      try {
        await page.waitForFunction(() => ['FLY_IN', 'STORY'].includes(window.__app.store.getState().screen), null, { timeout: 4000 });
      } catch {
        await page.locator(sel).click({ force: true });
      }
    },
    scrollEnd: () =>
      page.evaluate(() => {
        const col = document.querySelector('[data-story-column]');
        col.scrollTop = col.scrollHeight;
      }),
  };
  return { ctx, h };
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('opening loads without console errors', async ({ browser }) => {
  const { ctx, h } = await openPage(browser);
  await h.goto();
  await h.page.waitForTimeout(2000);
  assert(await h.page.locator('[data-body="moon"]').isVisible(), 'Moon button visible');
  assert(await h.page.locator('[data-body="mars"]').isVisible(), 'Mars button visible');
  assert(h.errors.length === 0, `console errors: ${h.errors.join(' | ')}`);
  await ctx.close();
});

test('Moon -> orbit shows 3 markers', async ({ browser }) => {
  const { ctx, h } = await openPage(browser);
  await h.goto();
  await h.page.click('[data-body="moon"]');
  await h.waitScreen('ORBIT');
  await h.page.waitForFunction(
    () => [...document.querySelectorAll('.marker-proxy')].filter((b) => b.style.display !== 'none').length === 3,
  );
  const ids = await h.page.$$eval('.marker-proxy', (bs) => bs.filter((b) => b.style.display !== 'none').map((b) => b.dataset.missionId));
  assert(ids.length === 3, `3 visible markers, got ${ids}`);
  await ctx.close();
});

test('marker click -> fly-in -> STORY with column and model/placeholder', async ({ browser }) => {
  const { ctx, h } = await openPage(browser);
  await h.goto();
  await h.page.click('[data-body="moon"]');
  await h.waitScreen('ORBIT');
  await h.clickMarker('surveyor3');
  await h.waitScreen('STORY');
  assert(await h.page.locator('[data-story-column]').isVisible(), 'story column visible');
  const chapters = await h.page.locator('[data-chapter-index]').count();
  assert(chapters >= 1, 'chapters rendered');
  const hasModel = await h.page.evaluate(() => !!window.__app.modelManager);
  assert(hasModel, 'model manager (model or placeholder) present');
  await ctx.close();
});

test('scroll to end -> SUMMARY; quiz; Return to Space -> ORBIT', async ({ browser }) => {
  const { ctx, h } = await openPage(browser);
  await h.goto();
  await h.toStory('moon', 'surveyor3');
  await h.page.waitForTimeout(2000);
  await h.scrollEnd();
  await h.waitScreen('SUMMARY', 30000);
  const ret = h.page.locator('[data-action="return"]');
  const quizBtn = h.page.locator('[data-action="quiz"]');
  assert(await ret.isVisible(), 'Return to Space visible');
  assert((await ret.textContent()).trim() === 'Return to Space', 'Return to Space label');
  assert(await quizBtn.isVisible(), 'quiz button visible');

  await quizBtn.click();
  await h.waitScreen('QUIZ', 15000);
  const dlg = h.page.locator('.quiz-dialog');
  await dlg.waitFor({ state: 'visible' }); // lazy-loaded chunk mounts after the screen changes
  for (let i = 0; i < 3; i++) {
    await dlg.locator('.quiz-dialog__choice').first().click();
    await dlg.locator('.quiz-dialog__next').click();
  }
  const score = (await dlg.locator('.quiz-dialog__score').first().textContent()).trim();
  assert(/\d/.test(score), `score shown: "${score}"`);

  await dlg.locator('.quiz-dialog__close').click();
  await h.waitScreen('SUMMARY', 15000);
  const focusOk = await h.page.evaluate(() => document.activeElement?.dataset?.action === 'quiz');
  assert(focusOk, 'focus returned to the quiz button');

  await ret.click();
  await h.waitScreen('ORBIT', 60000);
  assert(h.errors.length === 0, `console errors: ${h.errors.join(' | ')}`);
  await ctx.close();
});

test('full journey: start -> intro -> mission 1 STORY', async ({ browser }) => {
  const { ctx, h } = await openPage(browser);
  await h.goto();
  await h.page.getByRole('button', { name: 'Experience the Full Journey' }).click();
  await h.waitScreen('JOURNEY_INTRO', 15000);
  await h.waitScreen('STORY', 180000);
  const st = await h.state();
  assert(st.journey !== false && st.missionId, `journey mission started: ${JSON.stringify({ m: st.missionId })}`);
  assert(await h.page.locator('[data-story-column]').isVisible(), 'story column visible');
  await ctx.close();
});

test('mobile 390x844 stacked layout', async ({ browser }) => {
  const { ctx, h } = await openPage(browser, { viewport: { width: 390, height: 844 }, mobile: true });
  await h.goto();
  await h.page.click('[data-body="moon"]');
  await h.waitScreen('ORBIT');
  await h.clickMarker('surveyor3');
  await h.waitScreen('STORY');
  await h.page.waitForTimeout(1500);
  const m = await h.page.evaluate(() => {
    const c = document.querySelector('[data-story-column]').getBoundingClientRect();
    const cv = document.getElementById('scene').getBoundingClientRect();
    return {
      colW: c.width, colTop: c.top, colBottom: c.bottom, vw: innerWidth, vh: innerHeight,
      sceneBottom: cv.bottom, hScroll: document.documentElement.scrollWidth > innerWidth,
    };
  });
  assert(m.colW >= m.vw - 2, `column spans full width (${m.colW} of ${m.vw})`);
  assert(m.colTop > 100, `column sits below the scene (top=${m.colTop})`);
  assert(!m.hScroll, 'no horizontal scroll');
  await ctx.close();
});

test('WebGL unavailable shows static fallback message', async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-webgl', '--disable-3d-apis', '--disable-software-rasterizer'] });
  try {
    const { ctx, h } = await openPage(browser);
    await h.page.goto(BASE);
    await h.waitScreen('FALLBACK', 30000);
    const msg = (await h.page.locator('.webgl-fallback__message').textContent()).trim();
    assert(/WebGL/.test(msg), `fallback message: "${msg}"`);
    assert(await h.page.locator('.webgl-fallback').isVisible(), 'fallback visible');
    await ctx.close();
  } finally {
    await browser.close();
  }
});

const only = process.env.E2E_ONLY;
const browser = await chromium.launch({ args: GL_ARGS });
let failed = 0;
for (const t of tests) {
  if (only && !t.name.toLowerCase().includes(only.toLowerCase())) continue;
  const start = Date.now();
  try {
    await t.fn({ browser });
    console.log(`PASS  ${t.name} (${((Date.now() - start) / 1000).toFixed(1)}s)`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${t.name} (${((Date.now() - start) / 1000).toFixed(1)}s)\n      ${e.message.split('\n')[0]}`);
  }
}
await browser.close();
if (server) await new Promise((r) => server.httpServer.close(r));
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);

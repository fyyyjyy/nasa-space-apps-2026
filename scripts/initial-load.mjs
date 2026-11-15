// Dev tool: measures transferred bytes and failed requests for the initial load.
// Usage: node scripts/initial-load.mjs [baseUrl]
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:4173/';
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const cdp = await page.context().newCDPSession(page);
await cdp.send('Network.enable');
const sizes = new Map();
const urls = new Map();
cdp.on('Network.requestWillBeSent', (e) => urls.set(e.requestId, e.request.url));
cdp.on('Network.loadingFinished', (e) => sizes.set(e.requestId, e.encodedDataLength));
const bad = [];
page.on('response', (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`));
page.on('requestfailed', (r) => bad.push(`FAILED ${r.url()} ${r.failure()?.errorText}`));
const logs = [];
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`[${m.type()}] ${m.text()}`));
await page.goto(BASE);
// CSP stays enforced here, so poll with evaluate (waitForFunction needs eval).
for (let i = 0; i < 240; i++) {
  if ((await page.evaluate(() => window.__app?.store?.getState().screen).catch(() => null)) === 'OPENING') break;
  await page.waitForTimeout(500);
}
await page.waitForTimeout(3000);
let total = 0;
const rows = [];
for (const [id, n] of sizes) {
  total += n;
  rows.push([n, urls.get(id)]);
}
rows.sort((a, b) => b[0] - a[0]);
for (const [n, u] of rows) console.log(String(n).padStart(9), u);
console.log('TOTAL transferred bytes:', total, 'requests:', rows.length);
console.log('FAILED:', bad);
console.log('CONSOLE:', logs);
await browser.close();

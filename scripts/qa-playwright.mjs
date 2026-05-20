// QA pass — visit each route at multiple viewports, capture console errors,
// failed network requests, and screenshots. No assertions; reports a punch list.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.QA_BASE || 'http://127.0.0.1:4173';
const ROUTES = [
  '/',
  '/explore/',
  '/spec/README.md',
  '/demo-blog/',
  '/demo-single/',
  '/demo-full/',
  '/demo-blog-next/',
  '/demo-single-next/',
  '/demo-full-next/',
];
const VIEWPORTS = [
  { name: 'mobile',  width: 390,  height: 844 },
  { name: 'tablet',  width: 820,  height: 1180 },
  { name: 'desktop', width: 1400, height: 1000 },
];

const outDir = '/tmp/mosaic-qa';
mkdirSync(outDir, { recursive: true });

const report = [];
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  for (const route of ROUTES) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    const errors = [];
    const failedRequests = [];
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });
    page.on('requestfailed', req => {
      failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
    });
    page.on('response', resp => {
      if (resp.status() >= 400) {
        failedRequests.push(`${resp.status()} ${resp.url()}`);
      }
    });

    const url = BASE + route;
    let status = 'ok';
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      if (!resp || resp.status() >= 400) status = `bad-status-${resp?.status() ?? 'no-response'}`;
      await page.waitForTimeout(400);
      const filename = `${vp.name}_${route.replace(/[^a-z0-9]/gi, '_') || 'root'}.png`;
      await page.screenshot({ path: `${outDir}/${filename}`, fullPage: false });
    } catch (e) {
      status = `nav-failed: ${e.message}`;
    }

    report.push({
      viewport: vp.name,
      route,
      status,
      errors: errors.slice(0, 10),
      failedRequests: failedRequests.slice(0, 10),
    });

    await ctx.close();
  }
}

await browser.close();
writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 2));

const issues = report.filter(r => r.status !== 'ok' || r.errors.length || r.failedRequests.length);
console.log(`\n=== QA REPORT (${report.length} checks, ${issues.length} with issues) ===\n`);
for (const r of issues) {
  console.log(`  [${r.viewport}] ${r.route}  → ${r.status}`);
  for (const e of r.errors) console.log(`     · ${e}`);
  for (const f of r.failedRequests) console.log(`     ✗ ${f}`);
}
if (!issues.length) console.log('  ✅ all clean.\n');
console.log(`\nreport: ${outDir}/report.json`);
console.log(`screenshots: ${outDir}/`);

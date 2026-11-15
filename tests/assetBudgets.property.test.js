import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { validateAssetBudget } from '../src/core/dataValidator.js';

// Feature: nasa-space-apps-2026, Property 37: Asset budgets reject oversized assets
// **Validates: Requirements 13.9**

const MAX_W = 2048;
const MAX_BYTES = 5 * 1024 * 1024;

const widthArb = fc.oneof(
  fc.integer({ min: 1, max: 5000 }),
  fc.constantFrom(MAX_W - 1, MAX_W, MAX_W + 1),
);
const bytesArb = fc.oneof(
  fc.integer({ min: 0, max: 12 * 1024 * 1024 }),
  fc.constantFrom(MAX_BYTES - 1, MAX_BYTES, MAX_BYTES + 1),
);
const assetArb = fc.oneof(
  fc.record({ kind: fc.constant('texture'), path: fc.uuid(), widthPx: widthArb }),
  fc.record({ kind: fc.constant('model'), path: fc.uuid(), bytes: bytesArb }),
);
const violates = (a) => (a.kind === 'texture' ? a.widthPx > MAX_W : a.bytes > MAX_BYTES);

describe('Property 37: Asset budgets reject oversized assets', () => {
  it('reports exactly one error per violating entry and ok iff none violate', () => {
    fc.assert(
      fc.property(fc.array(assetArb, { maxLength: 20 }), (assets) => {
        const res = validateAssetBudget(assets);
        const n = assets.filter(violates).length;
        expect(res.errors.length).toBe(n);
        expect(res.ok).toBe(n === 0);
      }),
      { numRuns: 200 },
    );
  });

  it('accepts entries exactly at 2048 px and 5 MB', () => {
    const res = validateAssetBudget([
      { kind: 'texture', path: 't', widthPx: MAX_W },
      { kind: 'model', path: 'm', bytes: MAX_BYTES },
    ]);
    expect(res.ok).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('current public/ assets satisfy the budgets (scripts/check-assets.js)', () => {
    const r = spawnSync(process.execPath, [path.join(process.cwd(), 'scripts', 'check-assets.js')], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
  });
});

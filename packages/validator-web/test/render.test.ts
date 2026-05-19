import { describe, it, expect, beforeEach } from 'vitest';
import { renderResult } from '../src/render.js';
import type { ValidationResult } from '@ssolu/mosaic-core';

function makeResult(over: Partial<ValidationResult> = {}): ValidationResult {
  return {
    ok: true,
    errors: [],
    warnings: [],
    records: new Map<string, string[]>(),
    ...over,
  };
}

describe('renderResult', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
  });

  it('shows an OK summary on a clean result', () => {
    const host = document.getElementById('host') as HTMLElement;
    renderResult(host, makeResult({ records: new Map([['pages/about', ['x']]]) }));
    const summary = host.querySelector('.summary')!;
    expect(summary.textContent).toBe('1 record · 0 errors · 0 warnings — OK');
    expect(summary.classList.contains('ok')).toBe(true);
    expect(host.querySelector('.all-good')).toBeTruthy();
  });

  it('shows a FAIL summary + lists errors first', () => {
    const host = document.getElementById('host') as HTMLElement;
    renderResult(
      host,
      makeResult({
        ok: false,
        errors: [{ path: 'a.json', message: 'bad' }],
        warnings: [{ path: 'b.md', message: 'frontmatter' }],
        records: new Map([['a', ['a.json']]]),
      }),
    );
    expect(host.querySelector('.summary')!.classList.contains('fail')).toBe(true);
    const findings = host.querySelectorAll('.finding');
    expect(findings).toHaveLength(2);
    expect(findings[0]!.classList.contains('error')).toBe(true);
    expect(findings[1]!.classList.contains('warning')).toBe(true);
  });

  it('uses singular/plural correctly', () => {
    const host = document.getElementById('host') as HTMLElement;
    renderResult(host, makeResult());
    expect(host.querySelector('.summary')!.textContent).toContain('0 records');
    renderResult(
      host,
      makeResult({
        warnings: [
          { path: 'a', message: 'x' },
          { path: 'b', message: 'y' },
        ],
      }),
    );
    expect(host.querySelector('.summary')!.textContent).toContain('2 warnings');
  });
});

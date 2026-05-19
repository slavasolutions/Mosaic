import { describe, expect, it } from 'vitest';
import { ctaDetector } from '../src/detectors/cta.js';
import type { ScannedFile } from '../src/types.js';

function file(relPath: string, content: string, ext: string): ScannedFile {
  return { relPath, absPath: '/abs/' + relPath, content, ext };
}

describe('cta detector', () => {
  it('flags <a class="button">…</a>', () => {
    const findings = ctaDetector.run([
      file('a.html', '<a class="button" href="/x">Get started</a>', '.html'),
    ]);
    expect(findings.length).toBe(1);
    expect(findings[0].finding.toLowerCase()).toContain('get started');
  });

  it('flags <button>Buy now</button>', () => {
    const findings = ctaDetector.run([
      file('a.html', '<button>Buy now</button>', '.html'),
    ]);
    expect(findings.length).toBe(1);
  });

  it('flags JSX-style buttons via regex fallback', () => {
    const jsx = `<a className="button" href="/x">Sign up</a>`;
    const findings = ctaDetector.run([file('a.jsx', jsx, '.jsx')]);
    expect(findings.length).toBe(1);
  });

  it('recommends a /snippets/cta-<slug> block record', () => {
    const findings = ctaDetector.run([
      file('a.html', '<a class="cta" href="/x">Get started</a>', '.html'),
    ]);
    expect(findings[0].recommendation).toMatch(/\/snippets\/cta-/);
  });
});

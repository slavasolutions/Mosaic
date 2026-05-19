import { describe, expect, it } from 'vitest';
import { metaDetector } from '../src/detectors/meta.js';
import type { ScannedFile } from '../src/types.js';

function file(relPath: string, content: string, ext: string): ScannedFile {
  return { relPath, absPath: '/abs/' + relPath, content, ext };
}

describe('meta detector', () => {
  it('finds meta and link tags in HTML head', () => {
    const html = `<!doctype html><html><head>
      <meta name="description" content="x">
      <meta property="og:title" content="y">
      <link rel="canonical" href="/">
    </head><body></body></html>`;
    const findings = metaDetector.run([file('a.html', html, '.html')]);
    expect(findings.length).toBe(1);
    expect(findings[0].locations.length).toBe(3);
    expect(findings[0].recommendation).toMatch(/mosaic-web §7/);
  });

  it('flags og/twitter presence at medium severity', () => {
    const html = `<!doctype html><html><head>
      <meta property="og:image" content="x">
    </head></html>`;
    const findings = metaDetector.run([file('a.html', html, '.html')]);
    expect(findings[0].severity).toBe('medium');
  });

  it('ignores non-html files', () => {
    const findings = metaDetector.run([file('x.css', '<meta name="x">', '.css')]);
    expect(findings.length).toBe(0);
  });
});

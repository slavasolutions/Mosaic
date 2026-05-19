import { describe, expect, it } from 'vitest';
import { textDetector } from '../src/detectors/text.js';
import type { ScannedFile } from '../src/types.js';

function file(relPath: string, content: string, ext: string): ScannedFile {
  return { relPath, absPath: '/abs/' + relPath, content, ext };
}

describe('text detector', () => {
  it('flags strings repeating ≥3 times across HTML files', () => {
    const files = [
      file('a.html', '<p>Trusted by teams.</p>', '.html'),
      file('b.html', '<p>Trusted by teams.</p>', '.html'),
      file('c.html', '<div><p>Trusted by teams.</p></div>', '.html'),
    ];
    const findings = textDetector.run(files);
    const hit = findings.find((f) => f.finding.includes('Trusted by teams.'));
    expect(hit).toBeDefined();
    expect(hit!.locations.length).toBe(3);
  });

  it('does not flag strings under 3 occurrences', () => {
    const files = [
      file('a.html', '<p>Singleton phrase</p>', '.html'),
      file('b.html', '<p>Singleton phrase</p>', '.html'),
    ];
    const findings = textDetector.run(files);
    expect(findings.length).toBe(0);
  });

  it('recommends a /snippets/<slug> extraction', () => {
    const files = [
      file('a.html', '<p>Reuse me</p>', '.html'),
      file('b.html', '<p>Reuse me</p>', '.html'),
      file('c.html', '<p>Reuse me</p>', '.html'),
    ];
    const findings = textDetector.run(files);
    expect(findings[0].recommendation).toMatch(/\/snippets\//);
  });
});

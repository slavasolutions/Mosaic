import { describe, expect, it } from 'vitest';
import { imagesDetector } from '../src/detectors/images.js';
import type { ScannedFile } from '../src/types.js';

function file(relPath: string, content: string, ext: string): ScannedFile {
  return { relPath, absPath: '/abs/' + relPath, content, ext };
}

describe('images detector', () => {
  it('separates external from local image URLs', () => {
    const findings = imagesDetector.run([
      file('a.html', '<img src="/img/local.png"><img src="https://cdn.example/x.jpg">', '.html'),
    ]);
    const external = findings.find((f) => f.finding.includes('external'));
    const local = findings.find((f) => f.finding.includes('local'));
    expect(external).toBeDefined();
    expect(local).toBeDefined();
  });

  it('detects CSS background-image url()', () => {
    const findings = imagesDetector.run([
      file('a.css', '.x { background-image: url("/img/bg.png"); }', '.css'),
    ]);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('ignores data: URIs', () => {
    const findings = imagesDetector.run([
      file('a.html', '<img src="data:image/png;base64,xxx">', '.html'),
    ]);
    expect(findings.length).toBe(0);
  });
});

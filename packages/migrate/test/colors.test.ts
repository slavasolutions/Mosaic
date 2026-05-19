import { describe, expect, it } from 'vitest';
import { colorsDetector } from '../src/detectors/colors.js';
import type { ScannedFile } from '../src/types.js';

function file(relPath: string, content: string, ext: string): ScannedFile {
  return { relPath, absPath: '/abs/' + relPath, content, ext };
}

describe('colors detector', () => {
  it('groups repeated hex colors and reports occurrence count', () => {
    const files = [
      file('a.css', '.x { color: #ff6b35; } .y { background: #ff6b35; }', '.css'),
      file('b.css', '.z { border-color: #ff6b35; }', '.css'),
    ];
    const findings = colorsDetector.run(files);
    const orange = findings.find((f) => f.finding.includes('#ff6b35'));
    expect(orange).toBeDefined();
    expect(orange!.locations.length).toBe(3);
    expect(orange!.severity).toBe('medium');
  });

  it('detects rgb(), hsl(), and treats them as distinct from hex', () => {
    const files = [
      file('a.css', '.x { color: rgb(255, 107, 53); } .y { color: hsl(20, 100%, 60%); }', '.css'),
    ];
    const findings = colorsDetector.run(files);
    expect(findings.some((f) => f.finding.includes('rgb'))).toBe(true);
    expect(findings.some((f) => f.finding.includes('hsl'))).toBe(true);
  });

  it('recommends a swatch token slug', () => {
    const files = [file('a.css', '.x { color: #abcdef; }', '.css')];
    const findings = colorsDetector.run(files);
    expect(findings[0].recommendation).toMatch(/swatch-\d+/);
  });
});

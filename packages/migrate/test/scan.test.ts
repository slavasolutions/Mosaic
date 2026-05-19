import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scan } from '../src/scan.js';
import { toMarkdown } from '../src/report.js';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = resolve(here, 'fixtures/sample-site');

describe('end-to-end scan on sample-site fixture', () => {
  it('produces findings from every detector', async () => {
    const result = await scan(FIXTURE);
    expect(result.fileCount).toBeGreaterThan(0);
    expect(result.detectorCount).toBe(5);
    expect(result.perCategoryCount['hardcoded-colors']).toBeGreaterThan(0);
    expect(result.perCategoryCount['repeated-text']).toBeGreaterThan(0);
    expect(result.perCategoryCount['meta-tags']).toBeGreaterThan(0);
    expect(result.perCategoryCount['cta-patterns']).toBeGreaterThan(0);
    expect(result.perCategoryCount['image-urls']).toBeGreaterThan(0);
  });

  it('renders a markdown report with all five sections', async () => {
    const result = await scan(FIXTURE);
    const md = toMarkdown(result);
    expect(md).toContain('# Mosaic Migration Report');
    expect(md).toContain('### Hardcoded colors');
    expect(md).toContain('### Repeated text strings');
    expect(md).toContain('### Meta tags');
    expect(md).toContain('### CTA / button patterns');
    expect(md).toContain('### Image URLs');
    expect(md).toContain('## Recommended next steps');
  });
});

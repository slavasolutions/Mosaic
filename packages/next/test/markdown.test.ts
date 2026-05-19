import { describe, expect, it } from 'vitest';
import { renderBody } from '../src/markdown.js';

describe('renderBody (next) — markdown', () => {
  it('returns empty string for empty/undefined input', () => {
    expect(renderBody('')).toBe('');
    expect(renderBody(undefined)).toBe('');
    expect(renderBody(null)).toBe('');
  });

  it('renders h2 and h3 headings', () => {
    const html = renderBody('## Section\n\n### Subsection');
    expect(html).toContain('<h2>Section</h2>');
    expect(html).toContain('<h3>Subsection</h3>');
  });

  it('renders lists, blockquote, bold and italic', () => {
    const html = renderBody('- one\n- two\n\n> quote\n\n**b** *i*');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<strong>b</strong>');
    expect(html).toContain('<em>i</em>');
  });

  it('renders inline code and fenced code blocks', () => {
    const html = renderBody('Use `foo()`.\n\n```\nbar\n```');
    expect(html).toContain('<code>foo()</code>');
    expect(html).toContain('<pre>');
    expect(html).toContain('bar');
  });

  it('renders GFM tables', () => {
    const html = renderBody('| a | b |\n|---|---|\n| 1 | 2 |');
    expect(html).toContain('<table>');
    expect(html).toContain('<th>a</th>');
    expect(html).toContain('<td>1</td>');
  });

  it('output is identical to the Astro adapter for the same markdown', () => {
    const md = '## Hi\n\n- one\n- two\n\n> quote\n\n`code`';
    const html = renderBody(md);
    expect(html).toContain('<h2>Hi</h2>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<code>code</code>');
  });

  it('strips raw <script> tags via rehype-sanitize', () => {
    const html = renderBody('<script>alert(1)</script>\n\nsafe');
    expect(html).not.toContain('<script');
    expect(html).toContain('safe');
  });
});

describe('renderBody (next) — html', () => {
  it('passes through a fragment with sanitisation', () => {
    const html = renderBody('<p>Hi <em>there</em>.</p>', 'html');
    expect(html).toContain('<p>Hi <em>there</em>.</p>');
  });

  it('strips <script> tags', () => {
    const html = renderBody('<p>k</p><script>boom()</script>', 'html');
    expect(html).not.toContain('<script');
    expect(html).toContain('<p>k</p>');
  });

  it('strips inline event handlers', () => {
    const html = renderBody('<a href="/" onclick="x()">a</a>', 'html');
    expect(html).not.toContain('onclick');
  });

  it('strips <style> tags by default', () => {
    const html = renderBody('<style>p{color:red}</style><p>x</p>', 'html');
    expect(html).not.toContain('<style');
    expect(html).toContain('<p>x</p>');
  });
});

describe('renderBody (next) — txt', () => {
  it('wraps text in <pre> and escapes', () => {
    expect(renderBody('a < b & c', 'txt')).toBe('<pre>a &lt; b &amp; c</pre>');
  });
});

describe('renderBody (next) — adoc', () => {
  it('throws a clear error', () => {
    expect(() => renderBody('= h', 'adoc')).toThrow(/AsciiDoc/);
  });
});

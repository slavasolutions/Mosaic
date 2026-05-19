import { describe, expect, it } from 'vitest';
import { renderBody } from '../src/markdown.js';

describe('renderBody — markdown (default)', () => {
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

  it('renders ordered and unordered lists', () => {
    const ul = renderBody('- one\n- two\n- three');
    expect(ul).toMatch(/<ul>[\s\S]*<li>one<\/li>[\s\S]*<li>two<\/li>/);

    const ol = renderBody('1. first\n2. second');
    expect(ol).toMatch(/<ol>[\s\S]*<li>first<\/li>[\s\S]*<li>second<\/li>/);
  });

  it('renders blockquote, bold and italic', () => {
    const html = renderBody('> a quote\n\n**bold** and *italic*');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  it('renders inline and fenced code', () => {
    const html = renderBody('Use `foo()` here.\n\n```json\n{"a":1}\n```');
    expect(html).toContain('<code>foo()</code>');
    expect(html).toContain('<pre>');
    expect(html).toContain('"a":1');
  });

  it('renders GFM tables', () => {
    const html = renderBody('| a | b |\n|---|---|\n| 1 | 2 |');
    expect(html).toContain('<table>');
    expect(html).toContain('<th>a</th>');
    expect(html).toContain('<td>1</td>');
  });

  it('strips raw <script> tags via rehype-sanitize', () => {
    const html = renderBody('<script>alert(1)</script>\n\nhello');
    expect(html).not.toContain('<script');
    expect(html).toContain('hello');
  });

  it('treats explicit bodyExt="md" the same as default', () => {
    const a = renderBody('## Hi', 'md');
    const b = renderBody('## Hi');
    expect(a).toBe(b);
  });
});

describe('renderBody — html (rehype pass-through, sanitised)', () => {
  it('returns a sanitised HTML fragment', () => {
    const html = renderBody('<p>Hello <strong>world</strong>.</p>', 'html');
    expect(html).toContain('<p>Hello <strong>world</strong>.</p>');
  });

  it('strips <script> tags from HTML body', () => {
    const html = renderBody(
      '<p>safe</p><script>alert(1)</script>',
      'html',
    );
    expect(html).not.toContain('<script');
    expect(html).toContain('<p>safe</p>');
  });

  it('strips inline event handlers from HTML body', () => {
    const html = renderBody('<a href="/x" onclick="boom()">click</a>', 'html');
    expect(html).not.toContain('onclick');
    expect(html).toContain('click');
  });

  it('strips <style> tags by default (rehype-sanitize)', () => {
    const html = renderBody(
      '<style>p{color:red}</style><p>x</p>',
      'html',
    );
    expect(html).not.toContain('<style');
    expect(html).toContain('<p>x</p>');
  });
});

describe('renderBody — txt (pre-wrapped, escaped)', () => {
  it('wraps text in <pre> and escapes HTML', () => {
    const html = renderBody('line 1\nline 2 <not a tag>', 'txt');
    expect(html).toBe('<pre>line 1\nline 2 &lt;not a tag&gt;</pre>');
  });

  it('escapes ampersands', () => {
    expect(renderBody('a & b', 'txt')).toBe('<pre>a &amp; b</pre>');
  });
});

describe('renderBody — adoc (deferred)', () => {
  it('throws a clear error for .adoc bodies', () => {
    expect(() => renderBody('= heading', 'adoc')).toThrow(/AsciiDoc/);
  });
});

import { describe, it, expect } from 'vitest';
import { prettyJson, formatHead } from '../src/format.js';

describe('prettyJson', () => {
  it('pretty-prints a JSON value with default 2-space indent', () => {
    expect(prettyJson({ a: 1, b: [2, 3] })).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });

  it('returns the literal "undefined" when given undefined', () => {
    expect(prettyJson(undefined)).toBe('undefined');
  });

  it('falls back gracefully on unserialisable input', () => {
    const a: Record<string, unknown> = {};
    a.self = a;
    expect(prettyJson(a)).toMatch(/^\[unserialisable:/);
  });
});

describe('formatHead', () => {
  it('trims leading/trailing whitespace', () => {
    expect(formatHead('\n  <title>Hi</title>\n  ')).toBe('<title>Hi</title>');
  });
});

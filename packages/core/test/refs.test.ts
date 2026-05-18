/**
 * §11 refs grammar + RFC 6901 JSON Pointer tests.
 */
import { describe, it, expect } from 'vitest';
import {
  evaluatePointer,
  isEscapedRefString,
  isRefString,
  parseRef,
  resolveIdentity,
  unescapeRef,
} from '../src/refs.js';

describe('parseRef (§11.2 + §11.3)', () => {
  it('parses an absolute ref', () => {
    expect(parseRef('ref:team/ada')).toEqual({
      identity: 'team/ada',
      pointer: null,
      kind: 'absolute',
    });
  });

  it('parses a root-anchored absolute ref', () => {
    expect(parseRef('ref:/team/ada').identity).toBe('/team/ada');
    expect(parseRef('ref:/team/ada').kind).toBe('absolute');
  });

  it('parses a `./` relative ref', () => {
    expect(parseRef('ref:./ada').kind).toBe('relative');
  });

  it('parses a `../` relative ref', () => {
    expect(parseRef('ref:../team/ada').kind).toBe('relative');
  });

  it('extracts the JSON Pointer after `#`', () => {
    const r = parseRef('ref:/team/ada#/name');
    expect(r.identity).toBe('/team/ada');
    expect(r.pointer).toBe('/name');
  });
});

describe('parseRef hard ceiling (§11.7)', () => {
  it('rejects wildcard `*`', () => {
    expect(() => parseRef('ref:/team/*')).toThrow(/wildcard/);
  });
  it('rejects predicate `[…]`', () => {
    expect(() => parseRef("ref:/team[email='ada@x.io']")).toThrow(/predicate/);
  });
  it('rejects `?`', () => {
    expect(() => parseRef('ref:/team/?')).toThrow(/wildcard/);
  });
});

describe('resolveIdentity (§11.3)', () => {
  it('strips a leading / for absolute', () => {
    expect(
      resolveIdentity(parseRef('ref:/team/ada'), 'blog'),
    ).toBe('team/ada');
  });

  it('keeps absolute without /', () => {
    expect(resolveIdentity(parseRef('ref:team/ada'), 'blog')).toBe('team/ada');
  });

  it('resolves `./x` against referrer collection', () => {
    expect(resolveIdentity(parseRef('ref:./ada'), 'team')).toBe('team/ada');
  });

  it('resolves `../sibling/x` against referrer collection', () => {
    expect(
      resolveIdentity(parseRef('ref:../themes/light'), 'blog'),
    ).toBe('themes/light');
  });

  it('throws when relative ref walks above root', () => {
    expect(() => resolveIdentity(parseRef('ref:../x'), '')).toThrow(/above root/);
  });
});

describe('evaluatePointer (RFC 6901)', () => {
  const doc = {
    name: 'Ada',
    nested: { inner: 'V' },
    arr: ['a', 'b', { k: 'v' }],
    'a/b': 'slash',
    'm~n': 'tilde',
  };
  it('empty pointer = whole doc', () => {
    expect(evaluatePointer(doc, '')).toEqual(doc);
  });
  it('reads a top-level key', () => {
    expect(evaluatePointer(doc, '/name')).toBe('Ada');
  });
  it('reads nested', () => {
    expect(evaluatePointer(doc, '/nested/inner')).toBe('V');
  });
  it('reads array index', () => {
    expect(evaluatePointer(doc, '/arr/1')).toBe('b');
    expect(evaluatePointer(doc, '/arr/2/k')).toBe('v');
  });
  it('decodes ~1 -> /', () => {
    expect(evaluatePointer(doc, '/a~1b')).toBe('slash');
  });
  it('decodes ~0 -> ~', () => {
    expect(evaluatePointer(doc, '/m~0n')).toBe('tilde');
  });
  it('returns undefined for missing key', () => {
    expect(evaluatePointer(doc, '/missing')).toBeUndefined();
  });
  it('returns undefined for out-of-range index', () => {
    expect(evaluatePointer(doc, '/arr/99')).toBeUndefined();
  });
  it('returns undefined for `-` (one-past-end)', () => {
    expect(evaluatePointer(doc, '/arr/-')).toBeUndefined();
  });
  it('throws on malformed pointer', () => {
    expect(() => evaluatePointer(doc, 'name')).toThrow();
  });
});

describe('escape (§11.2)', () => {
  it('detects `ref:` sentinel', () => {
    expect(isRefString('ref:x')).toBe(true);
    expect(isRefString('hello')).toBe(false);
  });
  it('detects `\\ref:` escape', () => {
    expect(isEscapedRefString('\\ref:x')).toBe(true);
  });
  it('unescape strips one leading backslash only', () => {
    expect(unescapeRef('\\ref:x')).toBe('ref:x');
  });
});

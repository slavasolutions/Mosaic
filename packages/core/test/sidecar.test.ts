/**
 * §8 sidecar merge tests.
 */
import { describe, it, expect } from 'vitest';
import { mergeSidecar, modifiersEqual } from '../src/sidecar.js';

describe('mergeSidecar (§8.2)', () => {
  it('combines disjoint keys', () => {
    expect(
      mergeSidecar({ a: 1 }, { b: 2 }),
    ).toEqual({ a: 1, b: 2 });
  });
  it('sidecar wins on collision', () => {
    expect(
      mergeSidecar({ a: 1 }, { a: 2 }),
    ).toEqual({ a: 2 });
  });
  it('is shallow (§8.3) — does NOT deep merge', () => {
    expect(
      mergeSidecar({ x: { keep: 1 } }, { x: { only: 2 } }),
    ).toEqual({ x: { only: 2 } });
  });
  it('does not mutate inputs', () => {
    const a = { a: 1 };
    const b = { b: 2 };
    mergeSidecar(a, b);
    expect(a).toEqual({ a: 1 });
    expect(b).toEqual({ b: 2 });
  });
});

describe('modifiersEqual (§8.1)', () => {
  it('treats equal sets equal', () => {
    expect(modifiersEqual(['fr'], ['fr'])).toBe(true);
  });
  it('is order-insensitive', () => {
    expect(modifiersEqual(['a', 'b'], ['b', 'a'])).toBe(true);
  });
  it('differs on size', () => {
    expect(modifiersEqual(['fr'], ['fr', 'draft'])).toBe(false);
  });
});

/**
 * §12 cascade tests.
 */
import { describe, it, expect } from 'vitest';
import { applyCascade } from '../src/cascade.js';

describe('applyCascade (§12.3)', () => {
  it('fills `locale` from nearest ancestor when absent (base-blessed)', () => {
    expect(
      applyCascade(
        { title: 'Hello' },
        [{ locale: 'en' }, { locale: 'fr' }],
        [],
      ),
    ).toEqual({ title: 'Hello', locale: 'fr' }); // nearest wins (last in chain)
  });

  it('record value shadows ancestor `locale`', () => {
    expect(
      applyCascade(
        { title: 'Hello', locale: 'de' },
        [{ locale: 'en' }, { locale: 'fr' }],
        [],
      ),
    ).toEqual({ title: 'Hello', locale: 'de' });
  });

  it('only fills declared keys (§12.3 clause 5)', () => {
    // `theme` is NOT declared cascading → MUST NOT inherit.
    expect(
      applyCascade(
        { title: 'Hello' },
        [{ theme: 'dark', locale: 'en' }],
        [], // no cascadingKeys declared
      ),
    ).toEqual({ title: 'Hello', locale: 'en' }); // theme not pulled in
  });

  it('fills profile-declared keys', () => {
    expect(
      applyCascade(
        { title: 'Hello' },
        [{ theme: 'dark' }],
        ['theme'],
      ),
    ).toEqual({ title: 'Hello', theme: 'dark' });
  });

  it('is shallow / key-level only (§12.3 clause 4)', () => {
    // Even when the value is an object, present key fully shadows ancestor.
    expect(
      applyCascade(
        { theme: { bg: '#fff' } },
        [{ theme: { bg: '#000', fg: '#000' } }],
        ['theme'],
      ),
    ).toEqual({ theme: { bg: '#fff' } }); // no merge
  });
});

/**
 * §7 identity normalisation tests.
 */
import { describe, it, expect } from 'vitest';
import { identityOf, isHidden, splitName } from '../src/identity.js';

describe('splitName (§7)', () => {
  it('accepts a plain name + ext', () => {
    expect(splitName('about.json')).toEqual({
      base: 'about',
      modifiers: [],
      ext: 'json',
      err: null,
    });
  });

  it('accepts modifiers', () => {
    expect(splitName('about.fr.json')).toEqual({
      base: 'about',
      modifiers: ['fr'],
      ext: 'json',
      err: null,
    });
  });

  it('accepts stacked modifiers', () => {
    expect(splitName('post.fr.draft.md').modifiers).toEqual(['fr', 'draft']);
  });

  it('rejects names with no extension', () => {
    expect(splitName('about').err).toMatch(/missing extension/);
  });

  it('rejects uppercase base', () => {
    expect(splitName('About.json').err).toMatch(/invalid record name/);
  });

  it('rejects leading hyphen', () => {
    expect(splitName('-about.json').err).toMatch(/invalid record name/);
  });

  it('rejects trailing hyphen on base', () => {
    expect(splitName('about-.json').err).toMatch(/invalid record name/);
  });

  it('rejects underscore-prefixed base', () => {
    // The §7.2 hidden rule belongs to isHidden; splitName still rejects the
    // charset (underscores are not in [a-z0-9-]).
    expect(splitName('_draft.json').err).toMatch(/invalid record name/);
  });

  it('rejects bad modifier charset', () => {
    expect(splitName('about.FR.json').err).toMatch(/invalid modifier/);
  });
});

describe('isHidden (§7.2)', () => {
  it('flags `_` prefix at any depth', () => {
    expect(isHidden(['_drafts', 'post.md'])).toBe(true);
    expect(isHidden(['ok', '_x.json'])).toBe(true);
  });
  it('flags `.` prefix at any depth', () => {
    expect(isHidden(['.git', 'config'])).toBe(true);
  });
  it('passes plain names', () => {
    expect(isHidden(['team', 'ada.json'])).toBe(false);
  });
});

describe('identityOf (§7.1)', () => {
  it('strips ext', () => {
    expect(identityOf(['about.json']).identity).toBe('about');
  });
  it('strips modifiers', () => {
    expect(identityOf(['about.fr.json']).identity).toBe('about');
  });
  it('strips trailing /index', () => {
    expect(identityOf(['about', 'index.json']).identity).toBe('about');
  });
  it('roots index.json to ""', () => {
    expect(identityOf(['index.json']).identity).toBe('');
  });
  it('reports folderForm flag', () => {
    expect(identityOf(['team', 'index.json']).folderForm).toBe(true);
    expect(identityOf(['team.json']).folderForm).toBe(false);
  });
});

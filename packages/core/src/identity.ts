/**
 * Identity normalisation per `01-format.md` §7.
 *
 * - §7   : `name[.modifier]*.ext`, lowercase ASCII + digits + hyphen.
 * - §7.1 : identity = strip ext, strip modifiers, strip trailing `/index`.
 * - §7.2 : names starting with `_` or `.` are hidden.
 */

import type { Identity } from './types.js';

const NAME_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** True when any path segment begins with `_` or `.` (§7.2). */
export function isHidden(relParts: readonly string[]): boolean {
  for (const seg of relParts) {
    if (seg.startsWith('_') || seg.startsWith('.')) return true;
  }
  return false;
}

/** Validates the base/modifier charset. */
export function isValidNameToken(s: string): boolean {
  return NAME_RE.test(s);
}

/** Result of {@link splitName}. */
export interface SplitName {
  base: string;
  modifiers: string[];
  ext: string;
  /** Non-null when the filename violates §7. */
  err: string | null;
}

/**
 * Split a filename per §7.
 *
 * - Extension is the FINAL dot-segment.
 * - Base is the FIRST dot-segment.
 * - Modifiers are everything between.
 *
 * Mirrors the algorithm in `validate.py:split_name`.
 */
export function splitName(filename: string): SplitName {
  if (!filename.includes('.')) {
    return {
      base: filename,
      modifiers: [],
      ext: '',
      err: `missing extension; §7.3 requires .ext (got '${filename}')`,
    };
  }
  const parts = filename.split('.');
  const base = parts[0]!;
  const ext = parts[parts.length - 1]!;
  const modifiers = parts.slice(1, -1);
  if (!NAME_RE.test(base)) {
    return {
      base,
      modifiers,
      ext,
      err:
        `invalid record name '${base}' (§7: lowercase a-z 0-9 hyphen, ` +
        `no leading/trailing hyphen)`,
    };
  }
  for (const m of modifiers) {
    if (!NAME_RE.test(m)) {
      return {
        base,
        modifiers,
        ext,
        err:
          `invalid modifier '.${m}' in '${filename}' ` +
          `(§7: same charset as base name)`,
      };
    }
  }
  return { base, modifiers, ext, err: null };
}

/**
 * Compute the §7.1 identity of a record file given its path segments
 * relative to the content root. The folder-form flag tells callers whether
 * the file is `index.*` (so they can detect §7.1 collisions).
 *
 * Root collection record (`index.json` at root) → identity `""`.
 */
export function identityOf(relParts: readonly string[]): Identity {
  if (relParts.length === 0) {
    throw new Error('identityOf: empty path');
  }
  const filename = relParts[relParts.length - 1]!;
  const { base, modifiers, ext, err } = splitName(filename);
  // Even when err is set, callers may still want a best-effort identity for
  // diagnostics. Keep this function total.
  void err;
  const parents = relParts.slice(0, -1);
  const folderForm = base === 'index';
  let idParts: string[];
  if (folderForm) {
    idParts = parents.slice();
  } else {
    idParts = parents.slice();
    idParts.push(base);
  }
  return {
    identity: idParts.join('/'),
    folderForm,
    base,
    modifiers,
    ext,
  };
}

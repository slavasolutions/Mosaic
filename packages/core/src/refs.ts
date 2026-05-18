/**
 * References per `02-references.md` §11.
 *
 * Grammar (§11.2):
 *   ref:<identity>[#<json-pointer>]
 *
 * Anchors (§11.3):
 *   absolute  — `team/ada` (resolved from the root) OR explicit `/team/ada`
 *   relative  — `./ada` or `../team/ada` (resolved against referrer's collection)
 *
 * Hard ceiling (§11.7): no wildcards, no predicates, no content queries. We
 * reject these eagerly during parse.
 *
 * Escape (§11.2): a leading `\ref:` is a literal string (the backslash is
 * stripped); all other backslashes are preserved.
 */

import type { Json, JsonObject, RefValue } from './types.js';

const REF_SENTINEL = 'ref:';
const ESCAPED_SENTINEL = '\\ref:';

/** Cheap, side-effect-free check for the §11.2 sentinel. */
export function isRefString(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(REF_SENTINEL);
}

/** Cheap check for the §11.2 escape form. */
export function isEscapedRefString(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(ESCAPED_SENTINEL);
}

/** Apply the §11.2 escape: turn `\ref:foo` into the literal `ref:foo`. */
export function unescapeRef(value: string): string {
  return value.slice(1); // drop the single leading backslash
}

/** Forbidden tokens per §11.7. */
const REJECT_PATTERNS = [
  { re: /\*/, msg: 'wildcard `*`' },
  { re: /\?/, msg: 'wildcard `?`' },
  { re: /\[/, msg: 'predicate `[…]`' },
  { re: /\]/, msg: 'predicate `[…]`' },
];

/**
 * Parse a `ref:` string.
 *
 * Returns the {@link RefValue} or throws on §11.7 violations. Callers running
 * resolution treat a parse error as "this ref is malformed" — they typically
 * surface it as a warning and leave the value untouched.
 */
export function parseRef(raw: string): RefValue {
  if (!raw.startsWith(REF_SENTINEL)) {
    throw new Error(`not a reference: ${raw}`);
  }
  const body = raw.slice(REF_SENTINEL.length);

  // §11.7 hard ceiling — reject before doing any work.
  for (const { re, msg } of REJECT_PATTERNS) {
    if (re.test(body)) {
      throw new Error(`reference contains ${msg} — forbidden by §11.7: ${raw}`);
    }
  }

  let identityPart = body;
  let pointer: string | null = null;
  const hashIdx = body.indexOf('#');
  if (hashIdx !== -1) {
    identityPart = body.slice(0, hashIdx);
    pointer = body.slice(hashIdx + 1);
  }

  if (identityPart.length === 0) {
    throw new Error(`reference has empty identity: ${raw}`);
  }

  const kind: 'absolute' | 'relative' =
    identityPart.startsWith('./') || identityPart.startsWith('../')
      ? 'relative'
      : 'absolute';

  return { identity: identityPart, pointer, kind };
}

/**
 * Resolve a relative identity against the referrer's collection identity.
 *
 * Per §11.3, relative is "resolved against the *collection* containing the
 * referring record". `referrerCollection` is the dot-less directory identity
 * (e.g. `"blog"` or `""` for root).
 */
export function resolveIdentity(
  ref: RefValue,
  referrerCollection: string,
): string {
  if (ref.kind === 'absolute') {
    // Strip a leading `/` if present — absolute identities are root-relative.
    return ref.identity.startsWith('/')
      ? ref.identity.slice(1)
      : ref.identity;
  }
  // Relative: split referrer collection, then walk per ./ and ../ segments.
  const stack: string[] = referrerCollection ? referrerCollection.split('/') : [];
  const parts = ref.identity.split('/');
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i]!;
    if (i === 0 && seg === '.') {
      continue;
    }
    if (seg === '..') {
      if (stack.length === 0) {
        throw new Error(
          `reference '${ref.identity}' walks above root from '${referrerCollection}'`,
        );
      }
      stack.pop();
      continue;
    }
    if (seg === '.') {
      continue;
    }
    stack.push(seg);
  }
  return stack.join('/');
}

/**
 * Evaluate an RFC 6901 JSON Pointer against a JSON document.
 *
 * Per RFC 6901:
 *   - the empty string refers to the whole document
 *   - tokens are separated by `/`
 *   - `~1` -> `/`, `~0` -> `~`
 *
 * Returns `undefined` if the pointer is unresolvable (consumer decides).
 */
export function evaluatePointer(doc: Json, pointer: string): Json | undefined {
  if (pointer === '') return doc;
  if (!pointer.startsWith('/')) {
    throw new Error(
      `invalid JSON Pointer '${pointer}': must be empty or start with '/'`,
    );
  }
  const tokens = pointer.slice(1).split('/').map(decodeToken);
  let cursor: Json = doc;
  for (const token of tokens) {
    if (cursor === null || typeof cursor !== 'object') return undefined;
    if (Array.isArray(cursor)) {
      // RFC 6901: array indices are non-negative decimal integers OR `-`.
      // The `-` (one-past-end) is undefined for read; treat as miss.
      if (token === '-') return undefined;
      if (!/^(0|[1-9][0-9]*)$/.test(token)) return undefined;
      const idx = parseInt(token, 10);
      if (idx >= cursor.length) return undefined;
      cursor = cursor[idx]!;
    } else {
      const obj = cursor as JsonObject;
      if (!Object.prototype.hasOwnProperty.call(obj, token)) return undefined;
      cursor = obj[token] as Json;
    }
  }
  return cursor;
}

function decodeToken(token: string): string {
  // RFC 6901: ~1 must be decoded before ~0 to avoid reversing.
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

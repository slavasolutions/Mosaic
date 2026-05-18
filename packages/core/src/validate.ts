/**
 * `validate` — TypeScript port of `mosaic-0.9.2/spec/tools/validate.py`.
 *
 * Covers §§5–9 of `01-format.md` only (base format). Refs and cascade live
 * in `readFolder`. Mirrors validate.py:
 *
 *   - §7 name + modifier charset
 *   - §7.1 identity + collision (file form ↔ folder form)
 *   - §7.2 hidden entries silently ignored
 *   - §7.3 only `.json` and `.md` defined; others are opaque (no parse)
 *   - §8 sidecar matching, orphan modifier sidecar warning
 *   - §5.1 markdown frontmatter warning
 *   - root `mosaic.json` parse check
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { identityOf, isHidden, splitName } from './identity.js';
import { modifiersEqual } from './sidecar.js';
import type { ValidationMessage, ValidationResult } from './types.js';

export async function validate(rootPath: string): Promise<ValidationResult> {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];
  const records = new globalThis.Map<string, string[]>();

  const absRoot = path.resolve(rootPath);
  const rootStat = await statOrNull(absRoot);
  if (!rootStat || !rootStat.isDirectory()) {
    return {
      ok: false,
      errors: [{ path: rootPath, message: 'not a directory' }],
      warnings: [],
      records,
    };
  }

  // ---- Pass 1: collect every non-hidden file -------------------------------
  interface Entry {
    rel: string;
    parts: string[];
    abs: string;
    base: string;
    modifiers: string[];
    ext: string;
    /** Original filename, for lowercase check. */
    name: string;
    nameErr: string | null;
  }
  const files: Entry[] = [];
  async function walk(absDir: string, relParts: string[]): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const childParts = [...relParts, ent.name];
      if (isHidden(childParts)) continue;
      const abs = path.join(absDir, ent.name);
      if (ent.isDirectory()) {
        await walk(abs, childParts);
        continue;
      }
      if (!ent.isFile()) continue;
      if (childParts.length === 1 && ent.name === 'mosaic.json') {
        // Validate the manifest is JSON, then skip the structural checks.
        try {
          const txt = await fs.readFile(abs, 'utf8');
          JSON.parse(txt);
        } catch (e) {
          errors.push({
            path: childParts.join('/'),
            message: `manifest mosaic.json is not valid JSON: ${(e as Error).message}`,
          });
        }
        continue;
      }
      const { base, modifiers, ext, err } = splitName(ent.name);
      files.push({
        rel: childParts.join('/'),
        parts: childParts,
        abs,
        base,
        modifiers,
        ext,
        name: ent.name,
        nameErr: err,
      });
    }
  }
  await walk(absRoot, []);
  files.sort((a, b) => a.rel.localeCompare(b.rel));

  // ---- Pass 2: per-file checks --------------------------------------------
  /** Entries that survived split_name (conforming filenames). */
  const conforming: Entry[] = [];
  const byDir = new globalThis.Map<string, Entry[]>();
  for (const f of files) {
    if (f.nameErr) {
      errors.push({ path: f.rel, message: f.nameErr });
      continue;
    }
    if (f.name !== f.name.toLowerCase()) {
      errors.push({ path: f.rel, message: `name must be lowercase: '${f.name}'` });
    }
    if (f.ext === 'json') {
      try {
        const txt = await fs.readFile(f.abs, 'utf8');
        JSON.parse(txt);
      } catch (e) {
        errors.push({ path: f.rel, message: `invalid JSON: ${(e as Error).message}` });
      }
    } else if (f.ext === 'md') {
      try {
        const txt = await fs.readFile(f.abs, 'utf8');
        if (txt.trimStart().startsWith('---')) {
          warnings.push({
            path: f.rel,
            message:
              'markdown frontmatter present; base format treats it as ' +
              'inert text (not metadata). Folder remains valid.',
          });
        }
      } catch {
        errors.push({ path: f.rel, message: 'file is not valid UTF-8' });
      }
    }
    const dir = f.parts.slice(0, -1).join('/');
    const list = byDir.get(dir) ?? [];
    list.push(f);
    byDir.set(dir, list);
    conforming.push(f);
  }

  // ---- Pass 3: sidecar matching + orphan modifier sidecars (§8) ------------
  const sidecarRels = new globalThis.Set<string>();
  for (const [, entries] of byDir) {
    const content = entries.filter((e) => e.ext !== 'json');
    for (const e of entries) {
      if (e.ext !== 'json') continue;
      const matched = content.some(
        (c) => c.base === e.base && modifiersEqual(c.modifiers, e.modifiers),
      );
      if (matched) {
        sidecarRels.add(e.rel);
      } else if (
        e.modifiers.length > 0 &&
        content.some((c) => c.base === e.base && c.modifiers.length === 0)
      ) {
        warnings.push({
          path: e.rel,
          message:
            `orphan modifier sidecar: '.${e.modifiers.join('.')}' has no ` +
            `matching content sibling for '${e.base}'.`,
        });
      }
    }
  }

  // ---- Pass 4: identity resolution + collision (§7.1) ---------------------
  for (const f of conforming) {
    if (sidecarRels.has(f.rel)) continue;
    const ident = identityOf(f.parts).identity || '(root)';
    const list = records.get(ident) ?? [];
    list.push(f.rel);
    records.set(ident, list);
  }

  for (const [ident, srcs] of records) {
    const kinds = new globalThis.Set<string>();
    for (const s of srcs) {
      const lastSlash = s.lastIndexOf('/');
      const name = lastSlash === -1 ? s : s.slice(lastSlash + 1);
      kinds.add(name.startsWith('index.') ? 'folder' : 'file');
    }
    if (kinds.has('file') && kinds.has('folder')) {
      errors.push({
        path: srcs[0]!,
        message:
          `ambiguous identity '${ident}': exists as both a file form and ` +
          `a folder (index.*) form. Pick one.`,
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    records,
  };
}

async function statOrNull(p: string) {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

/**
 * Build a flat file-tree payload for the @ssolu/mosaic-devtool Tree tab.
 *
 * Walks the Mosaic content folder at SSG time and emits the shape the
 * devtool's `tree.ts` accepts:
 *
 *   { root, entries: [{ path }], activePath? }
 *
 * `activePath` is the canonical file the current record came from; the
 * devtool also highlights its ancestor directories.
 */

import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep, posix } from 'node:path';

export interface TreePayload {
  root: string;
  entries: Array<{ path: string }>;
  activePath?: string;
}

const SKIP = new Set(['node_modules', '.git', '.DS_Store']);

function walk(dir: string, base: string, out: string[]): void {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of names) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    let s;
    try {
      s = statSync(full);
    } catch {
      continue;
    }
    const rel = relative(base, full).split(sep).join(posix.sep);
    if (s.isDirectory()) {
      walk(full, base, out);
    } else if (s.isFile()) {
      out.push(rel);
    }
  }
}

export function buildTree(contentRoot: string, rootLabel = 'content'): TreePayload {
  const paths: string[] = [];
  walk(contentRoot, contentRoot, paths);
  paths.sort();
  return {
    root: rootLabel,
    entries: paths.map((p) => ({ path: p })),
  };
}

/**
 * Convert an absolute source file path (e.g. record.filePath from the
 * loader) into the tree-relative path used in `entries[].path`. Returns
 * null when the file lives outside the content root.
 */
export function toTreePath(absPath: string, contentRoot: string): string | null {
  const rel = relative(contentRoot, absPath);
  if (rel.startsWith('..') || rel.length === 0) return null;
  return rel.split(sep).join(posix.sep);
}

import { readFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { globby } from 'globby';
import type { ScannedFile } from './types.js';

const INCLUDE_GLOBS = [
  '**/*.html',
  '**/*.htm',
  '**/*.css',
  '**/*.scss',
  '**/*.sass',
  '**/*.less',
  '**/*.jsx',
  '**/*.tsx',
  '**/*.js',
  '**/*.ts',
  '**/*.mdx',
  '**/*.md',
  '**/*.vue',
  '**/*.svelte',
  '**/*.astro',
];

const DEFAULT_IGNORES = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/.next/**',
  '**/.astro/**',
  '**/.svelte-kit/**',
  '**/.nuxt/**',
  '**/coverage/**',
  '**/.cache/**',
  '**/out/**',
];

/**
 * Walk a directory and return UTF-8 contents of source files relevant to the scan.
 *
 * Skips build artefacts, vendor directories, and binaries.
 */
export async function walk(root: string): Promise<ScannedFile[]> {
  const absRoot = resolve(root);
  const paths = await globby(INCLUDE_GLOBS, {
    cwd: absRoot,
    ignore: DEFAULT_IGNORES,
    onlyFiles: true,
    followSymbolicLinks: false,
    dot: false,
  });
  paths.sort();

  const files = await Promise.all(
    paths.map(async (rel): Promise<ScannedFile | null> => {
      const abs = resolve(absRoot, rel);
      try {
        const content = await readFile(abs, 'utf8');
        return {
          relPath: relative(absRoot, abs) || rel,
          absPath: abs,
          content,
          ext: extname(rel).toLowerCase(),
        };
      } catch {
        return null;
      }
    }),
  );

  return files.filter((f): f is ScannedFile => f !== null);
}

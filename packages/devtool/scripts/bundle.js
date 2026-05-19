#!/usr/bin/env node
/**
 * Bundle src/iife.ts into a single self-contained IIFE script suitable
 * for `<script src="…/mosaic-devtool.js">`. Runs after `tsc` has emitted
 * the ESM build to `dist/esm/`.
 */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, '..');

await build({
  entryPoints: [path.join(pkgRoot, 'src/iife.ts')],
  outfile: path.join(pkgRoot, 'dist/mosaic-devtool.js'),
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  platform: 'browser',
  minify: true,
  minifyIdentifiers: true,
  minifySyntax: true,
  minifyWhitespace: true,
  treeShaking: true,
  sourcemap: false,
  legalComments: 'none',
  banner: {
    js:
      '/* @ssolu/mosaic-devtool — Apache-2.0 — ' +
      'https://github.com/slavasolutions/mosaic */',
  },
});

console.log('bundled dist/mosaic-devtool.js');

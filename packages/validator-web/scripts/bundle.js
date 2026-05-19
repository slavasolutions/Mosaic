#!/usr/bin/env node
/**
 * Bundle src/iife.ts into a single self-contained IIFE for `<script src>`.
 * Inlines @ssolu/mosaic-core (validateFiles + identity + sidecar) so the
 * consumer doesn't need a second HTTP fetch.
 */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, '..');

await build({
  entryPoints: [path.join(pkgRoot, 'src/iife.ts')],
  outfile: path.join(pkgRoot, 'dist/mosaic-validator-web.js'),
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  platform: 'browser',
  minify: true,
  sourcemap: false,
  legalComments: 'none',
  // node:fs is fs-coupled validate(); the browser bundle only uses validateFiles.
  // Exclude it explicitly so esbuild doesn't try to polyfill.
  external: ['node:fs', 'node:path'],
  banner: {
    js:
      '/* @ssolu/mosaic-validator-web — Apache-2.0 — ' +
      'https://github.com/slavasolutions/mosaic */',
  },
});

console.log('bundled dist/mosaic-validator-web.js');

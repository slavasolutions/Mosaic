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
  // node:fs / node:path leak in from @ssolu/mosaic-core's fs-coupled validate().
  // The browser bundle only uses validateFiles, but esbuild can't tree-shake the
  // top-level import. Resolve them to a tiny no-op stub so the runtime doesn't
  // throw "Dynamic require of 'node:fs' is not supported".
  plugins: [{
    name: 'stub-node-builtins',
    setup(b) {
      b.onResolve({ filter: /^node:(fs|path)$/ }, () => ({
        path: 'noop',
        namespace: 'stub-node',
      }));
      b.onLoad({ filter: /.*/, namespace: 'stub-node' }, () => ({
        contents:
          'const noop = () => { throw new Error("node:* not available in browser bundle"); };' +
          'export default {};' +
          'export const promises = new Proxy({}, { get: () => noop });' +
          'export const sep = "/";' +
          'export const join = (...p) => p.join("/");' +
          'export const dirname = (p) => p.split("/").slice(0, -1).join("/");' +
          'export const basename = (p) => p.split("/").pop();' +
          'export const resolve = (...p) => p.join("/");',
        loader: 'js',
      }));
    },
  }],
  banner: {
    js:
      '/* @ssolu/mosaic-validator-web — Apache-2.0 — ' +
      'https://github.com/slavasolutions/mosaic */',
  },
});

console.log('bundled dist/mosaic-validator-web.js');

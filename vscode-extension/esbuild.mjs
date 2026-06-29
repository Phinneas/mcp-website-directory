/**
 * esbuild.mjs — bundle the extension into a single dist/extension.js
 *
 * Externalizes the `vscode` API (provided by the host) and bundles everything
 * else. The `@engine` alias resolves to the website's shared search engine
 * (src/lib/search-engine.js) — single source of truth, no copy.
 */
import * as esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ENGINE_PATH = resolve(here, '..', 'src', 'lib', 'search-engine.js');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  outfile: 'dist/extension.js',
  external: ['vscode'],
  alias: { '@engine': ENGINE_PATH },
  sourcemap: !production,
  minify: production,
  loader: { '.json': 'json' },
  logLevel: 'info',
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('watching…');
} else {
  await esbuild.build(options);
  console.log('build complete → dist/extension.js');
}

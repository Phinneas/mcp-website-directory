import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/bin.ts'],
  outDir: 'dist',
  format: ['esm'],
  banner: {
    js: '#!/usr/bin/env node',
  },
  bundle: true,
  splitting: false,
  minify: false,
  sourcemap: true,
  target: 'node18',
  clean: true,
});

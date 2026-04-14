#!/usr/bin/env node
/**
 * Postbuild script: remove SSR pages from the _routes.json exclude list.
 *
 * The @astrojs/cloudflare adapter parses _redirects and adds redirect
 * destinations to the exclude list, treating them as static assets. This
 * incorrectly excludes SSR pages that happen to appear as redirect targets.
 * Since Cloudflare Pages lets exclude win over include, we must strip these
 * entries from exclude after the build.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const routesPath = join(__dirname, '../dist/_routes.json');

// SSR pages that must be routed through the Worker, not served as static files.
const SSR_PAGES = [
  '/local-stdio',
  '/cloud-native',
  '/self-hosted',
  '/enterprise-saas',
  '/enterprise-readiness',
];

const routes = JSON.parse(readFileSync(routesPath, 'utf8'));

const before = routes.exclude.length;
routes.exclude = routes.exclude.filter(path => !SSR_PAGES.includes(path));
const removed = before - routes.exclude.length;

writeFileSync(routesPath, JSON.stringify(routes, null, 2));
console.log(`fix-routes: removed ${removed} SSR page(s) from _routes.json exclude list`);

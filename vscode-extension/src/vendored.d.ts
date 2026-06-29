/**
 * Ambient module declaration for the shared search engine, bundled via the
 * esbuild `@engine` alias (resolves to ../../src/lib/search-engine.js).
 *
 * This file has no top-level import/export so the `declare module` is globally
 * ambient — that's what makes `import { searchServers } from '@engine'`
 * type-check. The real implementation is bundled at build time; the extension's
 * natural-language search therefore runs the exact same engine as the website.
 */

declare module '@engine' {
  export interface EngineHit {
    score: number;
    reasons: string[];
    matched: boolean;
    server: any;
  }

  export interface EngineResult {
    query: string;
    inferredFilters: any;
    hits: EngineHit[];
    total: number;
    tookMs: number;
  }

  export function searchServers(
    query: string,
    servers: any[],
    opts?: { limit?: number }
  ): EngineResult;

  export function summarizeFilters(u: any): string;
}

/**
 * config.test.ts — verify the extension generates config identical to the
 * website's Config Generator output. Run: tsx src/config.test.ts
 */
import assert from 'node:assert/strict';
import {
  generateServerConfig,
  generateConfigBlock,
  stringifyConfig,
  categoryLabel,
} from './config';
import type { ShelfServer } from './types';

function mk(partial: Partial<ShelfServer>): ShelfServer {
  return {
    id: 'x',
    deployment: 'local_stdio',
    fields: {
      name: 'X',
      description: '',
      author: '@x',
      category: 'development',
      language: 'TypeScript',
      stars: 0,
      github_url: null,
      npm_package: null,
    },
    securityAudit: null,
    ...partial,
  };
}

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log('  ✓', name);
};

console.log('config.test.ts — matching website Config Generator output\n');

test('npx command uses npm_package when present', () => {
  const s = mk({ id: 'foo', fields: { ...mk({}).fields, npm_package: '@scope/foo' } });
  assert.equal(generateServerConfig(s).command, 'npx @scope/foo');
  assert.deepEqual(generateServerConfig(s).args, []);
});

test('npx command falls back to id when no npm_package', () => {
  const s = mk({ id: 'my-server' });
  assert.equal(generateServerConfig(s).command, 'npx my-server');
});

test('github server gets GITHUB_TOKEN env', () => {
  const s = mk({ id: 'github' });
  const env = generateServerConfig(s).env;
  assert.ok(env && 'GITHUB_TOKEN' in env);
});

test('database category gets DATABASE_URL env', () => {
  const s = mk({ id: 'pg', fields: { ...mk({}).fields, category: 'databases' } });
  const env = generateServerConfig(s).env;
  assert.ok(env && 'DATABASE_URL' in env);
});

test('cloud/file-system category gets API_KEY env', () => {
  const s = mk({ id: 'aws', fields: { ...mk({}).fields, category: 'cloud' } });
  assert.ok(generateServerConfig(s).env && 'API_KEY' in generateServerConfig(s).env!);
});

test('plain server has no env', () => {
  const s = mk({ id: 'notes', fields: { ...mk({}).fields, category: 'productivity' } });
  assert.equal(generateServerConfig(s).env, undefined);
});

test('config block shape matches website: { mcpServers: { id: {command,args,env} } }', () => {
  const s = mk({ id: 'foo', fields: { ...mk({}).fields, npm_package: 'foo' } });
  const block = generateConfigBlock(s);
  assert.ok('mcpServers' in block);
  assert.ok('foo' in block.mcpServers);
  assert.deepEqual(block.mcpServers.foo, { command: 'npx foo', args: [], env: undefined });
});

test('stringifyConfig uses 2-space indent', () => {
  const s = mk({ id: 'foo', fields: { ...mk({}).fields, npm_package: 'foo' } });
  const text = stringifyConfig(generateConfigBlock(s));
  assert.ok(text.includes('  "mcpServers"'), 'expected 2-space indentation');
});

test('categoryLabel maps known categories', () => {
  assert.equal(categoryLabel('databases'), 'Databases');
  assert.equal(categoryLabel('browser-automation'), 'Browser Automation');
});

console.log(`\n✅ ${passed} config tests passed`);

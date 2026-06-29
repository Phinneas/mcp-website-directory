/**
 * extension.ts — entry point for the My MCP Shelf VS Code/Cursor extension.
 *
 * Surfaces curated, trust-scored MCP servers in the command palette and installs
 * them with one click, generating config identical to the website's Config
 * Generator. The natural-language search reuses the website's shared engine.
 */
import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { ShelfServer, ConfigTarget } from './types';
import { loadServers, snapshotMeta, categories, tryEnrichLive } from './data';
import { scoreServer, summaryLine, rankByTrust, securityTier } from './scores';
import {
  generateServerConfig,
  generateConfigBlock,
  stringifyConfig,
  resolveHome,
  CONFIG_TARGETS,
  categoryLabel,
} from './config';
import { searchServers, summarizeFilters } from '@engine';

const SITE = 'https://www.mymcpshelf.com';

interface ServerPickItem extends vscode.QuickPickItem {
  server: ShelfServer;
}
interface CategoryPickItem extends vscode.QuickPickItem {
  category: string;
}
interface TargetPickItem extends vscode.QuickPickItem {
  target: ConfigTarget;
}

export function activate(context: vscode.ExtensionContext): void {
  const cfg = () => vscode.workspace.getConfiguration('myMcpShelf');

  const browse = vscode.commands.registerCommand('mcpShelf.browse', async () => {
    const servers = await getServers();
    if (!servers.length) return notifyEmpty();
    await showServerPicker('Browse curated MCP servers', rankByTrust(servers));
  });

  const search = vscode.commands.registerCommand('mcpShelf.search', async () => {
    const servers = await getServers();
    if (!servers.length) return notifyEmpty();
    const query = await vscode.window.showInputBox({
      prompt: 'Describe what you need in plain English',
      placeHolder: 'e.g. read Postgres safely with row-level limits',
      title: 'My MCP Shelf — Natural-Language Search',
    });
    if (query === undefined) return;
    const res = searchServers(query, servers, { limit: 50 });
    const filters = summarizeFilters(res.inferredFilters);

    if (!res.hits.length) {
      vscode.window.showInformationMessage(`No servers matched “${query}”. Try rephrasing.`);
      return;
    }

    const items: ServerPickItem[] = res.hits.map((h) => {
      const s = h.server as ShelfServer;
      return {
        label: s.fields.name,
        description: `$(star) ${s.fields.stars.toLocaleString()}  ·  score ${Math.round(h.score)}`,
        detail: h.reasons.join('  ·  ') || categoryLabel(s.fields.category),
        server: s,
      };
    });
    const picked = await vscode.window.showQuickPick(items, {
      title: `My MCP Shelf — ${res.total} match${res.total === 1 ? '' : 'es'}${filters ? ` · ${filters}` : ''}`,
      placeHolder: query,
      matchOnDescription: true,
      matchOnDetail: true,
    });
    if (picked) await installFlow(picked.server);
  });

  const byCategory = vscode.commands.registerCommand('mcpShelf.byCategory', async () => {
    const servers = await getServers();
    if (!servers.length) return notifyEmpty();

    const catItems: CategoryPickItem[] = categories()
      .sort()
      .map((c) => {
        const count = servers.filter((s) => s.fields.category === c).length;
        return { label: categoryLabel(c), description: `${count} server${count === 1 ? '' : 's'}`, category: c };
      });
    const cat = await vscode.window.showQuickPick(catItems, {
      title: 'My MCP Shelf — Browse by Category',
      placeHolder: 'Pick a category',
    });
    if (!cat) return;

    const inCat = rankByTrust(servers.filter((s) => s.fields.category === cat.category));
    await showServerPicker(cat.label, inCat);
  });

  context.subscriptions.push(browse, search, byCategory);
}

export function deactivate(): void {
  /* no-op */
}

// ─── Data loading ───────────────────────────────────────────────────────────

async function getServers(): Promise<ShelfServer[]> {
  const live = vscode.workspace.getConfiguration('myMcpShelf').get<boolean>('liveData', false);
  const bundled = loadServers();
  return live ? tryEnrichLive(bundled) : bundled;
}

function notifyEmpty(): void {
  vscode.window.showWarningMessage('My MCP Shelf: no curated servers found in the bundled snapshot.');
}

// ─── Server picker ──────────────────────────────────────────────────────────

async function showServerPicker(title: string, servers: ShelfServer[]): Promise<void> {
  const items: ServerPickItem[] = servers.map((s) => {
    const sc = scoreServer(s);
    return {
      label: securityIcon(sc.security) + ' ' + s.fields.name,
      description: `${categoryLabel(s.fields.category)}  ·  $(star) ${s.fields.stars.toLocaleString()}`,
      detail: `${sc.trustLabel} · trust ${sc.trust}/100 · ${summaryLine(s, sc)}`,
      server: s,
    };
  });

  const picked = await vscode.window.showQuickPick(items, {
    title,
    placeHolder: 'Type to filter — select a server to install',
    matchOnDescription: true,
    matchOnDetail: true,
  });
  if (picked) await installFlow(picked.server);
}

// ─── Install flow ───────────────────────────────────────────────────────────

async function installFlow(server: ShelfServer): Promise<void> {
  const config = generateServerConfig(server);
  const block = generateConfigBlock(server);
  const json = stringifyConfig(block);
  const blockPreview = truncateDesc(json, 280);

  const defaultId = vscode.workspace.getConfiguration('myMcpShelf').get<string>('defaultInstallTarget', 'ask');
  const target =
    defaultId && defaultId !== 'ask'
      ? CONFIG_TARGETS.find((t) => t.id === defaultId) ??
        (await pickTarget())
      : await pickTarget();
  if (!target) return;

  switch (target.id) {
    case 'cursor':
    case 'claude-desktop': {
      const file = target.configPath!;
      try {
        mergeIntoConfigFile(file, server.id, config);
        await postInstall(server, target, file);
      } catch (e) {
        vscode.window.showErrorMessage(`Could not write ${target.label}: ${(e as Error).message}`);
      }
      break;
    }
    case 'vscode': {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) {
        vscode.window.showErrorMessage('Open a workspace folder first to write .vscode/mcp.json.');
        return;
      }
      const file = path.join(folder.uri.fsPath, '.vscode', 'mcp.json');
      try {
        mergeIntoConfigFile(file, server.id, config);
        await postInstall(server, target, file);
      } catch (e) {
        vscode.window.showErrorMessage(`Could not write .vscode/mcp.json: ${(e as Error).message}`);
      }
      break;
    }
    case 'clipboard': {
      await vscode.env.clipboard.writeText(json);
      const envNote = config.env ? `\n\nThen set: ${Object.keys(config.env).join(', ')}` : '';
      vscode.window.showInformationMessage(
        `Copied MCP config for “${server.fields.name}”. Paste into your client's config file.${envNote}`
      );
      break;
    }
    case 'website': {
      await vscode.env.openExternal(vscode.Uri.parse(`${SITE}/server/${server.id}`));
      vscode.window.showInformationMessage(`Opening “${server.fields.name}” on ${SITE}.`);
      break;
    }
  }

  void blockPreview;
}

async function pickTarget(): Promise<ConfigTarget | undefined> {
  const picked = await vscode.window.showQuickPick(
    CONFIG_TARGETS.map((t) => ({ label: t.label, target: t })) as TargetPickItem[],
    { title: 'Install MCP server — choose target', placeHolder: 'Where should the config go?' }
  );
  return picked?.target;
}

async function postInstall(server: ShelfServer, target: ConfigTarget, file: string): Promise<void> {
  const config = generateServerConfig(server);
  const envKeys = config.env ? Object.keys(config.env) : [];
  const restart = target.id === 'cursor' ? ' Restart Cursor.' : target.id === 'claude-desktop' ? ' Restart Claude Desktop.' : ' Reload the VS Code window.';
  const envMsg = envKeys.length ? `\n\n⚠️ Set these env vars in the config: ${envKeys.join(', ')}` : '';

  const action = await vscode.window.showInformationMessage(
    `Installed “${server.fields.name}” into ${target.label}.${restart}${envMsg}`,
    'Open config file',
    'View on site'
  );
  if (action === 'Open config file') {
    await openConfigFile(file);
  } else if (action === 'View on site') {
    await vscode.env.openExternal(vscode.Uri.parse(`${SITE}/server/${server.id}`));
  }
}

// ─── File helpers ───────────────────────────────────────────────────────────

function mergeIntoConfigFile(filePath: string, serverId: string, config: ReturnType<typeof generateServerConfig>): void {
  const abs = resolveHome(filePath);
  let doc: { mcpServers?: Record<string, unknown> } = { mcpServers: {} };
  if (fs.existsSync(abs)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(abs, 'utf8'));
      if (parsed && typeof parsed === 'object') doc = parsed;
    } catch {
      doc = { mcpServers: {} }; // corrupt file — start fresh but don't clobber silently
    }
  }
  doc.mcpServers = doc.mcpServers || {};
  doc.mcpServers[serverId] = config;
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, stringifyConfig(doc) + '\n', 'utf8');
}

async function openConfigFile(file: string): Promise<void> {
  const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(resolveHome(file)));
  await vscode.window.showTextDocument(doc);
}

// ─── Display helpers ────────────────────────────────────────────────────────

function securityIcon(tier: ReturnType<typeof securityTier>): string {
  switch (tier) {
    case 'secure':
      return '$(shield)'; // 🟢 Secure
    case 'moderate':
      return '$(warning)'; // 🟡 Moderate
    case 'at-risk':
      return '$(flame)'; // 🔴 At risk
    default:
      return '$(question)'; // ⚪ Unverified
  }
}

function truncateDesc(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n) + '…';
}

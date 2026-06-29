# My MCP Shelf — VS Code / Cursor Extension

Browse **curated, trust-scored MCP servers** straight from the command palette and install
them with **one click** — without leaving your editor. This is the My MCP Shelf directory
(`mymcpshelf.com`) delivered to the moment of need.

> We compete with browser-based directories by being *in the editor*. Type what you need,
> see vetted servers with security/adoption scores, and drop a ready-made MCP config into
> Cursor / Claude Desktop / VS Code in one step.

## Features

- **Browse Curated Servers** (`My MCP Shelf: Browse Curated Servers`) — ranked by trust,
  each entry shows its security tier, adoption, language, and deployment.
- **Search in Plain English** (`My MCP Shelf: Search in Plain English`) — describe a task
  ("read Postgres safely with row-level limits") and get ranked matches with a *reason* for
  each. Powered by the same search engine as the website.
- **Browse by Category** (`My MCP Shelf: Browse by Category`) — pick a category, then a server.
- **One-click install** — selecting any server writes a config block **identical to the
  website's Config Generator** (`{ "mcpServers": { "<id>": { "command": "npx …", "args": [],
  "env": … } } }`) into your client's config, with env-var guidance.

Scores shown: **security** (🛡 Secure / ⚠ Moderate / 🔥 At risk / ? Unverified from the manual
audit), **trust** (adoption + security + official signal), and **adoption** (GitHub stars).

## Install

### From a packaged .vsix

```bash
code --install-extension my-mcp-shelf-0.1.0.vsix      # VS Code
cursor --install-extension my-mcp-shelf-0.1.0.vsix    # Cursor
```

### From source (dev)

```bash
cd vscode-extension
npm install
npm run snapshot   # regenerate data/servers.json from the directory
npm run build      # bundle → dist/extension.js
```

Then press **F5** in VS Code to launch an Extension Development Host, or package with
`npx vsce package`.

## Usage

1. Open the Command Palette (`Cmd/Ctrl+Shift+P`).
2. Run **My MCP Shelf: Browse Curated Servers** (or Search / by Category).
3. Pick a server → choose an install target (Cursor, Claude Desktop, VS Code workspace,
   copy to clipboard, or open on the site).
4. Set any env vars the prompt names, then restart your client.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `myMcpShelf.liveData` | `false` | Fetch fresh staleness / green / security scores from mymcpshelf.com (falls back to the bundled snapshot when offline). |
| `myMcpShelf.defaultInstallTarget` | `"ask"` | Default install target (`cursor`, `claude-desktop`, `vscode`, `clipboard`, or `ask`). |

## How it stays in sync

The extension bundles a **snapshot** of the curated directory (`data/servers.json`) and reuses
the website's **shared search engine** (`src/lib/search-engine.js`, bundled via esbuild alias)
— so natural-language search here returns the same results as on the site. Regenerate the
snapshot with `npm run snapshot` whenever the directory is refreshed.

## License

MIT.

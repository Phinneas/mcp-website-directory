"""
Prefect flow: refresh MCP server data
======================================
Fetches all servers from PulseMCP, enriches them with logo URLs, and writes
the result to src/data/servers.json so the Astro build never has to call the
API directly.

Usage
-----
One-off run:
    python scripts/prefect_refresh.py

Scheduled via Prefect Cloud / self-hosted server:
    prefect deployment build scripts/prefect_refresh.py:refresh_server_data \\
        --name "nightly" --cron "0 3 * * *"
    prefect deployment apply refresh_server_data-deployment.yaml

Triggering a Cloudflare Pages rebuild after the data is written:
    Set the CLOUDFLARE_DEPLOY_HOOK env var to your Pages deploy-hook URL and
    the flow will POST to it automatically after writing the file.

Environment variables (all optional)
-------------------------------------
PULSEMCP_MAX_SERVERS  - how many servers to fetch (default 5000)
CLOUDFLARE_DEPLOY_HOOK - Pages deploy-hook URL to trigger a rebuild
"""

import json
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx
from prefect import flow, task, get_run_logger

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
PULSEMCP_BASE = "https://api.pulsemcp.com/v0beta"
COUNT_PER_PAGE = 250          # API max
MAX_SERVERS = int(os.getenv("PULSEMCP_MAX_SERVERS", "5000"))
MAX_RETRIES = 4
OUTPUT_PATH = Path(__file__).parent.parent / "src" / "data" / "servers.json"


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

@task(name="fetch-pulsemcp-page", retries=MAX_RETRIES, retry_delay_seconds=5)
def fetch_page(offset: int) -> list[dict] | None:
    """Fetch one page of servers from PulseMCP with automatic Prefect retries."""
    logger = get_run_logger()
    url = f"{PULSEMCP_BASE}/servers?count_per_page={COUNT_PER_PAGE}&offset={offset}"

    with httpx.Client(timeout=30) as client:
        resp = client.get(url)

    if not resp.is_success:
        logger.warning(f"HTTP {resp.status_code} at offset {offset} — will retry")
        raise RuntimeError(f"PulseMCP returned {resp.status_code}")

    data = resp.json()

    # API sunset sentinel
    if isinstance(data, dict) and data.get("error", {}).get("code") == "API_SUNSET":
        logger.warning("API_SUNSET response — will retry")
        raise RuntimeError("API_SUNSET")

    servers = data.get("servers", data) if isinstance(data, dict) else data
    if not isinstance(servers, list):
        raise RuntimeError(f"Unexpected response shape at offset {offset}")

    has_next = bool(isinstance(data, dict) and data.get("next"))
    logger.info(f"offset={offset}: got {len(servers)} servers (has_next={has_next})")
    return servers, has_next


@task(name="fetch-all-servers")
def fetch_all_servers() -> list[dict]:
    """Paginate through PulseMCP until MAX_SERVERS or no more pages."""
    logger = get_run_logger()
    all_servers: list[dict] = []
    offset = 0

    while len(all_servers) < MAX_SERVERS:
        result = fetch_page(offset)
        if result is None:
            logger.error("fetch_page returned None — stopping pagination")
            break

        page, has_next = result
        if not page:
            break

        all_servers.extend(page)
        offset += len(page)

        if not has_next or len(all_servers) >= MAX_SERVERS:
            break

        time.sleep(0.2)   # be polite

    logger.info(f"Total fetched: {len(all_servers)} servers")
    return all_servers


@task(name="transform-servers")
def transform_servers(raw: list[dict]) -> list[dict]:
    """Convert raw PulseMCP records to the internal MCPServer shape."""
    logger = get_run_logger()

    category_patterns = [
        ("databases",         ["database", "sql", "postgres", "mysql", "mongodb", "sqlite", "redis", "supabase"]),
        ("cloud",             ["aws", "azure", "gcp", "cloudflare", "vercel", "netlify", "kubernetes", "docker", "terraform"]),
        ("development",       ["github", "gitlab", "git", "code", "development", "build", "test", "debug", "typescript"]),
        ("communication",     ["slack", "discord", "telegram", "email", "twilio", "sendgrid", "messaging"]),
        ("productivity",      ["notion", "jira", "linear", "trello", "asana", "calendar", "task", "todo"]),
        ("ai-ml",             ["ai", "ml", "llm", "gpt", "claude", "openai", "anthropic", "huggingface", "embedding", "rag"]),
        ("search",            ["search", "web", "scrape", "crawl", "browser", "puppeteer", "playwright", "selenium"]),
        ("file-systems",      ["file", "filesystem", "drive", "storage", "dropbox", "s3", "blob"]),
        ("finance",           ["finance", "stock", "trading", "crypto", "bitcoin", "payment", "stripe"]),
        ("security",          ["security", "auth", "oauth", "jwt", "password", "encryption", "vulnerability"]),
        ("media",             ["image", "video", "audio", "media", "youtube", "spotify", "ffmpeg"]),
        ("data-analytics",    ["analytics", "metrics", "dashboard", "chart", "grafana", "prometheus"]),
        ("browser-automation",["browser", "puppeteer", "playwright", "automation", "scraping"]),
    ]

    def infer_category(name: str, short: str, ai: str) -> str:
        text = f"{name} {short or ''} {ai or ''}".lower()
        for cat, kws in category_patterns:
            if any(kw in text for kw in kws):
                return cat
        return "development"

    def slugify_id(name: str) -> str:
        if not name:
            return ""
        return re.sub(r"-+", "-", re.sub(r"[^a-z0-9-]", "-", name.lower())).strip("-")

    def github_avatar(github_url: str) -> str | None:
        m = re.search(r"github\.com/([^/]+)/", github_url or "")
        return f"https://github.com/{m.group(1)}.png?size=128" if m else None

    servers = []
    for i, s in enumerate(raw):
        source_url = s.get("source_code_url", "")
        gh_match = re.search(r"github\.com/([^/]+)", source_url)
        author = f"@{gh_match.group(1)}" if gh_match else "@unknown"

        name = s.get("name", "")
        server_id = s.get("id") or slugify_id(name) or f"pulsemcp-{i}"
        github_url = source_url or s.get("external_url") or s.get("url") or "#"
        logo_url = github_avatar(github_url)

        servers.append({
            "id": server_id,
            "fields": {
                "name": name or "Unknown Server",
                "description": (
                    s.get("EXPERIMENTAL_ai_generated_description")
                    or s.get("short_description")
                    or "No description available"
                ),
                "author": author,
                "category": infer_category(
                    name,
                    s.get("short_description", ""),
                    s.get("EXPERIMENTAL_ai_generated_description", ""),
                ),
                "language": "Unknown",
                "stars": s.get("github_stars") or 0,
                "github_url": github_url,
                "npm_package": s.get("package_name") or None,
                "downloads": s.get("package_download_count") or 0,
                "updated": datetime.now(timezone.utc).isoformat(),
                "logoUrl": logo_url,
                "logoSource": "github" if logo_url else None,
                "logoCachedAt": datetime.now(timezone.utc).isoformat() if logo_url else None,
            },
        })

    logger.info(f"Transformed {len(servers)} servers")
    return servers


@task(name="write-servers-json")
def write_servers_json(servers: list[dict]) -> Path:
    """Write servers to src/data/servers.json."""
    logger = get_run_logger()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "count": len(servers),
        "servers": servers,
    }

    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    logger.info(f"Wrote {len(servers)} servers → {OUTPUT_PATH}")
    return OUTPUT_PATH


@task(name="trigger-cloudflare-rebuild")
def trigger_rebuild() -> None:
    """POST to a Cloudflare Pages deploy hook to kick off a new build."""
    logger = get_run_logger()
    hook = os.getenv("CLOUDFLARE_DEPLOY_HOOK")
    if not hook:
        logger.info("CLOUDFLARE_DEPLOY_HOOK not set — skipping rebuild trigger")
        return

    with httpx.Client(timeout=15) as client:
        resp = client.post(hook)

    if resp.is_success:
        logger.info(f"Cloudflare Pages rebuild triggered (status {resp.status_code})")
    else:
        logger.warning(f"Deploy hook returned {resp.status_code}: {resp.text}")


# ---------------------------------------------------------------------------
# Flow
# ---------------------------------------------------------------------------

@flow(name="refresh-mcp-server-data", log_prints=True)
def refresh_server_data() -> dict:
    """
    Main flow:
      1. Fetch all servers from PulseMCP (with retries handled per-task)
      2. Transform to internal MCPServer shape + resolve logo URLs
      3. Write src/data/servers.json
      4. Optionally trigger a Cloudflare Pages rebuild
    """
    raw = fetch_all_servers()
    servers = transform_servers(raw)
    path = write_servers_json(servers)
    trigger_rebuild()

    return {"servers_written": len(servers), "path": str(path)}


if __name__ == "__main__":
    result = refresh_server_data()
    print(result)

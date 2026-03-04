"""
Prefect flow: refresh-mcp-server-data  (v2)
============================================
Nightly pipeline that keeps the MCP directory's server catalogue fresh:

  1. Fetch every server from PulseMCP  (paginated, per-task retries)
  2. Transform records to the site's internal MCPServer shape
  3. Publish Prefect Artifacts — markdown run summary + category/stars tables
  4. Write  src/data/servers.json
  5. Commit & push servers.json to GitHub via the REST API
     (no git binary required; authenticates with GITHUB_TOKEN)
  6. Trigger a Cloudflare Pages rebuild via deploy hook
  7. Post a Slack notification with the run summary

Quick start
-----------
  # one-off local run
  python scripts/prefect_refresh.py

  # dry run — writes locally, skips GitHub push + Cloudflare trigger
  python scripts/prefect_refresh.py --dry-run

  # deploy to Prefect Cloud (nightly 03:00 UTC)
  prefect cloud login
  prefect work-pool create mcp-work-pool --type process
  prefect deploy --all                       # reads prefect.yaml
  prefect worker start --pool mcp-work-pool  # on the worker machine

Environment variables
---------------------
Required for GitHub push:
  GITHUB_TOKEN          Personal-access token (or fine-grained token)
                        with  Contents: Read & Write  on the target repo.
  GITHUB_REPO           "owner/repo"  e.g. "chesterbeard/mcp-directory"

Optional:
  GITHUB_BRANCH         branch to commit to              (default: "main")
  PULSEMCP_MAX_SERVERS  how many servers to fetch        (default: 5000)
  CLOUDFLARE_DEPLOY_HOOK  Cloudflare Pages deploy-hook URL
  SLACK_WEBHOOK_URL     Slack incoming-webhook URL for notifications
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from prefect import flow, task, get_run_logger
from prefect.artifacts import create_markdown_artifact, create_table_artifact

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

PULSEMCP_BASE    = "https://api.pulsemcp.com/v0beta"
COUNT_PER_PAGE   = 250           # API maximum per page
MAX_RETRIES      = 4
RETRY_DELAY_SECS = 5

OUTPUT_PATH      = Path(__file__).parent.parent / "src" / "data" / "servers.json"
GITHUB_FILE_PATH = "src/data/servers.json"   # path inside the repo

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slugify(name: str) -> str:
    if not name:
        return ""
    slug = re.sub(r"[^a-z0-9-]", "-", name.lower())
    return re.sub(r"-+", "-", slug).strip("-")


CATEGORY_PATTERNS: list[tuple[str, list[str]]] = [
    ("databases",          ["database", "sql", "postgres", "mysql", "mongodb", "sqlite",
                            "redis", "supabase", "neon", "planetscale", "turso"]),
    ("cloud",              ["aws", "azure", "gcp", "cloudflare", "vercel", "netlify",
                            "kubernetes", "docker", "terraform", "pulumi"]),
    ("development",        ["github", "gitlab", "git", "code", "development", "build",
                            "test", "debug", "typescript", "eslint", "linting"]),
    ("communication",      ["slack", "discord", "telegram", "email", "twilio", "sendgrid",
                            "messaging", "whatsapp", "sms", "chat"]),
    ("productivity",       ["notion", "jira", "linear", "trello", "asana", "calendar",
                            "task", "todo", "project", "clickup"]),
    ("ai-ml",              ["ai", "ml", "llm", "gpt", "claude", "openai", "anthropic",
                            "huggingface", "embedding", "rag", "vector", "langchain"]),
    ("search",             ["search", "web", "scrape", "crawl", "puppeteer", "playwright",
                            "selenium", "exa", "tavily", "perplexity"]),
    ("file-systems",       ["file", "filesystem", "drive", "storage", "dropbox", "s3",
                            "blob", "onedrive", "box"]),
    ("finance",            ["finance", "stock", "trading", "crypto", "bitcoin", "payment",
                            "stripe", "bank", "accounting", "invoice"]),
    ("security",           ["security", "auth", "oauth", "jwt", "password", "encryption",
                            "vulnerability", "sast", "secret", "vault"]),
    ("media",              ["image", "video", "audio", "media", "youtube", "spotify",
                            "ffmpeg", "photo", "dalle", "stable diffusion"]),
    ("data-analytics",     ["analytics", "metrics", "dashboard", "chart", "grafana",
                            "prometheus", "bigquery", "snowflake", "dbt"]),
    ("aggregators",        ["aggregator", "platform", "gateway", "registry", "hub", "unified"]),
    ("browser-automation", ["browser", "puppeteer", "playwright", "automation", "scraping",
                            "headless", "screenshot"]),
    ("maps-location",      ["map", "location", "geo", "gps", "address", "geocod", "places"]),
    ("iot-hardware",       ["iot", "hardware", "sensor", "arduino", "raspberry", "mqtt"]),
]


def _infer_category(name: str, short: str, ai_desc: str) -> str:
    text = f"{name} {short or ''} {ai_desc or ''}".lower()
    for cat, keywords in CATEGORY_PATTERNS:
        if any(kw in text for kw in keywords):
            return cat
    return "development"


def _github_avatar(github_url: str) -> str | None:
    m = re.search(r"github\.com/([^/]+)/", github_url or "")
    return f"https://github.com/{m.group(1)}.png?size=128" if m else None


# ---------------------------------------------------------------------------
# Tasks — data pipeline
# ---------------------------------------------------------------------------

@task(
    name="fetch-pulsemcp-page",
    retries=MAX_RETRIES,
    retry_delay_seconds=RETRY_DELAY_SECS,
    retry_jitter_factor=0.5,
    tags=["pulsemcp", "fetch"],
)
def fetch_page(offset: int) -> tuple[list[dict], bool]:
    """Fetch a single page of servers from PulseMCP.

    Returns (servers, has_next).  Raises on any error so Prefect retries.
    """
    logger = get_run_logger()
    url = f"{PULSEMCP_BASE}/servers?count_per_page={COUNT_PER_PAGE}&offset={offset}"

    with httpx.Client(timeout=30) as client:
        resp = client.get(url)

    if not resp.is_success:
        logger.warning(f"HTTP {resp.status_code} at offset={offset} — will retry")
        raise RuntimeError(f"PulseMCP returned {resp.status_code}")

    data = resp.json()

    # Detect API sunset sentinel and retry
    if isinstance(data, dict) and data.get("error", {}).get("code") == "API_SUNSET":
        logger.warning("API_SUNSET response received — will retry")
        raise RuntimeError("API_SUNSET")

    servers = data.get("servers", data) if isinstance(data, dict) else data
    if not isinstance(servers, list):
        raise RuntimeError(f"Unexpected response shape at offset={offset}: {type(servers)}")

    has_next = bool(isinstance(data, dict) and data.get("next"))
    logger.info(f"offset={offset:>5} → {len(servers):>3} servers  has_next={has_next}")
    return servers, has_next


@task(name="fetch-all-servers", tags=["pulsemcp", "fetch"])
def fetch_all_servers(max_servers: int) -> list[dict]:
    """Paginate through PulseMCP until we reach max_servers or exhaust all pages."""
    logger = get_run_logger()
    all_servers: list[dict] = []
    offset = 0

    while len(all_servers) < max_servers:
        page, has_next = fetch_page(offset)

        if not page:
            logger.info("Empty page — end of results")
            break

        all_servers.extend(page)
        offset += len(page)
        logger.info(f"Running total: {len(all_servers):,} servers")

        if not has_next or len(all_servers) >= max_servers:
            break

        time.sleep(0.25)   # polite rate-limiting

    logger.info(f"Fetch complete: {len(all_servers):,} servers")
    return all_servers


@task(name="transform-servers", tags=["transform"])
def transform_servers(raw: list[dict]) -> list[dict]:
    """Normalise raw PulseMCP records into the site's internal MCPServer shape."""
    logger = get_run_logger()
    servers: list[dict] = []

    for i, s in enumerate(raw):
        source_url = s.get("source_code_url") or ""
        gh_match   = re.search(r"github\.com/([^/]+)", source_url)
        author     = f"@{gh_match.group(1)}" if gh_match else "@unknown"

        name       = s.get("name", "")
        server_id  = s.get("id") or _slugify(name) or f"pulsemcp-{i}"
        github_url = source_url or s.get("external_url") or s.get("url") or "#"
        logo_url   = _github_avatar(github_url)

        servers.append({
            "id": server_id,
            "fields": {
                "name": name or "Unknown Server",
                "description": (
                    s.get("EXPERIMENTAL_ai_generated_description")
                    or s.get("short_description")
                    or "No description available"
                ),
                "author":       author,
                "category":     _infer_category(
                                    name,
                                    s.get("short_description", ""),
                                    s.get("EXPERIMENTAL_ai_generated_description", ""),
                                ),
                "language":     "Unknown",
                "stars":        s.get("github_stars") or 0,
                "github_url":   github_url,
                "npm_package":  s.get("package_name") or None,
                "downloads":    s.get("package_download_count") or 0,
                "updated":      _now(),
                "logoUrl":      logo_url,
                "logoSource":   "github" if logo_url else None,
                "logoCachedAt": _now() if logo_url else None,
            },
        })

    logger.info(f"Transformed {len(servers):,} servers")
    return servers


# ---------------------------------------------------------------------------
# Tasks — Prefect Artifacts (dashboard visibility)
# ---------------------------------------------------------------------------

@task(name="publish-artifacts", tags=["observability"])
def publish_artifacts(servers: list[dict], elapsed_seconds: float) -> None:
    """Publish three artifacts visible in the Prefect UI:
      1. category-breakdown  — table of server counts by category
      2. top-10-by-stars     — table of the most-starred servers
      3. run-summary         — markdown overview of the entire run
    """
    logger = get_run_logger()
    total  = len(servers)
    counts: Counter = Counter(s["fields"]["category"] for s in servers)

    # ── 1. Category breakdown table ─────────────────────────────────────────
    create_table_artifact(
        key="category-breakdown",
        table=[
            {
                "Category":  cat,
                "Servers":   str(cnt),
                "Share (%)": f"{cnt / total * 100:.1f}",
            }
            for cat, cnt in counts.most_common()
        ],
        description=f"Server count by inferred category  ({total:,} total)",
    )
    logger.info("Published artifact: category-breakdown")

    # ── 2. Top-10 by GitHub stars ────────────────────────────────────────────
    top10 = sorted(
        servers,
        key=lambda s: s["fields"].get("stars") or 0,
        reverse=True,
    )[:10]

    create_table_artifact(
        key="top-10-by-stars",
        table=[
            {
                "Server":   s["fields"]["name"],
                "Author":   s["fields"]["author"],
                "Stars":    str(s["fields"].get("stars") or 0),
                "Category": s["fields"]["category"],
            }
            for s in top10
        ],
        description="Top 10 servers by GitHub stars",
    )
    logger.info("Published artifact: top-10-by-stars")

    # ── 3. Markdown run summary ──────────────────────────────────────────────
    category_rows = "\n".join(
        f"| {cat:<28} | {cnt:>7,} | {cnt / total * 100:>6.1f}% |"
        for cat, cnt in counts.most_common()
    )
    stars_rows = "\n".join(
        f"| {s['fields']['name']:<42} | {s['fields'].get('stars') or 0:>7,} |"
        for s in top10
    )

    markdown = f"""\
# MCP Server Data Refresh — Run Summary

| Field            | Value                        |
|------------------|------------------------------|
| Completed        | {_now()}       |
| Servers fetched  | {total:,}                    |
| Categories found | {len(counts)}                |
| Elapsed          | {elapsed_seconds:.1f} s      |

---

## Category Breakdown

| Category                     | Servers |  Share  |
|------------------------------|--------:|--------:|
{category_rows}

---

## Top 10 by GitHub Stars

| Server                                     |   Stars |
|--------------------------------------------|--------:|
{stars_rows}
"""

    create_markdown_artifact(
        key="run-summary",
        markdown=markdown,
        description=f"Refresh complete — {total:,} servers written in {elapsed_seconds:.1f}s",
    )
    logger.info("Published artifact: run-summary")


# ---------------------------------------------------------------------------
# Tasks — persistence & delivery
# ---------------------------------------------------------------------------

@task(name="write-servers-json", tags=["io"])
def write_servers_json(servers: list[dict]) -> Path:
    """Write the transformed server list to src/data/servers.json."""
    logger = get_run_logger()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "generated_at": _now(),
        "count":        len(servers),
        "servers":      servers,
    }

    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    size_kb = OUTPUT_PATH.stat().st_size / 1024
    logger.info(f"Wrote {len(servers):,} servers → {OUTPUT_PATH}  ({size_kb:.1f} KB)")
    return OUTPUT_PATH


@task(
    name="commit-and-push-to-github",
    retries=2,
    retry_delay_seconds=10,
    tags=["github", "io"],
)
def commit_and_push_to_github(path: Path, server_count: int) -> str:
    """Commit servers.json to GitHub via the Contents REST API.

    No git binary required — authenticates with GITHUB_TOKEN.
    Returns the new commit SHA, or an empty string if credentials are missing.
    """
    logger = get_run_logger()
    token  = os.environ.get("GITHUB_TOKEN")
    repo   = os.environ.get("GITHUB_REPO")
    branch = os.environ.get("GITHUB_BRANCH", "main")

    if not token or not repo:
        logger.warning(
            "GITHUB_TOKEN or GITHUB_REPO not set — skipping GitHub commit.\n"
            "Export both env vars to enable automatic data commits."
        )
        return ""

    api_url = f"https://api.github.com/repos/{repo}/contents/{GITHUB_FILE_PATH}"
    headers = {
        "Authorization":        f"Bearer {token}",
        "Accept":               "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    with httpx.Client(timeout=30, headers=headers) as client:
        # 1. Retrieve the current file SHA (required by the API to update a file)
        sha: str | None = None
        get_resp = client.get(api_url, params={"ref": branch})

        if get_resp.status_code == 200:
            sha = get_resp.json().get("sha")
            logger.info(f"Existing file SHA: {sha[:12]}…")
        elif get_resp.status_code == 404:
            logger.info("servers.json not yet in repo — will create it")
        else:
            raise RuntimeError(
                f"Unexpected status fetching file SHA: {get_resp.status_code} {get_resp.text[:200]}"
            )

        # 2. Build the commit payload
        content_b64 = base64.b64encode(path.read_bytes()).decode("utf-8")
        commit_msg  = (
            f"chore(data): refresh MCP server catalogue — {server_count:,} servers "
            f"[{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}]"
        )
        body: dict[str, Any] = {
            "message": commit_msg,
            "content": content_b64,
            "branch":  branch,
        }
        if sha:
            body["sha"] = sha   # required for updates; omit for new files

        # 3. Commit
        put_resp = client.put(api_url, json=body)

        if put_resp.status_code in (200, 201):
            commit_sha = put_resp.json()["commit"]["sha"]
            action     = "Updated" if sha else "Created"
            logger.info(f"{action} servers.json on {branch} → commit {commit_sha[:12]}…")
            return commit_sha
        else:
            raise RuntimeError(
                f"GitHub API error {put_resp.status_code}: {put_resp.text[:400]}"
            )


@task(
    name="trigger-cloudflare-rebuild",
    retries=2,
    retry_delay_seconds=10,
    tags=["cloudflare"],
)
def trigger_cloudflare_rebuild() -> bool:
    """POST to a Cloudflare Pages deploy hook to trigger a fresh build."""
    logger = get_run_logger()
    hook   = os.environ.get("CLOUDFLARE_DEPLOY_HOOK")

    if not hook:
        logger.info("CLOUDFLARE_DEPLOY_HOOK not set — skipping rebuild trigger")
        return False

    with httpx.Client(timeout=15) as client:
        resp = client.post(hook)

    if resp.is_success:
        logger.info(f"Cloudflare Pages rebuild triggered (HTTP {resp.status_code})")
        return True

    raise RuntimeError(f"Deploy hook returned {resp.status_code}: {resp.text[:200]}")


@task(name="notify-slack", tags=["notifications"])
def notify_slack(
    server_count: int,
    commit_sha:   str,
    elapsed:      float,
    success:      bool,
    error_msg:    str = "",
) -> None:
    """Post a concise run summary to a Slack incoming webhook."""
    logger  = get_run_logger()
    webhook = os.environ.get("SLACK_WEBHOOK_URL")

    if not webhook:
        logger.info("SLACK_WEBHOOK_URL not set — skipping Slack notification")
        return

    repo   = os.environ.get("GITHUB_REPO", "")
    branch = os.environ.get("GITHUB_BRANCH", "main")
    gh_url = (
        f"https://github.com/{repo}/blob/{branch}/src/data/servers.json"
        if commit_sha and repo else ""
    )

    if success:
        commit_line = f"\n> Commit: <{gh_url}|`{commit_sha[:12]}`>" if commit_sha else ""
        text = (
            f":white_check_mark: *MCP data refresh complete*\n"
            f"> Servers written: *{server_count:,}*\n"
            f"> Elapsed: {elapsed:.1f}s"
            f"{commit_line}"
        )
    else:
        text = (
            f":x: *MCP data refresh FAILED*\n"
            f"> {error_msg or 'Unknown error'}"
        )

    with httpx.Client(timeout=15) as client:
        resp = client.post(webhook, json={"text": text})

    if resp.is_success:
        logger.info("Slack notification sent")
    else:
        logger.warning(f"Slack webhook returned {resp.status_code}: {resp.text[:100]}")


# ---------------------------------------------------------------------------
# Flow
# ---------------------------------------------------------------------------

@flow(
    name="refresh-mcp-server-data",
    description=(
        "Nightly pipeline: fetch all MCP servers from PulseMCP, "
        "publish Prefect Artifacts, write servers.json, commit to GitHub, "
        "trigger Cloudflare Pages rebuild, and notify Slack."
    ),
    log_prints=True,
    timeout_seconds=3_600,   # hard ceiling: 1 hour
)
def refresh_server_data(
    max_servers: int  = int(os.getenv("PULSEMCP_MAX_SERVERS", "5000")),
    dry_run:     bool = False,
    notify:      bool = True,
) -> dict:
    """
    Parameters
    ----------
    max_servers : int
        Maximum servers to fetch from PulseMCP.  Default 5 000.
    dry_run : bool
        Write servers.json locally but skip the GitHub commit and Cloudflare
        rebuild trigger.  Use this when testing the pipeline.
    notify : bool
        Post a Slack summary on completion (success or failure).
    """
    logger    = get_run_logger()
    started   = datetime.now(timezone.utc)
    commit_sha = ""
    error_msg  = ""

    try:
        logger.info(
            f"=== refresh-mcp-server-data  max_servers={max_servers}  "
            f"dry_run={dry_run}  notify={notify} ==="
        )

        # 1 ── Fetch ────────────────────────────────────────────────────────
        raw_servers = fetch_all_servers(max_servers)
        if not raw_servers:
            raise ValueError("PulseMCP returned 0 servers — aborting")

        # 2 ── Transform ────────────────────────────────────────────────────
        servers = transform_servers(raw_servers)

        # 3 ── Artifacts (non-fatal: failure doesn't abort the flow) ────────
        try:
            elapsed_so_far = (datetime.now(timezone.utc) - started).total_seconds()
            publish_artifacts(servers, elapsed_so_far)
        except Exception as exc:
            logger.warning(f"Artifact publishing failed (non-fatal): {exc}")

        # 4 ── Write ────────────────────────────────────────────────────────
        path = write_servers_json(servers)

        # 5 ── GitHub commit ─────────────────────────────────────────────────
        if not dry_run:
            commit_sha = commit_and_push_to_github(path, len(servers))
        else:
            logger.info("dry_run=True — skipping GitHub commit")

        # 6 ── Cloudflare rebuild ────────────────────────────────────────────
        if not dry_run:
            trigger_cloudflare_rebuild()
        else:
            logger.info("dry_run=True — skipping Cloudflare rebuild trigger")

        # ── Wrap up ─────────────────────────────────────────────────────────
        elapsed = (datetime.now(timezone.utc) - started).total_seconds()
        result  = {
            "success":         True,
            "servers_written": len(servers),
            "commit_sha":      commit_sha,
            "elapsed_seconds": round(elapsed, 1),
            "generated_at":    _now(),
        }
        logger.info(f"Flow complete: {result}")

        # 7 ── Notify ────────────────────────────────────────────────────────
        if notify:
            notify_slack(len(servers), commit_sha, elapsed, success=True)

        return result

    except Exception as exc:
        error_msg = str(exc)
        elapsed   = (datetime.now(timezone.utc) - started).total_seconds()
        logger.error(f"Flow failed after {elapsed:.1f}s: {error_msg}")

        if notify:
            notify_slack(0, "", elapsed, success=False, error_msg=error_msg)

        raise   # re-raise so Prefect marks the run as FAILED


# ---------------------------------------------------------------------------
# Local entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Refresh MCP server data (runs the Prefect flow locally)"
    )
    parser.add_argument(
        "--max-servers", type=int, default=5_000,
        help="Maximum servers to fetch from PulseMCP (default: 5000)",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Write servers.json locally but skip GitHub push + Cloudflare trigger",
    )
    parser.add_argument(
        "--no-notify", action="store_true",
        help="Suppress the Slack notification",
    )
    args = parser.parse_args()

    result = refresh_server_data(
        max_servers=args.max_servers,
        dry_run=args.dry_run,
        notify=not args.no_notify,
    )
    print(json.dumps(result, indent=2))

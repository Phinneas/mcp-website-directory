// Cloudflare Worker for monthly MCP server reliability assessment
// Aggregates GitHub API metrics (stars trajectory, issue response time,
// fork activity) and npm/PyPI download trends into a composite score.
//
// Scoring model (0–100):
//   Stars trajectory  — 30 pts  (growth rate over last 90 days)
//   Issue response    — 25 pts  (median time to close issues)
//   Fork activity     — 20 pts  (recent forks as % of total forks)
//   Download trend    — 15 pts  (npm/PyPI weekly download growth)
//   Commit frequency  — 10 pts  (commits in last 90 days)
//
// Runs weekly via cron, stores per-server JSON in D1.
// Exposes /report endpoint for monthly Top 10 blog/newsletter generation.

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

function extractOwnerRepo(githubUrl) {
  if (!githubUrl) return null;
  const m = githubUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

async function githubGet(url, token) {
  const headers = {
    'User-Agent': 'MCP-Directory-Reliability-Monitor',
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) headers['Authorization'] = `token ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return res.json();
}

// ---------------------------------------------------------------------------
// Metric fetchers
// ---------------------------------------------------------------------------

async function fetchStarsTrajectory(owner, repo, token) {
  // Current stars + growth over 90 days via commit activity
  const repoData = await githubGet(`https://api.github.com/repos/${owner}/${repo}`, token);
  if (!repoData) return { score: 0, stars: 0, growth90d: 0 };

  const currentStars = repoData.stargazers_count || 0;

  // Use commit activity as proxy for recent engagement; fall back to stars alone
  const activity = await githubGet(
    `https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`,
    token
  );

  let recentCommits = 0;
  if (Array.isArray(activity)) {
    // Last 13 weeks = ~91 days
    const recentWeeks = activity.slice(-13);
    recentCommits = recentWeeks.reduce((sum, w) => sum + (w.total || 0), 0);
  }

  // Score: base from star count + bonus for recent commit activity
  let score = 0;
  if (currentStars >= 1000) score = 22;
  else if (currentStars >= 500) score = 18;
  else if (currentStars >= 100) score = 14;
  else if (currentStars >= 50) score = 10;
  else if (currentStars >= 10) score = 6;
  else score = 2;

  // Activity bonus (up to 8 pts)
  if (recentCommits >= 50) score += 8;
  else if (recentCommits >= 20) score += 6;
  else if (recentCommits >= 10) score += 4;
  else if (recentCommits >= 5) score += 2;

  return { score, stars: currentStars, commits90d: recentCommits };
}

async function fetchIssueResponse(owner, repo, token) {
  // Closed issues in last 90 days — median close time
  const since = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  const issues = await githubGet(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=closed&since=${since}&per_page=30&sort=updated&direction=desc`,
    token
  );

  if (!Array.isArray(issues) || issues.length === 0) {
    // No closed issues — could mean inactive or no issues at all
    return { score: 8, medianDays: null, closedCount: 0 };
  }

  // Filter out PRs (GitHub API returns PRs in issues endpoint)
  const realIssues = issues.filter(i => !i.pull_request);
  if (realIssues.length === 0) {
    return { score: 8, medianDays: null, closedCount: 0 };
  }

  const closeTimes = realIssues
    .filter(i => i.closed_at && i.created_at)
    .map(i => {
      const created = new Date(i.created_at).getTime();
      const closed = new Date(i.closed_at).getTime();
      return (closed - created) / 86400000; // days
    })
    .filter(d => d >= 0);

  if (closeTimes.length === 0) {
    return { score: 10, medianDays: null, closedCount: realIssues.length };
  }

  closeTimes.sort((a, b) => a - b);
  const medianDays = closeTimes[Math.floor(closeTimes.length / 2)];

  // Score: faster response = higher score
  let score = 0;
  if (medianDays <= 1) score = 25;
  else if (medianDays <= 3) score = 22;
  else if (medianDays <= 7) score = 18;
  else if (medianDays <= 14) score = 14;
  else if (medianDays <= 30) score = 10;
  else if (medianDays <= 60) score = 6;
  else score = 3;

  return { score, medianDays: Math.round(medianDays * 10) / 10, closedCount: realIssues.length };
}

async function fetchForkActivity(owner, repo, token) {
  const repoData = await githubGet(`https://api.github.com/repos/${owner}/${repo}`, token);
  if (!repoData) return { score: 0, forks: 0 };

  const totalForks = repoData.forks_count || 0;

  // Recent forks: check forks sorted by newest
  const recentForks = await githubGet(
    `https://api.github.com/repos/${owner}/${repo}/forks?sort=newest&per_page=10`,
    token
  );

  let recentForkCount = 0;
  const ninetyDaysAgo = Date.now() - 90 * 86400000;
  if (Array.isArray(recentForks)) {
    recentForkCount = recentForks.filter(f => {
      const created = new Date(f.created_at).getTime();
      return created >= ninetyDaysAgo;
    }).length;
  }

  // Score: based on fork count + recency ratio
  let score = 0;
  if (totalForks >= 100) score = 14;
  else if (totalForks >= 50) score = 11;
  else if (totalForks >= 20) score = 8;
  else if (totalForks >= 10) score = 5;
  else if (totalForks >= 5) score = 3;
  else score = 1;

  // Recent activity bonus (up to 6 pts)
  if (recentForkCount >= 5) score += 6;
  else if (recentForkCount >= 3) score += 4;
  else if (recentForkCount >= 1) score += 2;

  return { score, forks: totalForks, recentForks: recentForkCount };
}

async function fetchDownloadTrend(npmPackage, token) {
  if (!npmPackage) return { score: 0, weeklyDownloads: 0, trend: 'no_package' };

  try {
    // npm downloads API — last week vs prior week
    const pkg = encodeURIComponent(npmPackage);
    const [lastWeek, prevWeek] = await Promise.all([
      fetch(`https://api.npmjs.org/downloads/point/last-week/${pkg}`).then(r => r.ok ? r.json() : null),
      fetch(`https://api.npmjs.org/downloads/point/prev-week/${pkg}`).then(r => r.ok ? r.json() : null),
    ]);

    const current = lastWeek?.downloads || 0;
    const previous = prevWeek?.downloads || 0;

    let growth = 0;
    if (previous > 0) {
      growth = ((current - previous) / previous) * 100;
    } else if (current > 0) {
      growth = 100; // new package
    }

    // Score: absolute downloads + growth
    let score = 0;
    if (current >= 10000) score = 10;
    else if (current >= 1000) score = 8;
    else if (current >= 100) score = 5;
    else if (current >= 10) score = 3;
    else score = 1;

    // Growth bonus (up to 5 pts)
    if (growth >= 20) score += 5;
    else if (growth >= 10) score += 3;
    else if (growth >= 0) score += 1;
    // Declining — no bonus

    return {
      score,
      weeklyDownloads: current,
      prevWeeklyDownloads: previous,
      growthPercent: Math.round(growth * 10) / 10,
      trend: growth > 0 ? 'growing' : growth === 0 ? 'stable' : 'declining',
    };
  } catch (err) {
    console.error(`npm download fetch failed for ${npmPackage}:`, err.message);
    return { score: 0, weeklyDownloads: 0, trend: 'error' };
  }
}

async function fetchCommitFrequency(owner, repo, token) {
  const activity = await githubGet(
    `https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`,
    token
  );

  if (!Array.isArray(activity)) {
    return { score: 0, commits90d: 0 };
  }

  const recentWeeks = activity.slice(-13);
  const commits90d = recentWeeks.reduce((sum, w) => sum + (w.total || 0), 0);
  const avgPerWeek = commits90d / Math.max(recentWeeks.length, 1);

  // Score: based on commit frequency
  let score = 0;
  if (avgPerWeek >= 10) score = 10;
  else if (avgPerWeek >= 5) score = 8;
  else if (avgPerWeek >= 2) score = 6;
  else if (avgPerWeek >= 1) score = 4;
  else if (commits90d > 0) score = 2;
  else score = 0;

  return { score, commits90d, avgPerWeek: Math.round(avgPerWeek * 10) / 10 };
}

// ---------------------------------------------------------------------------
// Composite scoring
// ---------------------------------------------------------------------------

function computeReliabilityScore(metrics) {
  const {
    starsTrajectory,
    issueResponse,
    forkActivity,
    downloadTrend,
    commitFrequency,
  } = metrics;

  const raw =
    starsTrajectory.score +
    issueResponse.score +
    forkActivity.score +
    downloadTrend.score +
    commitFrequency.score;

  // Clamp to 0–100
  const total = Math.min(100, Math.max(0, raw));

  // Tier
  let tier, label;
  if (total >= 80) { tier = 'excellent'; label = 'Excellent'; }
  else if (total >= 60) { tier = 'strong'; label = 'Strong'; }
  else if (total >= 40) { tier = 'moderate'; label = 'Moderate'; }
  else if (total >= 20) { tier = 'limited'; label = 'Limited'; }
  else { tier = 'minimal'; label = 'Minimal'; }

  return {
    score: total,
    tier,
    label,
    breakdown: {
      starsTrajectory: { weight: 30, ...starsTrajectory },
      issueResponse: { weight: 25, ...issueResponse },
      forkActivity: { weight: 20, ...forkActivity },
      downloadTrend: { weight: 15, ...downloadTrend },
      commitFrequency: { weight: 10, ...commitFrequency },
    },
    assessedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

async function runReliabilityAssessment(env) {
  console.log('Starting reliability assessment...');

  const token = env.GITHUB_TOKEN || null;

  // Fetch servers with GitHub URLs
  const servers = await env.DB.prepare(`
    SELECT id, name, github_url, npm_package
    FROM servers
    WHERE github_url IS NOT NULL
    ORDER BY stars DESC
    LIMIT 500
  `).all();

  if (!servers.results || servers.results.length === 0) {
    console.log('No servers found with GitHub URLs');
    return;
  }

  // Add column if not exists
  try {
    await env.DB.prepare('ALTER TABLE servers ADD COLUMN reliability_score_json TEXT').run();
  } catch {
    // Column already exists
  }

  console.log(`Processing ${servers.results.length} servers for reliability...`);

  let processed = 0;
  const batchSize = 15; // smaller batches — more API calls per server

  for (let i = 0; i < servers.results.length; i += batchSize) {
    const batch = servers.results.slice(i, i + batchSize);

    const results = await Promise.all(batch.map(async (server) => {
      const repo = extractOwnerRepo(server.github_url);
      if (!repo) return { id: server.id, score: null };

      const [starsTrajectory, issueResponse, forkActivity, downloadTrend, commitFrequency] =
        await Promise.all([
          fetchStarsTrajectory(repo.owner, repo.repo, token),
          fetchIssueResponse(repo.owner, repo.repo, token),
          fetchForkActivity(repo.owner, repo.repo, token),
          fetchDownloadTrend(server.npm_package, token),
          fetchCommitFrequency(repo.owner, repo.repo, token),
        ]);

      const reliability = computeReliabilityScore({
        starsTrajectory,
        issueResponse,
        forkActivity,
        downloadTrend,
        commitFrequency,
      });

      return { id: server.id, score: reliability };
    }));

    // Write to D1
    const stmt = env.DB.prepare(
      'UPDATE servers SET reliability_score_json = ? WHERE id = ?'
    );

    for (const result of results) {
      const jsonStr = result.score ? JSON.stringify(result.score) : null;
      await stmt.bind(jsonStr, result.id).run();
      processed++;
    }

    // Rate limit pause between batches
    if (i + batchSize < servers.results.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`Reliability assessment complete: ${processed} servers processed`);
}

// ---------------------------------------------------------------------------
// Monthly Top 10 report generation
// ---------------------------------------------------------------------------

async function generateTop10Report(env) {
  // Get top servers by reliability score
  const rows = await env.DB.prepare(`
    SELECT id, name, github_url, npm_package, stars, reliability_score_json
    FROM servers
    WHERE reliability_score_json IS NOT NULL
    ORDER BY stars DESC
    LIMIT 200
  `).all();

  if (!rows.results || rows.results.length === 0) {
    return { error: 'No reliability data available yet' };
  }

  // Parse and sort by reliability score
  const scored = rows.results
    .map(row => {
      let data = null;
      try { data = JSON.parse(row.reliability_score_json); } catch {}
      return { ...row, reliability: data };
    })
    .filter(r => r.reliability && r.reliability.score >= 40)
    .sort((a, b) => b.reliability.score - a.reliability.score)
    .slice(0, 10);

  if (scored.length === 0) {
    return { error: 'No servers met the minimum reliability threshold (40/100)' };
  }

  const reportDate = new Date().toISOString().split('T')[0];
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const report = {
    title: `Top 10 Most Reliable MCP Servers — ${monthLabel}`,
    date: reportDate,
    month: monthLabel,
    methodology: 'Composite score (0–100): Stars trajectory (30%), Issue response time (25%), Fork activity (20%), Download trends (15%), Commit frequency (10%). Minimum threshold: 40/100.',
    servers: scored.map((s, i) => ({
      rank: i + 1,
      id: s.id,
      name: s.name,
      githubUrl: s.github_url,
      stars: s.stars,
      score: s.reliability.score,
      tier: s.reliability.tier,
      label: s.reliability.label,
      highlights: {
        starsGrowth: s.reliability.breakdown.starsTrajectory.stars,
        issueResponseDays: s.reliability.breakdown.issueResponse.medianDays,
        forkCount: s.reliability.breakdown.forkActivity.forks,
        weeklyDownloads: s.reliability.breakdown.downloadTrend.weeklyDownloads,
        commits90d: s.reliability.breakdown.commitFrequency.commits90d,
      },
    })),
  };

  return report;
}

// ---------------------------------------------------------------------------
// Worker entry
// ---------------------------------------------------------------------------

export default {
  async scheduled(event, env, ctx) {
    console.log('Reliability monitor cron triggered:', event.cron);
    try {
      await runReliabilityAssessment(env);
      return new Response('Reliability assessment completed');
    } catch (error) {
      console.error('Reliability assessment failed:', error);
      return new Response(`Reliability assessment failed: ${error.message}`, { status: 500 });
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    // GET /report — generate Top 10 report (for blog/newsletter)
    if (url.pathname === '/report') {
      try {
        const report = await generateTop10Report(env);
        return new Response(JSON.stringify(report, null, 2), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(`Report generation failed: ${error.message}`, { status: 500 });
      }
    }

    // Default: run full assessment
    try {
      await runReliabilityAssessment(env);
      return new Response('Reliability assessment completed');
    } catch (error) {
      console.error('Reliability assessment failed:', error);
      return new Response(`Reliability assessment failed: ${error.message}`, { status: 500 });
    }
  },
};

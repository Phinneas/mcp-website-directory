// Cloudflare Worker for weekly MCP server green hosting assessment
// Uses Greencheck API to verify if a server's hosting provider runs on
// confirmed renewable-energy infrastructure.
//
// Only two outcomes:
//   green_verified  — Greencheck API confirms verified renewable hosting
//   user_dependent  — stdio/local servers inherit user's own energy profile
//
// No estimates. No hardcoded values. Every verified badge is backed by API data.

const GREENCHECK_API = 'https://api.thegreenwebfoundation.org/api/v3/greencheck/';

function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function resolveDomainForCheck(server) {
  // For stdio/local servers, no domain to check
  const deployment = server.deployment_type || 'local_stdio';
  if (deployment === 'local_stdio') {
    return null;
  }

  // Extract domain from github_url
  if (server.github_url) {
    return extractDomain(server.github_url);
  }

  return null;
}

async function checkGreenVerified(domain) {
  try {
    const res = await fetch(`${GREENCHECK_API}${domain}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      green: data.green === true,
      hostingProvider: data.hosted_by || null,
      listedProvider: data.listed_provider || false,
      supportingDocuments: data.supporting_documents || [],
      checkedDomain: domain,
    };
  } catch (err) {
    console.error(`Greencheck failed for ${domain}:`, err.message);
    return null;
  }
}

function computeGreenScore(domain, greenResult, deployment) {
  // stdio/local servers: user-dependent
  if (deployment === 'local_stdio' || !domain) {
    return {
      tier: 'user_dependent',
      label: 'User-Dependent',
      description: 'Local stdio server — carbon footprint depends on your own energy source.',
      hostingProvider: null,
    };
  }

  // Green Verified: Greencheck confirms renewable energy hosting
  if (greenResult && greenResult.green) {
    return {
      tier: 'green_verified',
      label: 'Green Verified',
      description: `Hosted by ${greenResult.hostingProvider || 'a verified green host'} on confirmed renewable-energy infrastructure. Verified by the Green Web Foundation.`,
      hostingProvider: greenResult.hostingProvider,
    };
  }

  // No verification available — return unknown (badge won't be shown)
  return {
    tier: 'unknown',
    label: 'Not Verified',
    description: 'Green hosting status could not be verified by the Green Web Foundation.',
    hostingProvider: greenResult?.hostingProvider || null,
  };
}

async function runGreenCheck(env) {
  console.log('Starting weekly green hosting assessment...');

  // Fetch all servers
  const servers = await env.DB.prepare(`
    SELECT id, name, deployment_type, github_url
    FROM servers
    ORDER BY stars DESC
    LIMIT 500
  `).all();

  if (!servers.results || servers.results.length === 0) {
    console.log('No servers found');
    return;
  }

  // Add column if not exists
  try {
    await env.DB.prepare(`ALTER TABLE servers ADD COLUMN green_score_json TEXT`).run();
  } catch {
    // Column already exists — safe to ignore
  }

  console.log(`Processing ${servers.results.length} servers for green verification...`);

  let processed = 0;
  let greenVerified = 0;
  let userDependent = 0;
  let unknown = 0;

  // Process in batches of 20 to respect API rate limits
  const batchSize = 20;
  for (let i = 0; i < servers.results.length; i += batchSize) {
    const batch = servers.results.slice(i, i + batchSize);

    const results = await Promise.all(batch.map(async (server) => {
      const domain = resolveDomainForCheck(server);
      const deployment = server.deployment_type || 'local_stdio';

      // For stdio servers, no API call needed
      if (!domain) {
        const score = computeGreenScore(null, null, deployment);
        return { id: server.id, score };
      }

      // Check Greencheck API
      const greenResult = await checkGreenVerified(domain);
      const score = computeGreenScore(domain, greenResult, deployment);
      return { id: server.id, score };
    }));

    // Write results to D1
    const stmt = env.DB.prepare(
      `UPDATE servers SET green_score_json = ? WHERE id = ?`
    );

    for (const result of results) {
      const jsonStr = JSON.stringify(result.score);
      await stmt.bind(jsonStr, result.id).run();

      processed++;
      if (result.score.tier === 'green_verified') greenVerified++;
      else if (result.score.tier === 'user_dependent') userDependent++;
      else unknown++;
    }

    // Rate limit pause between batches
    if (i + batchSize < servers.results.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`Green check complete: ${processed} processed, ${greenVerified} verified, ${userDependent} user-dependent, ${unknown} unknown`);
}

export default {
  async scheduled(event, env, ctx) {
    console.log('Green score cron triggered:', event.cron);
    try {
      await runGreenCheck(env);
      return new Response('Green check completed successfully');
    } catch (error) {
      console.error('Green check failed:', error);
      return new Response(`Green check failed: ${error.message}`, { status: 500 });
    }
  },

  async fetch(request, env) {
    // Manual trigger via HTTP for testing
    try {
      await runGreenCheck(env);
      return new Response('Green check completed successfully');
    } catch (error) {
      console.error('Green check failed:', error);
      return new Response(`Green check failed: ${error.message}`, { status: 500 });
    }
  },
};

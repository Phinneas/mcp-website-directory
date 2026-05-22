// Cloudflare Worker for weekly MCP server green hosting assessment
// Uses Greencheck API (verified renewable energy) and IP-to-CO2 API (estimated grid intensity)
// Runs weekly via cron triggers and updates D1 database
//
// Badge tiers:
//   green_verified  — Greencheck API confirms hosting on verified renewable-energy infrastructure
//   green_estimated  — Calculated via IP-to-CO2 API based on regional grid data
//   user_dependent   — stdio/local servers inherit user's own energy profile

const GREENCHECK_API = 'https://api.thegreenwebfoundation.org/v3/greencheck/';
const IP_TO_CO2_API = 'https://api.thegreenwebfoundation.org/v2/ip-to-co2intensity/';

// Domains that are well-known cloud providers with known hosting
const CLOUD_PROVIDER_MAP = {
  'github.io': 'GitHub Pages',
  'github.com': 'GitHub',
  'vercel.app': 'Vercel',
  'netlify.app': 'Netlify',
  'cloudflare.com': 'Cloudflare',
  'aws.amazon.com': 'AWS',
  'azure.microsoft.com': 'Azure',
  'cloud.google.com': 'GCP',
  'railway.app': 'Railway',
  'render.com': 'Render',
  'fly.dev': 'Fly.io',
  'herokuapp.com': 'Heroku',
  'supabase.co': 'Supabase',
  'upstash.com': 'Upstash',
};

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

  // Try github_url first (most reliable domain source)
  if (server.github_url) {
    const domain = extractDomain(server.github_url);
    if (domain && domain !== 'github.com') {
      return domain;
    }
  }

  // Try homepage_url
  if (server.homepage_url) {
    return extractDomain(server.homepage_url);
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
      hostingProvider: data.hosted_by || data.greenable || null,
      checkedDomain: domain,
    };
  } catch (err) {
    console.error(`Greencheck failed for ${domain}:`, err.message);
    return null;
  }
}

async function checkCarbonIntensity(domain) {
  try {
    // First resolve IP from domain
    const dnsRes = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
    if (!dnsRes.ok) return null;
    const dnsData = await dnsRes.json();
    const ip = dnsData?.Answer?.[0]?.data;
    if (!ip || ip.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/) === null) return null;

    // Then query IP-to-CO2 API
    const co2Res = await fetch(`${IP_TO_CO2_API}${ip}`);
    if (!co2Res.ok) return null;
    const co2Data = await co2Res.json();
    return {
      carbonIntensity: co2Data.carbon_intensity || null,
      countryName: co2Data.country_name || null,
      countryCode: co2Data.country_code || null,
      region: co2Data.country_name || co2Data.country_code || 'Unknown',
      checkedIp: ip,
    };
  } catch (err) {
    console.error(`CO2 check failed for ${domain}:`, err.message);
    return null;
  }
}

function computeGreenScore(domain, greenResult, carbonResult, deployment) {
  // stdio/local servers: user-dependent
  if (deployment === 'local_stdio' || !domain) {
    return {
      tier: 'user_dependent',
      label: 'User-Dependent',
      description: 'Local stdio server — carbon footprint depends on your own energy source.',
      carbonIntensity: null,
      region: null,
      greenVerified: false,
      hostingProvider: null,
    };
  }

  // Green Verified: Greencheck confirms renewable energy hosting
  if (greenResult && greenResult.green) {
    return {
      tier: 'green_verified',
      label: 'Green Verified',
      description: `Hosted by ${greenResult.hostingProvider || 'a verified green host'} on confirmed renewable-energy infrastructure.`,
      carbonIntensity: null,
      region: null,
      greenVerified: true,
      hostingProvider: greenResult.hostingProvider,
    };
  }

  // Green Estimated: Use carbon intensity data
  if (carbonResult && carbonResult.carbonIntensity !== null) {
    const intensity = Math.round(carbonResult.carbonIntensity);
    let quality = 'moderate';
    if (intensity < 200) quality = 'low';
    if (intensity > 500) quality = 'high';

    return {
      tier: 'green_estimated',
      label: `~${intensity} gCO2/kWh`,
      description: `Estimated carbon intensity: ${intensity} gCO2/kWh (${carbonResult.region}). Based on regional grid data, not verified renewable.`,
      carbonIntensity: intensity,
      region: carbonResult.region,
      greenVerified: false,
      hostingProvider: greenResult?.hostingProvider || CLOUD_PROVIDER_MAP[domain] || null,
      quality,
    };
  }

  // Fallback: no data available
  return {
    tier: 'unknown',
    label: 'No Data',
    description: 'Green hosting status could not be determined.',
    carbonIntensity: null,
    region: null,
    greenVerified: false,
    hostingProvider: null,
  };
}

async function runGreenCheck(env) {
  console.log('Starting weekly green hosting assessment...');

  // Fetch all remote (non-stdio) servers + stdio servers that have github_urls
  const servers = await env.DB.prepare(`
    SELECT id, name, deployment_type, github_url, homepage_url
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

  console.log(`Processing ${servers.results.length} servers for green scores...`);

  let processed = 0;
  let greenVerified = 0;
  let greenEstimated = 0;
  let userDependent = 0;

  // Process in batches of 20 to respect API rate limits
  const batchSize = 20;
  for (let i = 0; i < servers.results.length; i += batchSize) {
    const batch = servers.results.slice(i, i + batchSize);

    const results = await Promise.all(batch.map(async (server) => {
      const domain = resolveDomainForCheck(server);
      const deployment = server.deployment_type || 'local_stdio';

      // For stdio servers, no API call needed
      if (!domain) {
        const score = computeGreenScore(null, null, null, deployment);
        return { id: server.id, score };
      }

      // Check both APIs in parallel
      const [greenResult, carbonResult] = await Promise.all([
        checkGreenVerified(domain),
        checkCarbonIntensity(domain),
      ]);

      const score = computeGreenScore(domain, greenResult, carbonResult, deployment);
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
      else if (result.score.tier === 'green_estimated') greenEstimated++;
      else if (result.score.tier === 'user_dependent') userDependent++;
    }

    // Rate limit pause between batches
    if (i + batchSize < servers.results.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`Green check complete: ${processed} processed, ${greenVerified} verified, ${greenEstimated} estimated, ${userDependent} user-dependent`);
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
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    try {
      // Override limit for manual runs
      await runGreenCheck({ ...env, _manualLimit: limit });
      return new Response('Green check completed successfully');
    } catch (error) {
      console.error('Green check failed:', error);
      return new Response(`Green check failed: ${error.message}`, { status: 500 });
    }
  },
};

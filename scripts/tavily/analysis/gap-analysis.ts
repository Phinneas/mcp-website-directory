/**
 * Gap Analysis Module
 * Compares our MCP server directory against competitor directories
 */

import { Server, GapAnalysisResult, VendorPriority } from '../types.js';
import { logWithTimestamp } from '../utils.js';

/**
 * Run gap analysis
 */
export async function runGapAnalysis(servers: Server[]): Promise<GapAnalysisResult> {
  logWithTimestamp('Starting gap analysis', 'info');
  
  try {
    // This is a stub implementation
    // Real implementation would:
    // 1. Fetch competitor directory data
    // 2. Compare servers
    // 3. Identify gaps
    // 4. Categorize and prioritize gaps
    
    // For now, return empty result
    const result: GapAnalysisResult = {
      competitorCount: 0,
      totalGaps: 0,
      gapsByCategory: [],
      gapsByVendor: [],
      recommendations: []
    };
    
    logWithTimestamp('Gap analysis completed (stub)', 'info');
    return result;
    
  } catch (error) {
    logWithTimestamp(`Gap analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    
    // Return empty result on error
    return {
      competitorCount: 0,
      totalGaps: 0,
      gapsByCategory: [],
      gapsByVendor: [],
      recommendations: []
    };
  }
}

/**
 * Compare servers against competitor directory
 */
async function compareWithCompetitors(ourServers: Server[], competitorServers: Server[]): Promise<{
  missingServers: Server[];
  commonServers: Server[];
}> {
  // Simple comparison by name and vendor
  const ourServerKeys = new Set(
    ourServers.map(s => `${s.vendor.toLowerCase()}:${s.name.toLowerCase()}`)
  );
  
  const missingServers: Server[] = [];
  const commonServers: Server[] = [];
  
  for (const competitorServer of competitorServers) {
    const key = `${competitorServer.vendor.toLowerCase()}:${competitorServer.name.toLowerCase()}`;
    
    if (ourServerKeys.has(key)) {
      commonServers.push(competitorServer);
    } else {
      missingServers.push(competitorServer);
    }
  }
  
  return { missingServers, commonServers };
}

/**
 * Categorize gaps by vendor and category
 */
function categorizeGaps(missingServers: Server[]): {
  gapsByCategory: Array<{
    category: string;
    gapCount: number;
    priority: VendorPriority;
    exampleServers: string[];
  }>;
  gapsByVendor: Array<{
    vendor: string;
    gapCount: number;
    vendorPriority: VendorPriority;
    missingServers: Array<{
      name: string;
      estimatedPopularity: number;
      reasonForImportance: string;
    }>;
  }>;
} {
  // Group by category
  const categoryMap = new Map<string, Server[]>();
  const vendorMap = new Map<string, Server[]>();
  
  for (const server of missingServers) {
    // By category
    const category = server.vendorCategory || 'Unknown';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(server);
    
    // By vendor
    if (!vendorMap.has(server.vendor)) {
      vendorMap.set(server.vendor, []);
    }
    vendorMap.get(server.vendor)!.push(server);
  }
  
  // Convert to arrays
  const gapsByCategory = Array.from(categoryMap.entries()).map(([category, servers]) => ({
    category,
    gapCount: servers.length,
    priority: calculateCategoryPriority(category, servers.length),
    exampleServers: servers.slice(0, 3).map(s => s.name)
  }));
  
  const gapsByVendor = Array.from(vendorMap.entries()).map(([vendor, servers]) => ({
    vendor,
    gapCount: servers.length,
    vendorPriority: calculateVendorPriority(vendor),
    missingServers: servers.map(server => ({
      name: server.name,
      estimatedPopularity: estimatePopularity(server),
      reasonForImportance: generateImportanceReason(server)
    }))
  }));
  
  return { gapsByCategory, gapsByVendor };
}

/**
 * Calculate category priority
 */
function calculateCategoryPriority(category: string, gapCount: number): VendorPriority {
  // High priority categories
  const highPriorityCategories = ['AI / ML', 'Database', 'Cloud Infrastructure'];
  
  if (highPriorityCategories.includes(category)) {
    return 'high';
  }
  
  // Medium priority based on gap count
  if (gapCount > 5) {
    return 'high';
  } else if (gapCount > 2) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Calculate vendor priority
 */
function calculateVendorPriority(vendor: string): VendorPriority {
  // High priority vendors
  const highPriorityVendors = [
    'OpenAI', 'Anthropic', 'Google', 'Microsoft', 'Amazon',
    'Stripe', 'GitHub', 'MongoDB', 'Snowflake', 'Databricks'
  ];
  
  if (highPriorityVendors.includes(vendor)) {
    return 'high';
  }
  
  // Medium priority vendors
  const mediumPriorityVendors = [
    'Cloudflare', 'Vercel', 'Netlify', 'Supabase', 'PlanetScale',
    'Notion', 'Airtable', 'Slack', 'Twilio', 'Hugging Face'
  ];
  
  if (mediumPriorityVendors.includes(vendor)) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Estimate server popularity
 */
function estimatePopularity(server: Server): number {
  let popularity = 0.5; // Base score
  
  // GitHub stars increase popularity
  if (server.githubStars) {
    if (server.githubStars > 1000) popularity += 0.3;
    else if (server.githubStars > 100) popularity += 0.2;
    else if (server.githubStars > 10) popularity += 0.1;
  }
  
  // Recent activity increases popularity
  if (server.lastCommitDate) {
    const lastCommit = new Date(server.lastCommitDate);
    const now = new Date();
    const daysSince = (now.getTime() - lastCommit.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSince < 30) popularity += 0.2;
    else if (daysSince < 90) popularity += 0.1;
  }
  
  // Vendor reputation affects popularity
  const highRepVendors = ['OpenAI', 'Google', 'Microsoft', 'Amazon', 'GitHub'];
  if (highRepVendors.includes(server.vendor)) {
    popularity += 0.2;
  }
  
  return Math.min(popularity, 1.0);
}

/**
 * Generate importance reason
 */
function generateImportanceReason(server: Server): string {
  const reasons: string[] = [];
  
  if (server.githubStars && server.githubStars > 1000) {
    reasons.push(`High GitHub popularity (${server.githubStars} stars)`);
  }
  
  if (server.lastCommitDate) {
    const lastCommit = new Date(server.lastCommitDate);
    const now = new Date();
    const daysSince = (now.getTime() - lastCommit.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSince < 30) {
      reasons.push('Active development (updated in last 30 days)');
    }
  }
  
  const importantVendors = ['OpenAI', 'Google', 'Microsoft', 'Amazon'];
  if (importantVendors.includes(server.vendor)) {
    reasons.push(`From major vendor: ${server.vendor}`);
  }
  
  if (server.useCases && server.useCases.length > 0) {
    reasons.push(`Supports use cases: ${server.useCases.slice(0, 3).join(', ')}`);
  }
  
  if (reasons.length === 0) {
    return 'General purpose MCP server with broad applicability';
  }
  
  return reasons.join('; ');
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  gapsByCategory: any[],
  gapsByVendor: any[]
): Array<{
  priority: number;
  action: string;
  expectedImpact: string;
  effortEstimate: VendorPriority;
}> {
  const recommendations: Array<{
    priority: number;
    action: string;
    expectedImpact: string;
    effortEstimate: VendorPriority;
  }> = [];
  
  // High priority category gaps
  const highPriorityCategories = gapsByCategory
    .filter(gap => gap.priority === 'high')
    .sort((a, b) => b.gapCount - a.gapCount);
  
  for (const category of highPriorityCategories.slice(0, 3)) {
    recommendations.push({
      priority: 10 - recommendations.length, // Decreasing priority
      action: `Focus on discovering ${category.category} MCP servers`,
      expectedImpact: `Improve coverage in ${category.category} category`,
      effortEstimate: 'medium'
    });
  }
  
  // High priority vendor gaps
  const highPriorityVendors = gapsByVendor
    .filter(gap => gap.vendorPriority === 'high')
    .sort((a, b) => b.gapCount - a.gapCount);
  
  for (const vendor of highPriorityVendors.slice(0, 3)) {
    recommendations.push({
      priority: 10 - recommendations.length,
      action: `Target ${vendor.vendor} for MCP server discovery`,
      expectedImpact: `Add ${vendor.gapCount} missing servers from ${vendor.vendor}`,
      effortEstimate: 'high'
    });
  }
  
  // Sort by priority (highest first)
  return recommendations.sort((a, b) => b.priority - a.priority);
}

export default {
  runGapAnalysis,
  compareWithCompetitors,
  categorizeGaps,
  generateRecommendations
};
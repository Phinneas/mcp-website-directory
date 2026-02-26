/**
 * Category Health Check Module
 * Analyzes server distribution across categories
 */

import { Server, CategoryHealthResult, CategoryHealthAction } from '../types.js';
import { logWithTimestamp } from '../utils.js';

/**
 * Run category health check
 */
export async function runCategoryHealthCheck(servers: Server[]): Promise<CategoryHealthResult> {
  logWithTimestamp('Starting category health check', 'info');
  
  try {
    // Group servers by category
    const categories = analyzeCategoryDistribution(servers);
    
    // Calculate overall health
    const overallHealth = calculateOverallHealth(categories);
    
    // Generate recommendations
    const recommendations = generateCategoryRecommendations(categories);
    
    const result: CategoryHealthResult = {
      categories,
      overallHealth,
      recommendations
    };
    
    logWithTimestamp(`Category health check completed: ${categories.length} categories analyzed`, 'info');
    return result;
    
  } catch (error) {
    logWithTimestamp(`Category health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    
    // Return empty result on error
    return {
      categories: [],
      overallHealth: {
        score: 0,
        status: 'poor',
        strengths: [],
        weaknesses: ['Analysis failed']
      },
      recommendations: []
    };
  }
}

/**
 * Analyze category distribution
 */
function analyzeCategoryDistribution(servers: Server[]): Array<{
  name: string;
  serverCount: number;
  growthRate: number;
  healthScore: number;
  percentageOfTotal: number;
  idealPercentage: number;
  deviation: number;
  averageStars: number;
  approvalRate: number;
  nicheScore: number;
}> {
  // Group servers by category
  const categoryMap = new Map<string, Server[]>();
  
  for (const server of servers) {
    const category = server.vendorCategory || 'Unknown';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(server);
  }
  
  // Calculate metrics for each category
  const categories = Array.from(categoryMap.entries()).map(([name, categoryServers]) => {
    const serverCount = categoryServers.length;
    const percentageOfTotal = (serverCount / servers.length) * 100;
    
    // Calculate average GitHub stars
    const serversWithStars = categoryServers.filter(s => s.githubStars !== undefined);
    const averageStars = serversWithStars.length > 0
      ? serversWithStars.reduce((sum, s) => sum + (s.githubStars || 0), 0) / serversWithStars.length
      : 0;
    
    // Calculate approval rate
    const approvedServers = categoryServers.filter(s => s.status === 'approved').length;
    const approvalRate = serverCount > 0 ? approvedServers / serverCount : 0;
    
    // Calculate niche score
    const nicheServers = categoryServers.filter(s => s.isNiche);
    const nicheScore = serverCount > 0 ? nicheServers.length / serverCount : 0;
    
    // Growth rate (stub - would need historical data)
    const growthRate = 0;
    
    // Ideal percentage (equal distribution for now)
    const idealPercentage = 100 / categoryMap.size;
    const deviation = Math.abs(percentageOfTotal - idealPercentage);
    
    // Health score (0-100)
    const healthScore = calculateCategoryHealthScore(
      serverCount,
      percentageOfTotal,
      idealPercentage,
      averageStars,
      approvalRate,
      nicheScore
    );
    
    return {
      name,
      serverCount,
      growthRate,
      healthScore,
      percentageOfTotal,
      idealPercentage,
      deviation,
      averageStars,
      approvalRate,
      nicheScore
    };
  });
  
  return categories.sort((a, b) => b.healthScore - a.healthScore);
}

/**
 * Calculate category health score (0-100)
 */
function calculateCategoryHealthScore(
  serverCount: number,
  percentageOfTotal: number,
  idealPercentage: number,
  averageStars: number,
  approvalRate: number,
  nicheScore: number
): number {
  let score = 0;
  
  // Server count contribution (max 30 points)
  if (serverCount >= 10) score += 30;
  else if (serverCount >= 5) score += 20;
  else if (serverCount >= 2) score += 10;
  else if (serverCount >= 1) score += 5;
  
  // Distribution contribution (max 20 points)
  const distributionDeviation = Math.abs(percentageOfTotal - idealPercentage);
  if (distributionDeviation <= 5) score += 20;
  else if (distributionDeviation <= 10) score += 15;
  else if (distributionDeviation <= 20) score += 10;
  else if (distributionDeviation <= 30) score += 5;
  
  // Quality contribution (max 25 points)
  if (averageStars >= 100) score += 10;
  else if (averageStars >= 10) score += 5;
  
  if (approvalRate >= 0.8) score += 10;
  else if (approvalRate >= 0.5) score += 5;
  
  // Diversity contribution (max 25 points)
  if (nicheScore >= 0.3) score += 15; // Good niche representation
  else if (nicheScore >= 0.1) score += 10;
  
  // Bonus for balanced niche/mainstream mix
  if (nicheScore > 0.1 && nicheScore < 0.5) score += 10;
  
  return Math.min(score, 100);
}

/**
 * Calculate overall health
 */
function calculateOverallHealth(categories: any[]): {
  score: number;
  status: 'poor' | 'fair' | 'good' | 'excellent';
  strengths: string[];
  weaknesses: string[];
} {
  if (categories.length === 0) {
    return {
      score: 0,
      status: 'poor',
      strengths: [],
      weaknesses: ['No categories found']
    };
  }
  
  // Calculate average health score
  const totalScore = categories.reduce((sum, cat) => sum + cat.healthScore, 0);
  const averageScore = totalScore / categories.length;
  
  // Determine status
  let status: 'poor' | 'fair' | 'good' | 'excellent';
  if (averageScore >= 80) status = 'excellent';
  else if (averageScore >= 60) status = 'good';
  else if (averageScore >= 40) status = 'fair';
  else status = 'poor';
  
  // Identify strengths
  const strengths: string[] = [];
  const healthyCategories = categories.filter(cat => cat.healthScore >= 70);
  if (healthyCategories.length > 0) {
    strengths.push(`${healthyCategories.length} categories in good health`);
  }
  
  const balancedCategories = categories.filter(cat => cat.deviation <= 10);
  if (balancedCategories.length > categories.length / 2) {
    strengths.push('Good category balance');
  }
  
  const highQualityCategories = categories.filter(cat => cat.averageStars >= 50 || cat.approvalRate >= 0.7);
  if (highQualityCategories.length > 0) {
    strengths.push(`${highQualityCategories.length} high-quality categories`);
  }
  
  // Identify weaknesses
  const weaknesses: string[] = [];
  const unhealthyCategories = categories.filter(cat => cat.healthScore < 40);
  if (unhealthyCategories.length > 0) {
    weaknesses.push(`${unhealthyCategories.length} categories need improvement`);
  }
  
  const emptyCategories = categories.filter(cat => cat.serverCount === 0);
  if (emptyCategories.length > 0) {
    weaknesses.push(`${emptyCategories.length} empty categories`);
  }
  
  const imbalancedCategories = categories.filter(cat => cat.deviation > 30);
  if (imbalancedCategories.length > 0) {
    weaknesses.push(`${imbalancedCategories.length} highly imbalanced categories`);
  }
  
  // Default strengths/weaknesses if none identified
  if (strengths.length === 0) {
    strengths.push('Basic categorization established');
  }
  
  if (weaknesses.length === 0 && averageScore < 60) {
    weaknesses.push('Overall category health needs improvement');
  }
  
  return {
    score: Math.round(averageScore),
    status,
    strengths,
    weaknesses
  };
}

/**
 * Generate category recommendations
 */
function generateCategoryRecommendations(categories: any[]): Array<{
  category: string;
  action: CategoryHealthAction;
  rationale: string;
  priority: number;
}> {
  const recommendations: Array<{
    category: string;
    action: CategoryHealthAction;
    rationale: string;
    priority: number;
  }> = [];
  
  // Sort categories by health score (lowest first)
  const sortedCategories = [...categories].sort((a, b) => a.healthScore - b.healthScore);
  
  for (const category of sortedCategories.slice(0, 5)) { // Top 5 needing attention
    let action: CategoryHealthAction = 'maintain';
    let rationale = '';
    let priority = 10 - recommendations.length; // Decreasing priority
    
    if (category.healthScore < 30) {
      // Poor health - needs expansion
      action = 'expand';
      rationale = `Very low health score (${category.healthScore}). Needs more servers and quality improvement.`;
      priority = 10;
    } else if (category.healthScore < 50) {
      // Fair health - could expand
      action = 'expand';
      rationale = `Below average health score (${category.healthScore}). Consider adding more high-quality servers.`;
      priority = 8;
    } else if (category.healthScore >= 70 && category.deviation > 20) {
      // Good health but imbalanced - maintain
      action = 'maintain';
      rationale = `Good health (${category.healthScore}) but overrepresented (${category.percentageOfTotal.toFixed(1)}% vs ideal ${category.idealPercentage.toFixed(1)}%).`;
      priority = 6;
    } else if (category.serverCount === 0) {
      // Empty category - expand
      action = 'expand';
      rationale = 'Empty category. High priority for discovery efforts.';
      priority = 9;
    } else if (category.serverCount === 1) {
      // Single server category - expand
      action = 'expand';
      rationale = 'Only one server in this category. Vulnerable to churn.';
      priority = 7;
    } else {
      // Healthy category - maintain
      action = 'maintain';
      rationale = `Good health score (${category.healthScore}). Keep current focus.`;
      priority = 5;
    }
    
    recommendations.push({
      category: category.name,
      action,
      rationale,
      priority
    });
  }
  
  // Check for consolidation opportunities
  const smallCategories = categories.filter(cat => cat.serverCount <= 2 && cat.healthScore < 40);
  if (smallCategories.length >= 2) {
    const categoryNames = smallCategories.map(cat => cat.name).join(', ');
    recommendations.push({
      category: categoryNames,
      action: 'consolidate',
      rationale: `Multiple small, low-health categories (${smallCategories.length}). Consider merging or re-categorizing.`,
      priority: 4
    });
  }
  
  // Sort by priority (highest first)
  return recommendations.sort((a, b) => b.priority - a.priority);
}

export default {
  runCategoryHealthCheck,
  analyzeCategoryDistribution,
  calculateOverallHealth,
  generateCategoryRecommendations
};
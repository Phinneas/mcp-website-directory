/**
 * Vendor Momentum Scan Module
 * Tracks vendor activity and new server releases
 */

import { Server, VendorMomentumResult, VendorPriority, InsightType, UseCaseTrend } from '../types.js';
import { logWithTimestamp } from '../utils.js';

/**
 * Run vendor momentum scan
 */
export async function runVendorMomentumScan(servers: Server[]): Promise<VendorMomentumResult> {
  logWithTimestamp('Starting vendor momentum scan', 'info');
  
  try {
    // Analyze vendor activity
    const vendors = analyzeVendorActivity(servers);
    
    // Identify trends
    const trends = identifyVendorTrends(vendors);
    
    // Generate insights
    const insights = generateVendorInsights(vendors, trends);
    
    const result: VendorMomentumResult = {
      vendors,
      trends,
      insights
    };
    
    logWithTimestamp(`Vendor momentum scan completed: ${vendors.length} vendors analyzed`, 'info');
    return result;
    
  } catch (error) {
    logWithTimestamp(`Vendor momentum scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    
    // Return empty result on error
    return {
      vendors: [],
      trends: {
        topGrowingVendors: [],
        topDecliningVendors: [],
        emergingVendors: [],
        churnedVendors: []
      },
      insights: []
    };
  }
}

/**
 * Analyze vendor activity
 */
function analyzeVendorActivity(servers: Server[]): Array<{
  name: string;
  category: string;
  totalServers: number;
  newThisMonth: number;
  growthRate: number;
  activityScore: number;
  momentumScore: number;
  trend: UseCaseTrend;
  firstServerDate: string;
  lastServerDate: string;
  averageReleaseInterval: number;
}> {
  // Group servers by vendor
  const vendorMap = new Map<string, Server[]>();
  
  for (const server of servers) {
    if (!vendorMap.has(server.vendor)) {
      vendorMap.set(server.vendor, []);
    }
    vendorMap.get(server.vendor)!.push(server);
  }
  
  // Calculate metrics for each vendor
  const vendors = Array.from(vendorMap.entries()).map(([name, vendorServers]) => {
    const totalServers = vendorServers.length;
    
    // Sort servers by discovery date
    const sortedServers = vendorServers.sort((a, b) => 
      new Date(a.discoveryDate).getTime() - new Date(b.discoveryDate).getTime()
    );
    
    // Get date range
    const firstServerDate = sortedServers[0]?.discoveryDate || new Date().toISOString();
    const lastServerDate = sortedServers[sortedServers.length - 1]?.discoveryDate || new Date().toISOString();
    
    // Calculate new servers this month (stub - would need time-based filtering)
    const newThisMonth = 0;
    
    // Calculate growth rate (stub - would need historical data)
    const growthRate = 0;
    
    // Calculate activity score (0-100)
    const activityScore = calculateActivityScore(vendorServers);
    
    // Calculate momentum score (0-100)
    const momentumScore = calculateMomentumScore(vendorServers, activityScore);
    
    // Determine trend
    const trend = determineVendorTrend(momentumScore, activityScore, totalServers);
    
    // Calculate average release interval (days)
    const averageReleaseInterval = calculateAverageReleaseInterval(sortedServers);
    
    // Determine category (most common category among servers)
    const categoryCounts = new Map<string, number>();
    vendorServers.forEach(server => {
      const category = server.vendorCategory || 'Unknown';
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });
    
    let category = 'Unknown';
    let maxCount = 0;
    categoryCounts.forEach((count, cat) => {
      if (count > maxCount) {
        maxCount = count;
        category = cat;
      }
    });
    
    return {
      name,
      category,
      totalServers,
      newThisMonth,
      growthRate,
      activityScore,
      momentumScore,
      trend,
      firstServerDate,
      lastServerDate,
      averageReleaseInterval
    };
  });
  
  return vendors.sort((a, b) => b.momentumScore - a.momentumScore);
}

/**
 * Calculate activity score (0-100)
 */
function calculateActivityScore(servers: Server[]): number {
  if (servers.length === 0) return 0;
  
  let score = 0;
  
  // Server count contribution (max 40 points)
  if (servers.length >= 10) score += 40;
  else if (servers.length >= 5) score += 30;
  else if (servers.length >= 3) score += 20;
  else if (servers.length >= 1) score += 10;
  
  // Recent activity contribution (max 30 points)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const recentServers = servers.filter(server => {
    const discoveryDate = new Date(server.discoveryDate);
    return discoveryDate >= thirtyDaysAgo;
  });
  
  if (recentServers.length > 0) {
    score += Math.min(30, recentServers.length * 10);
  }
  
  // Quality contribution (max 30 points)
  const approvedServers = servers.filter(s => s.status === 'approved').length;
  const approvalRate = servers.length > 0 ? approvedServers / servers.length : 0;
  
  if (approvalRate >= 0.8) score += 20;
  else if (approvalRate >= 0.5) score += 10;
  
  const highStarServers = servers.filter(s => (s.githubStars || 0) >= 100).length;
  if (highStarServers > 0) {
    score += Math.min(10, highStarServers * 2);
  }
  
  return Math.min(score, 100);
}
/**
 * Calculate momentum score (0-100)
 */
function calculateMomentumScore(servers: Server[], activityScore: number): number {
  if (servers.length === 0) return 0;
  
  let score = activityScore * 0.5; // Start with half of activity score
  
  // Sort by discovery date
  const sortedServers = servers.sort((a, b) => 
    new Date(a.discoveryDate).getTime() - new Date(b.discoveryDate).getTime()
  );
  
  // Recent growth contribution (max 30 points)
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  const recentServers = sortedServers.filter(server => {
    const discoveryDate = new Date(server.discoveryDate);
    return discoveryDate >= ninetyDaysAgo;
  });
  
  const olderServers = sortedServers.filter(server => {
    const discoveryDate = new Date(server.discoveryDate);
    return discoveryDate < ninetyDaysAgo;
  });
  
  if (recentServers.length > 0 && olderServers.length > 0) {
    const growthRate = recentServers.length / olderServers.length;
    if (growthRate >= 2) score += 30;
    else if (growthRate >= 1) score += 20;
    else if (growthRate >= 0.5) score += 10;
  } else if (recentServers.length > 0 && olderServers.length === 0) {
    // New vendor with only recent servers
    score += 25;
  }
  
  // Consistency contribution (max 20 points)
  if (sortedServers.length >= 3) {
    const intervals: number[] = [];
    for (let i = 1; i < sortedServers.length; i++) {
      const prevServer = sortedServers[i - 1];
      const currServer = sortedServers[i];
      if (prevServer && currServer) {
        const prevDate = new Date(prevServer.discoveryDate);
        const currDate = new Date(currServer.discoveryDate);
        const interval = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        intervals.push(interval);
      }
    }
    
    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const stdDev = Math.sqrt(
        intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length
      );
      
      const consistency = stdDev / avgInterval; // Coefficient of variation
      if (consistency < 0.5) score += 20;
      else if (consistency < 1.0) score += 10;
    }
  }
  
  return Math.min(score, 100);
}

/**
 * Determine vendor trend
 */
function determineVendorTrend(momentumScore: number, activityScore: number, totalServers: number): UseCaseTrend {
  if (totalServers === 0) return 'declining';
  
  if (momentumScore >= 80 && activityScore >= 70) {
    return 'exploding';
  } else if (momentumScore >= 60 && activityScore >= 50) {
    return 'growing';
  } else if (momentumScore >= 40 && activityScore >= 30) {
    return 'stable';
  } else {
    return 'declining';
  }
}

/**
 * Calculate average release interval (days)
 */
function calculateAverageReleaseInterval(sortedServers: Server[]): number {
  if (sortedServers.length < 2) return 0;
  
  const intervals: number[] = [];
  for (let i = 1; i < sortedServers.length; i++) {
    const prevServer = sortedServers[i - 1];
    const currServer = sortedServers[i];
    if (prevServer && currServer) {
      const prevDate = new Date(prevServer.discoveryDate);
      const currDate = new Date(currServer.discoveryDate);
      const interval = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(interval);
    }
  }
  
  return intervals.length > 0 ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length : 0;
}

/**
 * Identify vendor trends
 */
function identifyVendorTrends(vendors: any[]): {
  topGrowingVendors: string[];
  topDecliningVendors: string[];
  emergingVendors: string[];
  churnedVendors: string[];
} {
  // Top growing vendors (high momentum, high activity)
  const topGrowingVendors = vendors
    .filter(v => v.trend === 'exploding' || v.trend === 'growing')
    .sort((a, b) => b.momentumScore - a.momentumScore)
    .slice(0, 5)
    .map(v => v.name);
  
  // Top declining vendors (low momentum, low activity)
  const topDecliningVendors = vendors
    .filter(v => v.trend === 'declining')
    .sort((a, b) => a.momentumScore - b.momentumScore)
    .slice(0, 5)
    .map(v => v.name);
  
  // Emerging vendors (few servers but high momentum)
  const emergingVendors = vendors
    .filter(v => v.totalServers <= 3 && v.momentumScore >= 60)
    .sort((a, b) => b.momentumScore - a.momentumScore)
    .slice(0, 3)
    .map(v => v.name);
  
  // Churned vendors (no recent activity)
  const churnedVendors = vendors
    .filter(v => {
      const lastServerDate = new Date(v.lastServerDate);
      const now = new Date();
      const daysSinceLast = (now.getTime() - lastServerDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLast > 180; // No activity for 6 months
    })
    .map(v => v.name);
  
  return {
    topGrowingVendors,
    topDecliningVendors,
    emergingVendors,
    churnedVendors
  };
}
/**
 * Generate vendor insights
 */
function generateVendorInsights(vendors: any[], trends: any): Array<{
  type: InsightType;
  description: string;
  impact: VendorPriority;
  evidence: string[];
}> {
  const insights: Array<{
    type: InsightType;
    description: string;
    impact: VendorPriority;
    evidence: string[];
  }> = [];
  
  // Opportunity: Top growing vendors
  if (trends.topGrowingVendors.length > 0) {
    insights.push({
      type: 'opportunity',
      description: `Strong momentum from ${trends.topGrowingVendors.length} vendors`,
      impact: 'high',
      evidence: [
        `${trends.topGrowingVendors.join(', ')} showing high growth`,
        'Consider prioritizing these vendors for deeper integration'
      ]
    });
  }
  
  // Risk: Declining vendors
  if (trends.topDecliningVendors.length > 0) {
    insights.push({
      type: 'risk',
      description: `${trends.topDecliningVendors.length} vendors showing decline`,
      impact: 'medium',
      evidence: [
        `${trends.topDecliningVendors.join(', ')} have low momentum scores`,
        'Monitor for potential churn or reduced support'
      ]
    });
  }
  
  // Opportunity: Emerging vendors
  if (trends.emergingVendors.length > 0) {
    insights.push({
      type: 'opportunity',
      description: `${trends.emergingVendors.length} emerging vendors with potential`,
      impact: 'medium',
      evidence: [
        `${trends.emergingVendors.join(', ')} have few servers but high momentum`,
        'Early adoption could provide competitive advantage'
      ]
    });
  }
  
  // Risk: Churned vendors
  if (trends.churnedVendors.length > 0) {
    insights.push({
      type: 'risk',
      description: `${trends.churnedVendors.length} vendors may have churned`,
      impact: 'low',
      evidence: [
        `${trends.churnedVendors.join(', ')} have no recent activity`,
        'Consider deprioritizing or removing these vendors'
      ]
    });
  }
  
  // Trend: Vendor concentration
  const top5Vendors = vendors.slice(0, 5);
  const top5Share = top5Vendors.reduce((sum, v) => sum + v.totalServers, 0);
  const totalServers = vendors.reduce((sum, v) => sum + v.totalServers, 0);
  const concentration = totalServers > 0 ? (top5Share / totalServers) * 100 : 0;
  
  if (concentration > 50) {
    insights.push({
      type: 'trend',
      description: 'High vendor concentration risk',
      impact: 'medium',
      evidence: [
        `Top 5 vendors account for ${concentration.toFixed(1)}% of servers`,
        'Diversification needed to reduce dependency'
      ]
    });
  }
  
  // Trend: Category distribution
  const categoryMap = new Map<string, number>();
  vendors.forEach(vendor => {
    categoryMap.set(vendor.category, (categoryMap.get(vendor.category) || 0) + vendor.totalServers);
  });
  
  const maxCategory = Array.from(categoryMap.entries()).reduce((max, [cat, count]) => 
    count > max.count ? { category: cat, count } : max,
    { category: '', count: 0 }
  );
  
  if (maxCategory.count > totalServers * 0.4) { // More than 40% in one category
    insights.push({
      type: 'trend',
      description: `Category concentration in ${maxCategory.category}`,
      impact: 'medium',
      evidence: [
        `${maxCategory.category} accounts for ${((maxCategory.count / totalServers) * 100).toFixed(1)}% of servers`,
        'Consider expanding into other categories'
      ]
    });
  }
  
  // Default insight if none generated
  if (insights.length === 0) {
    insights.push({
      type: 'trend',
      description: 'Stable vendor ecosystem',
      impact: 'low',
      evidence: [
        'No significant trends detected',
        'Vendor distribution appears balanced'
      ]
    });
  }
  
  return insights;
}

export default {
  runVendorMomentumScan,
  analyzeVendorActivity,
  identifyVendorTrends,
  generateVendorInsights
};
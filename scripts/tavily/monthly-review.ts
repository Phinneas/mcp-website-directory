/**
 * Monthly review script for MCP Intelligence System
 * Runs first Monday of each month for comprehensive analysis
 */

import { getConfigManager } from './config.js';
import { createStorageManager } from './storage.js';
import { MonthlyReport } from './types.js';
import {
  logWithTimestamp,
  formatDate,
  getMonthlyDateRange
} from './utils.js';

// Import analysis modules
import { 
  runGapAnalysis, 
  runCategoryHealthCheck, 
  runVendorMomentumScan, 
  runEmergingUseCaseDetection 
} from './analysis/index.js';

/**
 * Main monthly review function
 */
async function runMonthlyReview(): Promise<{
  success: boolean;
  report: MonthlyReport | null;
  insights: string[];
  errors: Array<{
    module: string;
    error: string;
    timestamp: string;
  }>;
}> {
  const startTime = Date.now();
  const errors: Array<{ module: string; error: string; timestamp: string }> = [];
  const insights: string[] = [];
  
  logWithTimestamp('Starting monthly MCP review', 'info');

  try {
    // Initialize components
    const config = getConfigManager();
    const storage = createStorageManager();
    
    await storage.initialize();

    // Get date range for monthly report
    const dateRange = getMonthlyDateRange();
    const reportDate = formatDate(new Date()).slice(0, 7); // YYYY-MM
    
    logWithTimestamp(`Generating monthly report for ${reportDate}`, 'info');

    // Load data for analysis
    const servers = await storage.getServersInDateRange(
      formatDate(dateRange.start),
      formatDate(dateRange.end)
    );
    
    const dbStats = await storage.getStats();
    
    logWithTimestamp(`Loaded ${servers.length} servers for analysis`, 'info');

    // Run analysis modules
    const analysisResults = {
      gapAnalysis: await runGapAnalysis(servers),
      categoryHealth: await runCategoryHealthCheck(servers),
      vendorMomentum: await runVendorMomentumScan(servers),
      emergingUseCases: await runEmergingUseCaseDetection(servers)
    };

    // Generate executive summary
    const summary = generateExecutiveSummary(servers, dbStats, analysisResults, insights);

    // Create monthly report
    const report: MonthlyReport = {
      reportId: `report-${reportDate}-${Date.now()}`,
      reportDate,
      generatedAt: new Date().toISOString(),
      period: {
        start: formatDate(dateRange.start),
        end: formatDate(dateRange.end)
      },
      summary,
      gapAnalysis: analysisResults.gapAnalysis,
      categoryHealth: analysisResults.categoryHealth,
      vendorMomentum: analysisResults.vendorMomentum,
      emergingUseCases: analysisResults.emergingUseCases,
      dataSources: {
        newServersFile: `data/new-servers/${formatDate(new Date())}.json`,
        seenServersFile: config.getSystemConfig().seenServersFile,
        vendorWatchlist: config.getSystemConfig().vendorWatchlistFile
      },
      metrics: {
        scanDuration: Date.now() - startTime,
        apiCalls: 0, // Monthly review doesn't make API calls
        errorCount: errors.length,
        successRate: errors.length === 0 ? 1.0 : 0.5
      }
    };

    // Save report
    const reportPath = await storage.saveMonthlyReport(report);
    logWithTimestamp(`Saved monthly report to ${reportPath}`, 'info');

    // Generate insights
    generateInsights(report, insights);

    const totalTime = Date.now() - startTime;
    logWithTimestamp(`Monthly review completed in ${totalTime}ms`, 'info');
    logWithTimestamp(`Generated ${insights.length} insights, ${errors.length} errors`, 'info');

    return {
      success: true,
      report,
      insights,
      errors
    };

  } catch (error) {
    logWithTimestamp(`Monthly review failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    
    return {
      success: false,
      report: null,
      insights,
      errors: [...errors, {
        module: 'system',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }]
    };
  }
}



/**
 * Generate executive summary
 */
function generateExecutiveSummary(
  servers: any[],
  dbStats: any,
  analysisResults: any,
  insights: string[]
): {
  totalServersDiscovered: number;
  newVendors: number;
  approvalRate: number;
  keyInsights: string[];
  recommendations: string[];
} {
  const totalServers = servers.length;
  const uniqueVendors = new Set(servers.map(s => s.vendor)).size;
  const approvedServers = servers.filter(s => s.status === 'approved').length;
  const approvalRate = totalServers > 0 ? approvedServers / totalServers : 0;

  // Generate key insights
  if (totalServers === 0) {
    insights.push('No servers discovered this month - consider expanding search criteria');
  } else {
    insights.push(`Discovered ${totalServers} MCP servers from ${uniqueVendors} vendors`);
    insights.push(`Approval rate: ${(approvalRate * 100).toFixed(1)}%`);
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (approvalRate < 0.5) {
    recommendations.push('Improve server validation to increase approval rate');
  }
  
  if (uniqueVendors < 10) {
    recommendations.push('Expand vendor watchlist to cover more categories');
  }
  
  if (analysisResults.gapAnalysis.totalGaps > 0) {
    recommendations.push(`Address ${analysisResults.gapAnalysis.totalGaps} identified coverage gaps`);
  }

  return {
    totalServersDiscovered: totalServers,
    newVendors: uniqueVendors,
    approvalRate,
    keyInsights: insights.slice(0, 5), // Top 5 insights
    recommendations: recommendations.slice(0, 5) // Top 5 recommendations
  };
}

/**
 * Generate insights from report
 */
function generateInsights(report: MonthlyReport, insights: string[]): void {
  if (!report) return;

  // Insights from gap analysis
  if (report.gapAnalysis.totalGaps > 0) {
    insights.push(`Found ${report.gapAnalysis.totalGaps} coverage gaps compared to competitors`);
  }

  // Insights from category health
  if (report.categoryHealth.overallHealth.status === 'poor') {
    insights.push('Category health needs improvement - some categories are underrepresented');
  }

  // Insights from vendor momentum
  if (report.vendorMomentum.trends.topGrowingVendors.length > 0) {
    insights.push(`Top growing vendors: ${report.vendorMomentum.trends.topGrowingVendors.join(', ')}`);
  }

  // Insights from emerging use cases
  if (report.emergingUseCases.contentTopics.length > 0) {
    insights.push(`Generated ${report.emergingUseCases.contentTopics.length} content topic suggestions`);
  }
}

/**
 * Main execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  runMonthlyReview()
    .then(result => {
      if (result.success && result.report) {
        console.log('Monthly review completed successfully');
        console.log('Report ID:', result.report.reportId);
        console.log('Insights:', result.insights);
        process.exit(0);
      } else {
        console.error('Monthly review failed or no report generated');
        console.error('Errors:', result.errors);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error in monthly review:', error);
      process.exit(1);
    });
}

export { runMonthlyReview };
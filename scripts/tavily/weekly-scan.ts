/**
 * Weekly scan script for MCP Intelligence System
 * Runs every Monday to discover new MCP servers
 */

import { getConfigManager } from './config.js';
import { createTavilyClient } from './api.js';
import { createStorageManager } from './storage.js';
import { Server } from './types.js';
import {
  logWithTimestamp,
  generateUUID,
  calculateConfidenceScore,
  calculateNicheScore,
  formatDate,
  batchProcess,
  sleep
} from './utils.js';

/**
 * Main weekly scan function
 */
async function runWeeklyScan(): Promise<{
  success: boolean;
  stats: {
    totalVendorsSearched: number;
    newServersDiscovered: number;
    alreadyKnown: number;
    falsePositivesFiltered: number;
    apiCalls: number;
    processingTime: number;
    errorCount: number;
  };
  errors: Array<{
    vendor: string;
    error: string;
    timestamp: string;
  }>;
}> {
  const startTime = Date.now();
  const errors: Array<{ vendor: string; error: string; timestamp: string }> = [];
  
  logWithTimestamp('Starting weekly MCP server scan', 'info');

  try {
    // Initialize components
    const config = getConfigManager();
    const tavilyClient = createTavilyClient(config.getTavilyConfig());
    const storage = createStorageManager();
    
    await storage.initialize();

    // Validate configuration
    const validation = config.validate();
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    // Load vendor watchlist
    const vendors = config.loadVendorWatchlist();
    logWithTimestamp(`Loaded ${vendors.length} vendors from watchlist`, 'info');

    // Track statistics
    let newServersDiscovered = 0;
    let alreadyKnown = 0;
    let falsePositivesFiltered = 0;
    let apiCalls = 0;
    let errorCount = 0;

    // Process vendors in batches by priority
    const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
    
    for (const priority of priorities) {
      const priorityVendors = vendors.filter(v => v.priority === priority);
      const batchSize = config.getBatchSize(priority);
      
      logWithTimestamp(`Processing ${priorityVendors.length} ${priority} priority vendors in batches of ${batchSize}`, 'info');

      // Process vendors in batches
      await batchProcess(priorityVendors, async (vendor) => {
        try {
          logWithTimestamp(`Searching for MCP servers from ${vendor.name}`, 'info');
          
          // Get search queries for this vendor
          const searchQueries = config.getSearchQueriesForVendor(vendor);
          
          // Search for MCP servers
          const searchResults = await tavilyClient.searchForMcpServers(vendor.name, searchQueries);
          apiCalls += searchQueries.length;
          
          // Extract MCP servers from results
          const potentialServers = tavilyClient.extractMcpServersFromResults(searchResults, vendor.name);
          
          logWithTimestamp(`Found ${potentialServers.length} potential MCP servers from ${vendor.name}`, 'info');
          
          // Process each potential server
          for (const potentialServer of potentialServers) {
            try {
              // Create server object
              const server: Server = {
                id: generateUUID(),
                name: extractServerName(potentialServer.title),
                vendor: vendor.name,
                vendorCategory: vendor.category,
                discoveryDate: new Date().toISOString(),
                discoverySource: 'tavily',
                searchQuery: potentialServer.title,
                confidenceScore: potentialServer.confidence,
                githubUrl: extractGitHubUrl(potentialServer.url, potentialServer.content),
                documentationUrl: extractDocumentationUrl(potentialServer.content),
                description: extractDescription(potentialServer.content),
                tags: extractTags(potentialServer.content, vendor.category),
                useCases: extractUseCases(potentialServer.content),
                githubStars: extractGitHubStars(potentialServer.content),
                lastCommitDate: potentialServer.publishedDate,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              // Calculate confidence score
              server.confidenceScore = calculateConfidenceScore(server);

              // Check if server has been seen before
              const isSeen = await storage.isServerSeen(server);
              
              if (isSeen) {
                alreadyKnown++;
                logWithTimestamp(`Server already known: ${server.name} from ${server.vendor}`, 'debug');
                continue;
              }

              // Validate server
              try {
                // This would validate against schema
                // For now, basic validation
                if (!server.name || !server.vendor) {
                  falsePositivesFiltered++;
                  logWithTimestamp(`Filtered false positive: ${potentialServer.title}`, 'debug');
                  continue;
                }
              } catch (validationError) {
                falsePositivesFiltered++;
                logWithTimestamp(`Validation failed for ${potentialServer.title}: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`, 'warn');
                continue;
              }

              // Calculate niche score
              server.isNiche = server.githubStars !== undefined && server.githubStars < 100;
              if (server.isNiche) {
                server.nicheConfidence = calculateNicheScore(server);
                server.nicheRationale = generateNicheRationale(server);
              }

              // Add server to storage
              await storage.addSeenServer(server);
              newServersDiscovered++;
              
              logWithTimestamp(`Discovered new server: ${server.name} from ${server.vendor} (confidence: ${server.confidenceScore.toFixed(2)})`, 'info');

            } catch (serverError) {
              errorCount++;
              logWithTimestamp(`Error processing potential server ${potentialServer.title}: ${serverError instanceof Error ? serverError.message : 'Unknown error'}`, 'error');
            }
          }

          // Delay between vendors to avoid rate limiting
          await sleep(config.getApiDelay());

        } catch (vendorError) {
          errorCount++;
          const error = {
            vendor: vendor.name,
            error: vendorError instanceof Error ? vendorError.message : 'Unknown error',
            timestamp: new Date().toISOString()
          };
          errors.push(error);
          logWithTimestamp(`Error processing vendor ${vendor.name}: ${error.error}`, 'error');
        }
      }, batchSize);
    }

    // Save new servers to weekly file
    const newServers = await storage.getServersByStatus('pending');
    const weeklyStats = {
      queryCount: vendors.length,
      alreadyKnown,
      falsePositivesFiltered,
      totalVendorsSearched: vendors.length,
      apiCalls,
      processingTime: Date.now() - startTime,
      errorCount
    };

    if (newServers.length > 0) {
      await storage.saveNewServers(newServers, weeklyStats);
      logWithTimestamp(`Saved ${newServers.length} new servers to weekly file`, 'info');
    }

    // Get final statistics
    const dbStats = await storage.getStats();
    
    const totalTime = Date.now() - startTime;
    logWithTimestamp(`Weekly scan completed in ${totalTime}ms`, 'info');
    logWithTimestamp(`Statistics: ${newServersDiscovered} new servers, ${alreadyKnown} already known, ${falsePositivesFiltered} filtered, ${errorCount} errors`, 'info');

    return {
      success: true,
      stats: {
        totalVendorsSearched: vendors.length,
        newServersDiscovered,
        alreadyKnown,
        falsePositivesFiltered,
        apiCalls,
        processingTime: totalTime,
        errorCount
      },
      errors
    };

  } catch (error) {
    logWithTimestamp(`Weekly scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    
    return {
      success: false,
      stats: {
        totalVendorsSearched: 0,
        newServersDiscovered: 0,
        alreadyKnown: 0,
        falsePositivesFiltered: 0,
        apiCalls: 0,
        processingTime: Date.now() - startTime,
        errorCount: errors.length + 1
      },
      errors: [...errors, {
        vendor: 'system',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }]
    };
  }
}

/**
 * Extract server name from search result
 */
function extractServerName(title: string): string {
  // Remove common prefixes and suffixes
  let name = title
    .replace(/MCP server/gi, '')
    .replace(/Model Context Protocol/gi, '')
    .replace(/official/gi, '')
    .replace(/integration/gi, '')
    .replace(/plugin/gi, '')
    .replace(/extension/gi, '')
    .replace(/tool/gi, '')
    .replace(/[\[\](){}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter of each word
  name = name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return name || 'Unknown MCP Server';
}

/**
 * Extract GitHub URL from content
 */
function extractGitHubUrl(url: string, content: string): string | undefined {
  // Check if the URL itself is a GitHub URL
  if (url.includes('github.com')) {
    return url;
  }

  // Search for GitHub URLs in content
  const githubUrlRegex = /https?:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+/g;
  const matches = content.match(githubUrlRegex);
  
  if (matches && matches.length > 0) {
    return matches[0];
  }

  return undefined;
}

/**
 * Extract documentation URL from content
 */
function extractDocumentationUrl(content: string): string | undefined {
  const docUrlRegex = /https?:\/\/(?:docs?\.|readthedocs\.io|documentation\.)[a-zA-Z0-9.-]+\/[a-zA-Z0-9_./-]*/g;
  const matches = content.match(docUrlRegex);
  
  if (matches && matches.length > 0) {
    return matches[0];
  }

  return undefined;
}

/**
 * Extract description from content
 */
function extractDescription(content: string): string {
  // Take first 200 characters as description
  const maxLength = 200;
  let description = content.replace(/\s+/g, ' ').trim();
  
  if (description.length > maxLength) {
    description = description.substring(0, maxLength) + '...';
  }
  
  return description || 'No description available';
}

/**
 * Extract tags from content
 */
function extractTags(content: string, category: string): string[] {
  const tags: string[] = [];
  
  // Add category as first tag
  tags.push(category);
  
  // Common MCP-related tags
  const mcpTags = ['mcp', 'model-context-protocol', 'ai', 'tool', 'integration'];
  mcpTags.forEach(tag => {
    if (content.toLowerCase().includes(tag)) {
      tags.push(tag);
    }
  });
  
  // Technology tags
  const techTags = ['typescript', 'python', 'javascript', 'node', 'react', 'api'];
  techTags.forEach(tag => {
    if (content.toLowerCase().includes(tag)) {
      tags.push(tag);
    }
  });
  
  return Array.from(new Set(tags)); // Remove duplicates
}

/**
 * Extract use cases from content
 */
function extractUseCases(content: string): string[] {
  const useCases: string[] = [];
  
  const commonUseCases = [
    'data analysis',
    'automation',
    'monitoring',
    'integration',
    'api',
    'database',
    'cloud',
    'ai',
    'machine learning',
    'natural language processing'
  ];
  
  commonUseCases.forEach(useCase => {
    if (content.toLowerCase().includes(useCase)) {
      useCases.push(useCase);
    }
  });
  
  return useCases;
}

/**
 * Extract GitHub stars from content
 */
function extractGitHubStars(content: string): number | undefined {
  const starRegex = /(\d+[,.]?\d*)\s*(?:stars?|⭐)/gi;
  const matches = content.match(starRegex);
  
  if (matches && matches.length > 0) {
    const match = matches[0];
    const numberMatch = match.match(/\d+/);
    if (numberMatch) {
      return parseInt(numberMatch[0], 10);
    }
  }
  
  return undefined;
}

/**
 * Generate niche rationale
 */
function generateNicheRationale(server: Server): string {
  const reasons: string[] = [];
  
  if (server.githubStars !== undefined && server.githubStars < 100) {
    reasons.push(`Low GitHub stars (${server.githubStars}) indicates specialized audience`);
  }
  
  if (server.tags && server.tags.some(tag => tag.includes('niche') || tag.includes('specialized'))) {
    reasons.push('Tagged as specialized or niche');
  }
  
  if (server.useCases && server.useCases.length > 0) {
    reasons.push(`Specific use cases: ${server.useCases.join(', ')}`);
  }
  
  if (reasons.length === 0) {
    return 'Server serves specialized functionality not covered by mainstream tools';
  }
  
  return reasons.join('; ');
}

/**
 * Main execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  runWeeklyScan()
    .then(result => {
      if (result.success) {
        console.log('Weekly scan completed successfully');
        console.log('Statistics:', result.stats);
        process.exit(0);
      } else {
        console.error('Weekly scan failed');
        console.error('Errors:', result.errors);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error in weekly scan:', error);
      process.exit(1);
    });
}

export { runWeeklyScan };
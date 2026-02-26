/**
 * Emerging Use Case Detection Module
 * Identifies new patterns in MCP server development
 */

import { Server, EmergingUseCaseResult, VendorPriority, ContentFormat } from '../types.js';
import { logWithTimestamp } from '../utils.js';

/**
 * Run emerging use case detection
 */
export async function runEmergingUseCaseDetection(servers: Server[]): Promise<EmergingUseCaseResult> {
  logWithTimestamp('Starting emerging use case detection', 'info');
  
  try {
    // Detect use cases from server data
    const useCases = detectUseCases(servers);
    
    // Generate content topics
    const contentTopics = generateContentTopics(useCases, servers);
    
    // Identify trends
    const trends = identifyUseCaseTrends(useCases);
    
    const result: EmergingUseCaseResult = {
      useCases,
      contentTopics,
      trends
    };
    
    logWithTimestamp(`Emerging use case detection completed: ${useCases.length} use cases, ${contentTopics.length} content topics`, 'info');
    return result;
    
  } catch (error) {
    logWithTimestamp(`Emerging use case detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    
    // Return empty result on error
    return {
      useCases: [],
      contentTopics: [],
      trends: {
        topUseCases: [],
        decliningUseCases: [],
        crossCategoryPatterns: [],
        innovationAreas: []
      }
    };
  }
}

/**
 * Detect use cases from server data
 */
function detectUseCases(servers: Server[]): Array<{
  name: string;
  description: string;
  frequency: number;
  growthRate: number;
  confidence: number;
  exampleServers: string[];
  primaryCategories: string[];
  commonVendors: string[];
  searchVolumeEstimate: number;
  competitionLevel: VendorPriority;
  contentAngles: string[];
}> {
  // Extract use cases from server descriptions and tags
  const useCaseMap = new Map<string, {
    servers: Server[];
    categories: Set<string>;
    vendors: Set<string>;
  }>();
  
  // Common use case patterns to look for
  const useCasePatterns = [
    // AI/ML patterns
    { pattern: /ai|artificial intelligence|machine learning/gi, name: 'AI/ML Integration' },
    { pattern: /nlp|natural language processing/gi, name: 'Natural Language Processing' },
    { pattern: /computer vision|image recognition/gi, name: 'Computer Vision' },
    { pattern: /llm|large language model/gi, name: 'Large Language Models' },
    
    // Data patterns
    { pattern: /data analysis|analytics/gi, name: 'Data Analysis' },
    { pattern: /data visualization/gi, name: 'Data Visualization' },
    { pattern: /etl|extract transform load/gi, name: 'ETL Processing' },
    { pattern: /data pipeline/gi, name: 'Data Pipelines' },
    
    // Infrastructure patterns
    { pattern: /cloud|aws|azure|gcp/gi, name: 'Cloud Integration' },
    { pattern: /serverless|lambda|functions/gi, name: 'Serverless Computing' },
    { pattern: /container|docker|kubernetes/gi, name: 'Containerization' },
    { pattern: /monitoring|observability/gi, name: 'Monitoring & Observability' },
    
    // Development patterns
    { pattern: /api|rest|graphql/gi, name: 'API Integration' },
    { pattern: /authentication|auth|oauth/gi, name: 'Authentication' },
    { pattern: /database|postgres|mysql|mongodb/gi, name: 'Database Operations' },
    { pattern: /testing|unit test|integration test/gi, name: 'Testing' },
    
    // Business patterns
    { pattern: /ecommerce|shop|store/gi, name: 'E-commerce' },
    { pattern: /payment|stripe|paypal/gi, name: 'Payments' },
    { pattern: /crm|customer relationship/gi, name: 'CRM Integration' },
    { pattern: /marketing|email|campaign/gi, name: 'Marketing Automation' },
    
    // Productivity patterns
    { pattern: /automation|workflow/gi, name: 'Workflow Automation' },
    { pattern: /collaboration|team|slack/gi, name: 'Team Collaboration' },
    { pattern: /documentation|docs|wiki/gi, name: 'Documentation' },
    { pattern: /project management|jira|linear/gi, name: 'Project Management' }
  ];
  
  // Scan each server for use cases
  for (const server of servers) {
    const textToSearch = [
      server.name,
      server.description,
      ...(server.tags || []),
      ...(server.useCases || [])
    ].join(' ').toLowerCase();
    
    for (const { pattern, name } of useCasePatterns) {
      if (pattern.test(textToSearch)) {
        if (!useCaseMap.has(name)) {
          useCaseMap.set(name, {
            servers: [],
            categories: new Set(),
            vendors: new Set()
          });
        }
        
        const useCaseData = useCaseMap.get(name)!;
        useCaseData.servers.push(server);
        useCaseData.categories.add(server.vendorCategory || 'Unknown');
        useCaseData.vendors.add(server.vendor);
        
        // Reset regex lastIndex
        pattern.lastIndex = 0;
      }
    }
    
    // Also use explicit use cases from server data
    if (server.useCases && Array.isArray(server.useCases)) {
      for (const useCaseName of server.useCases) {
        const normalizedName = useCaseName.trim();
        if (normalizedName) {
          if (!useCaseMap.has(normalizedName)) {
            useCaseMap.set(normalizedName, {
              servers: [],
              categories: new Set(),
              vendors: new Set()
            });
          }
          
          const useCaseData = useCaseMap.get(normalizedName)!;
          useCaseData.servers.push(server);
          useCaseData.categories.add(server.vendorCategory || 'Unknown');
          useCaseData.vendors.add(server.vendor);
        }
      }
    }
  }
  
  // Convert to array with metrics
  const useCases = Array.from(useCaseMap.entries()).map(([name, data]) => {
    const frequency = data.servers.length;
    const growthRate = 0; // Stub - would need historical data
    const confidence = calculateUseCaseConfidence(data.servers);
    
    return {
      name,
      description: generateUseCaseDescription(name, data.servers),
      frequency,
      growthRate,
      confidence,
      exampleServers: data.servers.slice(0, 3).map(s => s.name),
      primaryCategories: Array.from(data.categories),
      commonVendors: Array.from(data.vendors),
      searchVolumeEstimate: estimateSearchVolume(name),
      competitionLevel: estimateCompetitionLevel(name, frequency),
      contentAngles: generateContentAngles(name, data.servers)
    };
  });
  
  // Sort by frequency (highest first)
  return useCases.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Calculate use case confidence (0-1)
 */
function calculateUseCaseConfidence(servers: Server[]): number {
  if (servers.length === 0) return 0;
  
  let confidence = 0.5; // Base confidence
  
  // More servers increases confidence
  if (servers.length >= 5) confidence += 0.3;
  else if (servers.length >= 3) confidence += 0.2;
  else if (servers.length >= 2) confidence += 0.1;
  
  // High-quality servers increase confidence
  const highQualityServers = servers.filter(s => 
    (s.githubStars || 0) >= 100 || s.status === 'approved'
  );
  
  if (highQualityServers.length > 0) {
    confidence += Math.min(0.2, highQualityServers.length * 0.05);
  }
  
  // Diverse vendors increase confidence
  const uniqueVendors = new Set(servers.map(s => s.vendor)).size;
  if (uniqueVendors >= 3) confidence += 0.1;
  else if (uniqueVendors >= 2) confidence += 0.05;
  
  return Math.min(confidence, 1.0);
}

/**
 * Generate use case description
 */
function generateUseCaseDescription(name: string, servers: Server[]): string {
  const serverCount = servers.length;
  const vendorCount = new Set(servers.map(s => s.vendor)).size;
  const categoryCount = new Set(servers.map(s => s.vendorCategory)).size;
  
  return `${name} use case supported by ${serverCount} MCP servers from ${vendorCount} vendors across ${categoryCount} categories.`;
}
/**
 * Estimate search volume
 */
function estimateSearchVolume(useCaseName: string): number {
  // Simple estimation based on use case type
  const volumeMap: Record<string, number> = {
    // High volume
    'AI/ML Integration': 10000,
    'API Integration': 8000,
    'Cloud Integration': 7000,
    'Database Operations': 6000,
    'Authentication': 5000,
    
    // Medium volume
    'Data Analysis': 4000,
    'Workflow Automation': 3500,
    'Monitoring & Observability': 3000,
    'E-commerce': 2500,
    'Payments': 2000,
    
    // Low volume
    'Natural Language Processing': 1500,
    'Computer Vision': 1200,
    'ETL Processing': 1000,
    'Serverless Computing': 800,
    'Containerization': 600
  };
  
  return volumeMap[useCaseName] || 500; // Default
}

/**
 * Estimate competition level
 */
function estimateCompetitionLevel(useCaseName: string, frequency: number): VendorPriority {
  // High competition for common use cases with many servers
  if (frequency >= 5) {
    return 'high';
  }
  
  // Medium competition for moderately common use cases
  if (frequency >= 3) {
    return 'medium';
  }
  
  // Low competition for niche use cases
  return 'low';
}

/**
 * Generate content angles
 */
function generateContentAngles(useCaseName: string, servers: Server[]): string[] {
  const angles: string[] = [];
  
  // General angles
  angles.push(`How to use MCP for ${useCaseName}`);
  angles.push(`Best practices for ${useCaseName} with MCP`);
  
  // Specific angles based on server count
  if (servers.length >= 3) {
    angles.push(`Comparing top MCP servers for ${useCaseName}`);
  }
  
  if (servers.some(s => s.isNiche)) {
    angles.push(`Hidden gem MCP servers for ${useCaseName}`);
  }
  
  // Tutorial angles
  angles.push(`Step-by-step tutorial: ${useCaseName} implementation with MCP`);
  angles.push(`Common pitfalls in ${useCaseName} and how to avoid them`);
  
  // Case study angles
  angles.push(`Case study: Real-world ${useCaseName} implementation`);
  angles.push(`How Company X improved their ${useCaseName} with MCP`);
  
  return angles.slice(0, 5); // Return top 5 angles
}

/**
 * Generate content topics
 */
function generateContentTopics(useCases: any[], servers: Server[]): Array<{
  title: string;
  useCase: string;
  relevanceScore: number;
  demandScore: number;
  uniquenessScore: number;
  targetKeywords: string[];
  estimatedWordCount: number;
  suggestedFormat: ContentFormat;
  priority: VendorPriority;
}> {
  const topics: Array<{
    title: string;
    useCase: string;
    relevanceScore: number;
    demandScore: number;
    uniquenessScore: number;
    targetKeywords: string[];
    estimatedWordCount: number;
    suggestedFormat: ContentFormat;
    priority: VendorPriority;
  }> = [];
  
  // Generate topics for top use cases
  const topUseCases = useCases.slice(0, 10); // Top 10 use cases
  
  for (const useCase of topUseCases) {
    // Calculate scores
    const relevanceScore = calculateRelevanceScore(useCase, servers);
    const demandScore = calculateDemandScore(useCase);
    const uniquenessScore = calculateUniquenessScore(useCase, topics);
    
    // Determine format based on use case characteristics
    const suggestedFormat = determineContentFormat(useCase);
    
    // Determine priority
    const priority = determineTopicPriority(relevanceScore, demandScore, uniquenessScore);
    
    // Generate title
    const title = generateTopicTitle(useCase.name, suggestedFormat);
    
    // Generate target keywords
    const targetKeywords = generateTargetKeywords(useCase.name);
    
    // Estimate word count based on format
    const estimatedWordCount = estimateWordCount(suggestedFormat);
    
    topics.push({
      title,
      useCase: useCase.name,
      relevanceScore,
      demandScore,
      uniquenessScore,
      targetKeywords,
      estimatedWordCount,
      suggestedFormat,
      priority
    });
  }
  
  // Sort by priority score (relevance * demand * uniqueness)
  return topics.sort((a, b) => {
    const scoreA = (a.relevanceScore / 100) * (a.demandScore / 100) * (a.uniquenessScore / 100);
    const scoreB = (b.relevanceScore / 100) * (b.demandScore / 100) * (b.uniquenessScore / 100);
    return scoreB - scoreA;
  });
}

/**
 * Calculate relevance score (0-100)
 */
function calculateRelevanceScore(useCase: any, servers: Server[]): number {
  let score = 0;
  
  // Frequency contribution (max 40 points)
  const maxFrequency = Math.max(...servers.map(s => s.useCases?.length || 0));
  if (maxFrequency > 0) {
    score += Math.min(40, (useCase.frequency / maxFrequency) * 40);
  }
  
  // Confidence contribution (max 30 points)
  score += useCase.confidence * 30;
  
  // Quality contribution (max 30 points)
  const highQualityServers = useCase.exampleServers.filter((serverName: string) => {
    const server = servers.find(s => s.name === serverName);
    return server && ((server.githubStars || 0) >= 100 || server.status === 'approved');
  }).length;
  
  if (useCase.exampleServers.length > 0) {
    score += Math.min(30, (highQualityServers / useCase.exampleServers.length) * 30);
  }
  
  return Math.min(score, 100);
}

/**
 * Calculate demand score (0-100)
 */
function calculateDemandScore(useCase: any): number {
  // Based on search volume estimate
  const maxSearchVolume = 10000; // Maximum expected
  return Math.min(100, (useCase.searchVolumeEstimate / maxSearchVolume) * 100);
}

/**
 * Calculate uniqueness score (0-100)
 */
function calculateUniquenessScore(useCase: any, existingTopics: any[]): number {
  // Check if similar topics already exist
  const similarTopics = existingTopics.filter(topic => 
    topic.useCase === useCase.name || 
    topic.title.toLowerCase().includes(useCase.name.toLowerCase())
  );
  
  if (similarTopics.length === 0) {
    return 100; // Completely unique
  }
  
  // Lower score for duplicate topics
  return Math.max(20, 100 - (similarTopics.length * 20));
}

/**
 * Determine content format
 */
function determineContentFormat(useCase: any): ContentFormat {
  // Tutorial for technical use cases
  const technicalUseCases = ['API Integration', 'Database Operations', 'Authentication', 'Testing'];
  if (technicalUseCases.includes(useCase.name)) {
    return 'tutorial';
  }
  
  // Comparison for use cases with multiple servers
  if (useCase.frequency >= 3) {
    return 'comparison';
  }
  
  // Case study for business use cases
  const businessUseCases = ['E-commerce', 'Payments', 'CRM Integration', 'Marketing Automation'];
  if (businessUseCases.includes(useCase.name)) {
    return 'case-study';
  }
  
  // Default to blog
  return 'blog';
}

/**
 * Determine topic priority
 */
function determineTopicPriority(relevance: number, demand: number, uniqueness: number): VendorPriority {
  const overallScore = (relevance + demand + uniqueness) / 3;
  
  if (overallScore >= 80) return 'high';
  if (overallScore >= 60) return 'medium';
  if (overallScore >= 40) return 'low';
  return 'low';
}

/**
 * Generate topic title
 */
function generateTopicTitle(useCaseName: string, format: ContentFormat): string {
  const formatTitles: Record<ContentFormat, string> = {
    'blog': `The Complete Guide to ${useCaseName} with MCP`,
    'tutorial': `Step-by-Step: Implementing ${useCaseName} with MCP`,
    'comparison': `Top MCP Servers for ${useCaseName}: A Comprehensive Comparison`,
    'case-study': `How We Used MCP to Revolutionize Our ${useCaseName} Process`
  };
  
  return formatTitles[format] || `Exploring ${useCaseName} with MCP`;
}

/**
 * Generate target keywords
 */
function generateTargetKeywords(useCaseName: string): string[] {
  return [
    `${useCaseName} MCP`,
    `MCP ${useCaseName}`,
    `Model Context Protocol ${useCaseName}`,
    `${useCaseName} integration`,
    `${useCaseName} tools`
  ];
}

/**
 * Estimate word count
 */
function estimateWordCount(format: ContentFormat): number {
  const wordCounts: Record<ContentFormat, number> = {
    'blog': 1500,
    'tutorial': 2000,
    'comparison': 2500,
    'case-study': 1800
  };
  
  return wordCounts[format] || 1500;
}
/**
 * Identify use case trends
 */
function identifyUseCaseTrends(useCases: any[]): {
  topUseCases: string[];
  decliningUseCases: string[];
  crossCategoryPatterns: string[];
  innovationAreas: string[];
} {
  // Top use cases (by frequency)
  const topUseCases = useCases
    .slice(0, 10)
    .map(uc => uc.name);
  
  // Declining use cases (stub - would need historical data)
  const decliningUseCases: string[] = [];
  
  // Cross-category patterns
  const crossCategoryPatterns = identifyCrossCategoryPatterns(useCases);
  
  // Innovation areas (use cases with high confidence but low frequency)
  const innovationAreas = useCases
    .filter(uc => uc.confidence >= 0.7 && uc.frequency <= 2)
    .slice(0, 5)
    .map(uc => uc.name);
  
  return {
    topUseCases,
    decliningUseCases,
    crossCategoryPatterns,
    innovationAreas
  };
}

/**
 * Identify cross-category patterns
 */
function identifyCrossCategoryPatterns(useCases: any[]): string[] {
  const patterns: string[] = [];
  
  // Look for use cases that appear in multiple categories
  const crossCategoryUseCases = useCases.filter(uc => 
    uc.primaryCategories && uc.primaryCategories.length >= 2
  );
  
  for (const useCase of crossCategoryUseCases.slice(0, 5)) {
    patterns.push(`${useCase.name} (across ${useCase.primaryCategories.join(', ')})`);
  }
  
  // Look for vendor patterns
  const multiVendorUseCases = useCases.filter(uc =>
    uc.commonVendors && uc.commonVendors.length >= 3
  );
  
  for (const useCase of multiVendorUseCases.slice(0, 3)) {
    patterns.push(`${useCase.name} supported by ${useCase.commonVendors.length} vendors`);
  }
  
  return patterns;
}

export default {
  runEmergingUseCaseDetection,
  detectUseCases,
  generateContentTopics,
  identifyUseCaseTrends
};
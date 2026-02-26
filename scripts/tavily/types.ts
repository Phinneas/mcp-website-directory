/**
 * Core TypeScript interfaces for the MCP Intelligence System
 */

// Server status types
export type ServerStatus = 'pending' | 'approved' | 'rejected';
export type VendorPriority = 'low' | 'medium' | 'high';
export type UseCaseTrend = 'declining' | 'stable' | 'growing' | 'exploding';
export type ContentFormat = 'blog' | 'tutorial' | 'comparison' | 'case-study';
export type CategoryHealthAction = 'expand' | 'maintain' | 'consolidate';
export type InsightType = 'opportunity' | 'risk' | 'trend';

// Core Server interface
export interface Server {
  // Identification
  id: string;                    // UUID v4
  name: string;                  // Server name
  vendor: string;                // Vendor name
  vendorCategory: string;        // AI/ML, Database, etc.
  
  // Discovery Information
  discoveryDate: string;         // ISO 8601 date
  discoverySource: string;       // 'tavily', 'manual', 'competitor'
  searchQuery: string;           // Original search query
  confidenceScore: number;       // 0-1 confidence in discovery
  
  // Technical Details
  githubUrl?: string;            // GitHub repository URL
  documentationUrl?: string;     // Official documentation
  npmPackage?: string;           // NPM package name
  version?: string;              // Current version
  
  // Metadata
  description: string;           // Brief description
  tags: string[];                // Categorization tags
  useCases: string[];            // Primary use cases
  
  // Engagement Metrics
  githubStars?: number;          // GitHub star count
  lastCommitDate?: string;       // Last commit date
  issueCount?: number;           // Open issues
  pullRequestCount?: number;     // Open PRs
  
  // Niche Detection
  isNiche?: boolean;             // Flag for niche server
  nicheConfidence?: number;      // 0-1 confidence in niche classification
  nicheRationale?: string;       // Why it's considered niche
  
  // Review Status
  status: ServerStatus;
  reviewDate?: string;           // When reviewed
  reviewer?: string;             // Who reviewed
  rejectionReason?: string;      // If rejected
  
  // Timestamps
  createdAt: string;             // When added to system
  updatedAt: string;             // Last update
}

// Vendor interface
export interface Vendor {
  name: string;                  // Vendor name
  category: string;              // Primary category
  searchTerms: string[];         // Search queries
  priority: VendorPriority;
  notes?: string;                // Additional context
  
  // Tracking
  firstSeen: string;             // First discovery date
  lastSeen: string;              // Last discovery date
  serverCount: number;           // Total servers discovered
  active: boolean;               // Currently active
  
  // Performance Metrics
  discoveryRate: number;         // Servers per month
  approvalRate: number;          // Approval percentage
  nicheScore?: number;           // Niche detection score
}

// Monthly Report interface
export interface MonthlyReport {
  // Report Metadata
  reportId: string;              // UUID v4
  reportDate: string;            // Month being reported (YYYY-MM)
  generatedAt: string;           // Generation timestamp
  period: {                      // Date range
    start: string;               // Start date (inclusive)
    end: string;                 // End date (exclusive)
  };
  
  // Executive Summary
  summary: {
    totalServersDiscovered: number;
    newVendors: number;
    approvalRate: number;
    keyInsights: string[];
    recommendations: string[];
  };
  
  // Analysis Results
  gapAnalysis: GapAnalysisResult;
  categoryHealth: CategoryHealthResult;
  vendorMomentum: VendorMomentumResult;
  emergingUseCases: EmergingUseCaseResult;
  
  // Raw Data References
  dataSources: {
    newServersFile: string;      // Path to new servers data
    seenServersFile: string;     // Path to seen servers
    vendorWatchlist: string;     // Path to watchlist
  };
  
  // Performance Metrics
  metrics: {
    scanDuration: number;        // Milliseconds
    apiCalls: number;            // Tavily API calls
    errorCount: number;          // Processing errors
    successRate: number;         // 0-1 success rate
  };
}

// Gap Analysis Result
export interface GapAnalysisResult {
  competitorCount: number;       // Number of competitors analyzed
  totalGaps: number;             // Total missing servers
  
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
  
  recommendations: Array<{
    priority: number;            // 1-10 priority score
    action: string;              // Recommended action
    expectedImpact: string;      // Expected outcome
    effortEstimate: VendorPriority;
  }>;
}

// Category Health Result
export interface CategoryHealthResult {
  categories: Array<{
    name: string;
    serverCount: number;
    growthRate: number;          // Monthly growth percentage
    healthScore: number;         // 0-100 health score
    
    // Distribution Metrics
    percentageOfTotal: number;   // Percentage of all servers
    idealPercentage: number;     // Target percentage
    deviation: number;           // Deviation from ideal
    
    // Quality Metrics
    averageStars: number;        // Average GitHub stars
    approvalRate: number;        // Human approval rate
    nicheScore: number;          // Niche detection score
  }>;
  
  overallHealth: {
    score: number;               // Overall health score
    status: 'poor' | 'fair' | 'good' | 'excellent';
    strengths: string[];
    weaknesses: string[];
  };
  
  recommendations: Array<{
    category: string;
    action: CategoryHealthAction;
    rationale: string;
    priority: number;
  }>;
}

// Vendor Momentum Result
export interface VendorMomentumResult {
  vendors: Array<{
    name: string;
    category: string;
    
    // Activity Metrics
    totalServers: number;
    newThisMonth: number;
    growthRate: number;          // Monthly growth percentage
    
    // Momentum Scores
    activityScore: number;       // 0-100 based on recent activity
    momentumScore: number;       // 0-100 trend-based score
    trend: UseCaseTrend;
    
    // Historical Context
    firstServerDate: string;
    lastServerDate: string;
    averageReleaseInterval: number;  // Days between releases
  }>;
  
  trends: {
    topGrowingVendors: string[];
    topDecliningVendors: string[];
    emergingVendors: string[];   // New vendors with potential
    churnedVendors: string[];    // Vendors that stopped releasing
  };
  
  insights: Array<{
    type: InsightType;
    description: string;
    impact: VendorPriority;
    evidence: string[];
  }>;
}

// Emerging Use Case Result
export interface EmergingUseCaseResult {
  useCases: Array<{
    name: string;
    description: string;
    
    // Detection Metrics
    frequency: number;           // Occurrences this month
    growthRate: number;          // Month-over-month growth
    confidence: number;          // 0-1 confidence score
    
    // Server Associations
    exampleServers: string[];
    primaryCategories: string[];
    commonVendors: string[];
    
    // Content Potential
    searchVolumeEstimate: number;
    competitionLevel: VendorPriority;
    contentAngles: string[];
  }>;
  
  contentTopics: Array<{
    title: string;
    useCase: string;
    
    // Content Metrics
    relevanceScore: number;      // 0-100 relevance to audience
    demandScore: number;         // 0-100 estimated demand
    uniquenessScore: number;     // 0-100 content gap
    
    // Practical Details
    targetKeywords: string[];
    estimatedWordCount: number;
    suggestedFormat: ContentFormat;
    
    // Integration
    editorialCalendarSlot?: string;
    priority: VendorPriority;
  }>;
  
  trends: {
    topUseCases: string[];
    decliningUseCases: string[];
    crossCategoryPatterns: string[];
    innovationAreas: string[];   // Areas with high innovation
  };
}

// Error types
export interface ValidationError extends Error {
  code: 'VALIDATION_ERROR';
  details: Record<string, string>;
}

export interface ApiError extends Error {
  code: 'API_ERROR';
  statusCode?: number;
  retryable: boolean;
}

export interface StorageError extends Error {
  code: 'STORAGE_ERROR';
  operation: 'read' | 'write' | 'delete';
  path: string;
}

// Configuration interfaces
export interface TavilyConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface SystemConfig {
  dataDir: string;
  newServersDir: string;
  monthlyReportsDir: string;
  seenServersFile: string;
  vendorWatchlistFile: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Utility types
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

// Validation schemas (to be implemented with AJV)
export interface ValidationSchema {
  server: object;
  vendor: object;
  monthlyReport: object;
  vendorWatchlist: object;
}
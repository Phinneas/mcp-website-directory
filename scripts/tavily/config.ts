/**
 * Configuration module for MCP Intelligence System
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { SystemConfig, TavilyConfig, Vendor } from './types.js';

// Default configuration
const DEFAULT_CONFIG: SystemConfig = {
  dataDir: 'data',
  newServersDir: 'data/new-servers',
  monthlyReportsDir: 'data/monthly-reports',
  seenServersFile: 'data/seen-servers.json',
  vendorWatchlistFile: 'scripts/tavily/vendor-watchlist.json',
  logLevel: 'info'
};

// Configuration manager class
export class ConfigManager {
  private systemConfig: SystemConfig;
  private tavilyConfig: TavilyConfig | null = null;
  private vendorWatchlist: Vendor[] | null = null;

  constructor(customConfig?: Partial<SystemConfig>) {
    this.systemConfig = { ...DEFAULT_CONFIG, ...customConfig };
  }

  /**
   * Get system configuration
   */
  getSystemConfig(): SystemConfig {
    return { ...this.systemConfig };
  }

  /**
   * Get Tavily configuration from environment variables
   */
  getTavilyConfig(): TavilyConfig {
    if (!this.tavilyConfig) {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        throw new Error('TAVILY_API_KEY environment variable is required');
      }

      this.tavilyConfig = {
        apiKey,
        baseUrl: process.env.TAVILY_BASE_URL || 'https://api.tavily.com',
        timeout: parseInt(process.env.TAVILY_TIMEOUT || '30000'),
        maxRetries: parseInt(process.env.TAVILY_MAX_RETRIES || '3')
      };
    }

    return this.tavilyConfig;
  }

  /**
   * Load vendor watchlist from JSON file
   */
  loadVendorWatchlist(): Vendor[] {
    if (this.vendorWatchlist) {
      return this.vendorWatchlist;
    }

    try {
      const watchlistPath = join(process.cwd(), this.systemConfig.vendorWatchlistFile);
      const data = readFileSync(watchlistPath, 'utf-8');
      const parsed = JSON.parse(data);

      // Validate structure
      if (!parsed.vendors || !Array.isArray(parsed.vendors)) {
        throw new Error('Invalid vendor watchlist format: missing vendors array');
      }

      // Transform to Vendor objects with defaults
      this.vendorWatchlist = parsed.vendors.map((vendor: any) => ({
        name: vendor.name,
        category: vendor.category || 'Unknown',
        searchTerms: vendor.searchTerms || [],
        priority: vendor.priority || 'medium',
        notes: vendor.notes,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        serverCount: 0,
        active: true,
        discoveryRate: 0,
        approvalRate: 0
      }));

      return this.vendorWatchlist;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load vendor watchlist: ${error.message}`);
      }
      throw new Error('Failed to load vendor watchlist: Unknown error');
    }
  }

  /**
   * Get vendors by priority
   */
  getVendorsByPriority(priority: 'low' | 'medium' | 'high'): Vendor[] {
    const watchlist = this.loadVendorWatchlist();
    return watchlist.filter(vendor => vendor.priority === priority);
  }

  /**
   * Get vendors by category
   */
  getVendorsByCategory(category: string): Vendor[] {
    const watchlist = this.loadVendorWatchlist();
    return watchlist.filter(vendor => vendor.category === category);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    try {
      const watchlistPath = join(process.cwd(), this.systemConfig.vendorWatchlistFile);
      const data = readFileSync(watchlistPath, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.categories || [];
    } catch (error) {
      console.warn('Could not load categories from watchlist, using default');
      return ['AI / ML', 'Database', 'Cloud Services', 'Development Tools', 'Productivity', 'Communication'];
    }
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check Tavily API key
    if (!process.env.TAVILY_API_KEY) {
      errors.push('TAVILY_API_KEY environment variable is not set');
    }

    // Check data directories
    const requiredDirs = [
      this.systemConfig.dataDir,
      this.systemConfig.newServersDir,
      this.systemConfig.monthlyReportsDir
    ];

    for (const dir of requiredDirs) {
      try {
        // Check if directory exists or can be created
        // This is a basic check - actual directory creation happens elsewhere
      } catch (error) {
        errors.push(`Cannot access directory: ${dir}`);
      }
    }

    // Check vendor watchlist file
    try {
      this.loadVendorWatchlist();
    } catch (error) {
      errors.push(`Failed to load vendor watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get search query templates for a vendor
   */
  getSearchQueriesForVendor(vendor: Vendor): string[] {
    const templates = [
      `"${vendor.name} MCP server"`,
      `"${vendor.name} Model Context Protocol"`,
      `"${vendor.name} MCP integration"`,
      `official ${vendor.name} MCP server`
    ];

    // Add vendor-specific search terms
    if (vendor.searchTerms && vendor.searchTerms.length > 0) {
      return [...vendor.searchTerms, ...templates];
    }

    return templates;
  }

  /**
   * Get batch size for API calls based on priority
   */
  getBatchSize(priority: 'low' | 'medium' | 'high'): number {
    switch (priority) {
      case 'high':
        return 5; // Process high priority vendors in smaller batches for faster results
      case 'medium':
        return 10;
      case 'low':
        return 15;
      default:
        return 10;
    }
  }

  /**
   * Get delay between API calls (in ms) to avoid rate limiting
   */
  getApiDelay(): number {
    return parseInt(process.env.API_DELAY_MS || '1000');
  }
}

// Singleton instance
let configManager: ConfigManager | null = null;

/**
 * Get or create configuration manager instance
 */
export function getConfigManager(customConfig?: Partial<SystemConfig>): ConfigManager {
  if (!configManager) {
    configManager = new ConfigManager(customConfig);
  }
  return configManager;
}

/**
 * Reset configuration manager (for testing)
 */
export function resetConfigManager(): void {
  configManager = null;
}
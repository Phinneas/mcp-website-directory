/**
 * Tavily API client for MCP Intelligence System
 */

import { TavilyConfig, ApiError } from './types.js';
import { logWithTimestamp, retryWithBackoff, sleep } from './utils.js';

// Tavily API response types
interface TavilySearchResult {
  query: string;
  answer?: string;
  response_time: number;
  images: string[];
  results: TavilySearchItem[];
  follow_up_questions?: string[];
}

interface TavilySearchItem {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
  published_date?: string;
}

interface TavilySearchParams {
  query: string;
  search_depth?: 'basic' | 'advanced';
  include_answer?: boolean;
  include_images?: boolean;
  include_raw_content?: boolean;
  max_results?: number;
  include_domains?: string[];
  exclude_domains?: string[];
  time_range?: 'day' | 'week' | 'month' | 'year' | 'past_hour' | 'past_24_hours' | 'past_week' | 'past_month' | 'past_year';
}

/**
 * Tavily API client class
 */
export class TavilyClient {
  private config: TavilyConfig;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor(config: TavilyConfig) {
    this.config = {
      baseUrl: 'https://api.tavily.com',
      timeout: 30000,
      maxRetries: 3,
      ...config
    };
  }

  /**
   * Search using Tavily API
   */
  async search(params: TavilySearchParams): Promise<TavilySearchResult> {
    const operation = async () => {
      await this.rateLimit();
      
      const url = `${this.config.baseUrl}/search`;
      const requestBody = {
        api_key: this.config.apiKey,
        query: params.query,
        search_depth: params.search_depth || 'basic',
        include_answer: params.include_answer || false,
        include_images: params.include_images || false,
        include_raw_content: params.include_raw_content || false,
        max_results: params.max_results || 10,
        include_domains: params.include_domains || [],
        exclude_domains: params.exclude_domains || [],
        time_range: params.time_range || 'week'
      };

      logWithTimestamp(`Searching Tavily: ${params.query}`, 'info');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new ApiError(`Tavily API error: ${response.status} ${errorText}`, {
            statusCode: response.status,
            retryable: response.status === 429 || response.status >= 500
          });
        }

        const data = await response.json() as TavilySearchResult;
        
        this.requestCount++;
        this.lastRequestTime = Date.now();
        
        logWithTimestamp(`Tavily search completed: ${params.query} (${data.response_time}ms, ${data.results.length} results)`, 'info');
        
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof ApiError) {
          throw error;
        }
        
        throw new ApiError(`Tavily search failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          retryable: true
        });
      }
    };

    return retryWithBackoff(operation, this.config.maxRetries);
  }

  /**
   * Search for MCP servers by vendor
   */
  async searchForMcpServers(vendorName: string, searchTerms: string[]): Promise<TavilySearchResult[]> {
    const results: TavilySearchResult[] = [];
    
    for (const term of searchTerms) {
      try {
        const query = `${vendorName} ${term}`;
        const result = await this.search({
          query,
          search_depth: 'advanced',
          include_answer: false,
          include_images: false,
          include_raw_content: false,
          max_results: 10,
          time_range: 'week',
          include_domains: ['github.com', 'dev.to', 'medium.com', '*.company.com'],
          exclude_domains: ['twitter.com', 'x.com', 'linkedin.com']
        });
        
        results.push(result);
        
        // Small delay between searches to avoid rate limiting
        await sleep(1000);
      } catch (error) {
        logWithTimestamp(`Failed to search for ${vendorName} with term "${term}": ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        // Continue with next search term
      }
    }
    
    return results;
  }

  /**
   * Extract MCP server information from search results
   */
  extractMcpServersFromResults(results: TavilySearchResult[], vendor: string): Array<{
    title: string;
    url: string;
    content: string;
    confidence: number;
    publishedDate?: string;
  }> {
    const mcpServers: Array<{
      title: string;
      url: string;
      content: string;
      confidence: number;
      publishedDate?: string;
    }> = [];

    const mcpKeywords = [
      'MCP server',
      'Model Context Protocol',
      'MCP integration',
      'MCP tool',
      'MCP plugin',
      'MCP extension'
    ];

    for (const result of results) {
      for (const item of result.results) {
        // Check if result contains MCP keywords
        const hasMcpKeyword = mcpKeywords.some(keyword => 
          item.title.toLowerCase().includes(keyword.toLowerCase()) ||
          item.content.toLowerCase().includes(keyword.toLowerCase())
        );

        if (hasMcpKeyword) {
          // Calculate confidence score based on various factors
          let confidence = 0.5;
          
          // Title contains MCP
          if (item.title.toLowerCase().includes('mcp')) {
            confidence += 0.2;
          }
          
          // Content contains MCP
          if (item.content.toLowerCase().includes('mcp')) {
            confidence += 0.1;
          }
          
          // GitHub URL (high confidence for MCP servers)
          if (item.url.includes('github.com')) {
            confidence += 0.2;
          }
          
          // Recent publication
          if (item.published_date) {
            const published = new Date(item.published_date);
            const now = new Date();
            const daysSince = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysSince < 7) {
              confidence += 0.1;
            }
          }
          
          // Vendor name in title or content
          if (item.title.toLowerCase().includes(vendor.toLowerCase()) ||
              item.content.toLowerCase().includes(vendor.toLowerCase())) {
            confidence += 0.1;
          }
          
          mcpServers.push({
            title: item.title,
            url: item.url,
            content: item.content,
            confidence: Math.min(confidence, 1.0),
            publishedDate: item.published_date
          });
        }
      }
    }

    // Sort by confidence (highest first)
    return mcpServers.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Rate limiting to avoid hitting API limits
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Minimum 1 second between requests
    if (timeSinceLastRequest < 1000) {
      const delay = 1000 - timeSinceLastRequest;
      await sleep(delay);
    }
    
    // Reset counter every minute
    if (now - this.lastRequestTime > 60000) {
      this.requestCount = 0;
    }
    
    // Limit to 50 requests per minute (Tavily free tier limit)
    if (this.requestCount >= 50) {
      const waitTime = 60000 - (now - this.lastRequestTime);
      if (waitTime > 0) {
        logWithTimestamp(`Rate limit reached, waiting ${Math.ceil(waitTime / 1000)} seconds`, 'warn');
        await sleep(waitTime);
        this.requestCount = 0;
      }
    }
  }

  /**
   * Queue a search request for batch processing
   */
  queueSearch(params: TavilySearchParams): Promise<TavilySearchResult> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await this.search(params);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  /**
   * Process the request queue with concurrency control
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    try {
      // Process up to 3 concurrent requests
      const concurrentLimit = 3;
      const batches = [];
      
      while (this.requestQueue.length > 0) {
        const batch = this.requestQueue.splice(0, concurrentLimit);
        batches.push(batch);
      }
      
      for (const batch of batches) {
        await Promise.all(batch.map(operation => operation()));
        // Wait between batches to avoid rate limiting
        await sleep(2000);
      }
    } finally {
      this.isProcessingQueue = false;
      
      // Check if more items were added while processing
      if (this.requestQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  /**
   * Get API usage statistics
   */
  getStats(): {
    requestCount: number;
    lastRequestTime: number;
    queueLength: number;
    isProcessingQueue: boolean;
  } {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      queueLength: this.requestQueue.length,
      isProcessingQueue: this.isProcessingQueue
    };
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.search({
        query: 'test',
        max_results: 1,
        time_range: 'week'
      });
      
      return result.results.length >= 0; // Just check if we got a response
    } catch (error) {
      logWithTimestamp(`API connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      return false;
    }
  }
}

/**
 * Create Tavily client instance
 */
export function createTavilyClient(config: TavilyConfig): TavilyClient {
  return new TavilyClient(config);
}
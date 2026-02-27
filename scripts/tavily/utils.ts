/**
 * Utility functions for MCP Intelligence System
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { ValidationError, ApiError, StorageError, Server } from './types.js';

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validate ISO 8601 date string
 */
export function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date.toISOString() === dateString;
  } catch {
    return false;
  }
}

/**
 * Ensure directory exists, create if it doesn't
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Write JSON file with pretty formatting and backup
 */
export function writeJsonFile(filePath: string, data: any, backup = true): void {
  try {
    ensureDirectoryExists(dirname(filePath));
    
    // Create backup if file exists and backup is enabled
    if (backup && existsSync(filePath)) {
      const backupPath = `${filePath}.backup`;
      const existingData = readFileSync(filePath, 'utf-8');
      writeFileSync(backupPath, existingData, 'utf-8');
    }
    
    // Write new data
    const jsonString = JSON.stringify(data, null, 2);
    writeFileSync(filePath, jsonString, 'utf-8');
  } catch (error) {
    throw new StorageError(
      `Failed to write JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        operation: 'write',
        path: filePath
      }
    );
  }
}

/**
 * Read JSON file with error handling
 */
export function readJsonFile<T>(filePath: string): T {
  try {
    if (!existsSync(filePath)) {
      return {} as T;
    }
    
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    throw new StorageError(
      `Failed to read JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        operation: 'read',
        path: filePath
      }
    );
  }
}

/**
 * Validate server object against schema
 */
export function validateServerSchema(server: any): server is Server {
  const errors: Record<string, string> = {};

  // Required fields
  const requiredFields = ['id', 'name', 'vendor', 'discoveryDate', 'status'];
  for (const field of requiredFields) {
    if (!server[field]) {
      errors[field] = 'Field is required';
    }
  }

  // Field type validation
  if (server.id && typeof server.id !== 'string') {
    errors.id = 'Must be a string';
  }

  if (server.name && typeof server.name !== 'string') {
    errors.name = 'Must be a string';
  }

  if (server.vendor && typeof server.vendor !== 'string') {
    errors.vendor = 'Must be a string';
  }

  if (server.discoveryDate && !isValidISODate(server.discoveryDate)) {
    errors.discoveryDate = 'Must be valid ISO 8601 date';
  }

  if (server.confidenceScore !== undefined) {
    const score = parseFloat(server.confidenceScore);
    if (isNaN(score) || score < 0 || score > 1) {
      errors.confidenceScore = 'Must be a number between 0 and 1';
    }
  }

  if (server.githubStars !== undefined) {
    const stars = parseInt(server.githubStars);
    if (isNaN(stars) || stars < 0) {
      errors.githubStars = 'Must be a non-negative integer';
    }
  }

  // Status validation
  const validStatuses = ['pending', 'approved', 'rejected'];
  if (server.status && !validStatuses.includes(server.status)) {
    errors.status = `Must be one of: ${validStatuses.join(', ')}`;
  }

  // Array field validation
  if (server.tags && !Array.isArray(server.tags)) {
    errors.tags = 'Must be an array';
  }

  if (server.useCases && !Array.isArray(server.useCases)) {
    errors.useCases = 'Must be an array';
  }

  // URL validation
  if (server.githubUrl && !isValidUrl(server.githubUrl)) {
    errors.githubUrl = 'Must be a valid URL';
  }

  if (server.documentationUrl && !isValidUrl(server.documentationUrl)) {
    errors.documentationUrl = 'Must be a valid URL';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Server validation failed', errors);
  }

  return true;
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate confidence score for server discovery
 */
export function calculateConfidenceScore(server: Partial<Server>): number {
  let score = 0.5; // Base score

  // GitHub URL adds confidence
  if (server.githubUrl && isValidUrl(server.githubUrl)) {
    score += 0.2;
  }

  // Documentation URL adds confidence
  if (server.documentationUrl && isValidUrl(server.documentationUrl)) {
    score += 0.1;
  }

  // Description adds confidence
  if (server.description && server.description.length > 20) {
    score += 0.1;
  }

  // Tags add confidence
  if (server.tags && server.tags.length > 0) {
    score += 0.05;
  }

  // Use cases add confidence
  if (server.useCases && server.useCases.length > 0) {
    score += 0.05;
  }

  // Cap at 1.0
  return Math.min(score, 1.0);
}

/**
 * Log with timestamp and level
 */
export function logWithTimestamp(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  const logLevel = level.toUpperCase().padEnd(5);
  console.log(`[${timestamp}] ${logLevel} ${message}`);
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logWithTimestamp(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay`, 'warn');
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new ApiError(`Operation failed after ${maxRetries} retries: ${lastError!.message}`, {
    retryable: false
  });
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com') {
      return null;
    }

    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      return null;
    }

    const owner = pathParts[0];
    const repo = pathParts[1];
    
    if (!owner || !repo) {
      return null;
    }

    return { owner, repo };
  } catch {
    return null;
  }
}

/**
 * Generate search query from vendor and template
 */
export function generateSearchQuery(vendorName: string, template: string): string {
  return template.replace(/{vendor}/g, vendorName);
}

/**
 * Calculate niche score for a server
 */
export function calculateNicheScore(server: Server): number {
  let score = 0;

  // Low GitHub stars indicates niche
  if (server.githubStars !== undefined && server.githubStars < 100) {
    score += 0.3;
  } else if (server.githubStars !== undefined && server.githubStars < 1000) {
    score += 0.1;
  }

  // Recent activity indicates active niche
  if (server.lastCommitDate) {
    const lastCommit = new Date(server.lastCommitDate);
    const now = new Date();
    const daysSinceCommit = (now.getTime() - lastCommit.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCommit < 30) {
      score += 0.2;
    } else if (daysSinceCommit < 90) {
      score += 0.1;
    }
  }

  // Unique tags or use cases indicate niche
  if (server.tags && server.tags.some(tag => 
    tag.toLowerCase().includes('niche') || 
    tag.toLowerCase().includes('specialized')
  )) {
    score += 0.2;
  }

  // Specific use cases indicate niche
  if (server.useCases && server.useCases.length > 0) {
    score += 0.1;
  }

  // Vendor not in top tier indicates niche
  const topVendors = ['OpenAI', 'Anthropic', 'Google', 'Microsoft', 'Amazon'];
  if (!topVendors.includes(server.vendor)) {
    score += 0.2;
  }

  return Math.min(score, 1.0);
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Get date range for weekly scan (past 7 days)
 */
export function getWeeklyDateRange(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return { start, end };
}

/**
 * Get date range for monthly report (past 30 days)
 */
export function getMonthlyDateRange(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { start, end };
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Batch process array with concurrency limit
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency = 5
): Promise<R[]> {
  const results: R[] = [];
  const queue = [...items];
  
  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) {
        try {
          const result = await processor(item);
          results.push(result);
        } catch (error) {
          logWithTimestamp(`Failed to process item: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
      }
    }
  }
  
  // Start workers
  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.all(workers);
  
  return results;
}

/**
 * Generate filename with timestamp
 */
export function generateTimestampedFilename(prefix: string, extension = 'json'): string {
  const now = new Date();
  const dateStr = formatDate(now);
  const iso = now.toISOString();
  const timePart = iso.split('T')[1];
  const timeStr = timePart ? timePart.replace(/[:.]/g, '-').slice(0, 8) : '00-00-00';
  return `${prefix}-${dateStr}-${timeStr}.${extension}`;
}
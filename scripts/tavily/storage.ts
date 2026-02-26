/**
 * Storage module for MCP Intelligence System
 * Manages seen servers database and file operations
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { Server, StorageError } from './types.js';
import { ensureDirectoryExists, writeJsonFile, readJsonFile, generateUUID, isValidISODate, validateServerSchema } from './utils.js';
import { getConfigManager } from './config.js';

// Seen servers database structure
interface SeenServersDatabase {
  version: string;
  lastUpdated: string;
  servers: Record<string, Server>;
  stats: {
    totalServers: number;
    uniqueVendors: number;
    approvalRate: number;
    lastScanDate: string;
  };
}

// New servers file structure
interface NewServersFile {
  scanDate: string;
  queryCount: number;
  newServers: Server[];
  alreadyKnown: number;
  falsePositivesFiltered: number;
  stats: {
    totalVendorsSearched: number;
    apiCalls: number;
    processingTime: number;
    errorCount: number;
  };
}

/**
 * Storage manager class
 */
export class StorageManager {
  private config = getConfigManager();
  private seenServers: SeenServersDatabase | null = null;

  /**
   * Initialize storage system
   */
  async initialize(): Promise<void> {
    ensureDirectoryExists(this.config.getSystemConfig().dataDir);
    ensureDirectoryExists(this.config.getSystemConfig().newServersDir);
    ensureDirectoryExists(this.config.getSystemConfig().monthlyReportsDir);
    
    // Initialize seen servers database if it doesn't exist
    await this.loadSeenServers();
  }

  /**
   * Load seen servers database
   */
  async loadSeenServers(): Promise<SeenServersDatabase> {
    if (this.seenServers) {
      return this.seenServers;
    }

    const filePath = this.config.getSystemConfig().seenServersFile;
    
    try {
      if (existsSync(filePath)) {
        this.seenServers = readJsonFile<SeenServersDatabase>(filePath);
        
        // Validate structure
        if (!this.seenServers.version || !this.seenServers.servers) {
          throw new Error('Invalid seen servers database structure');
        }
      } else {
        // Create new database
        this.seenServers = {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          servers: {},
          stats: {
            totalServers: 0,
            uniqueVendors: 0,
            approvalRate: 0,
            lastScanDate: new Date().toISOString()
          }
        };
        
        await this.saveSeenServers();
      }
      
      return this.seenServers;
    } catch (error) {
      throw new StorageError(
        `Failed to load seen servers database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          code: 'STORAGE_ERROR',
          operation: 'read',
          path: filePath
        }
      );
    }
  }

  /**
   * Save seen servers database
   */
  async saveSeenServers(): Promise<void> {
    if (!this.seenServers) {
      throw new Error('Seen servers database not loaded');
    }

    const filePath = this.config.getSystemConfig().seenServersFile;
    
    try {
      this.seenServers.lastUpdated = new Date().toISOString();
      
      // Update stats
      const servers = Object.values(this.seenServers.servers);
      const uniqueVendors = new Set(servers.map(s => s.vendor)).size;
      const approvedServers = servers.filter(s => s.status === 'approved').length;
      
      this.seenServers.stats = {
        totalServers: servers.length,
        uniqueVendors,
        approvalRate: servers.length > 0 ? approvedServers / servers.length : 0,
        lastScanDate: this.seenServers.stats.lastScanDate
      };
      
      writeJsonFile(filePath, this.seenServers);
    } catch (error) {
      throw new StorageError(
        `Failed to save seen servers database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          code: 'STORAGE_ERROR',
          operation: 'write',
          path: filePath
        }
      );
    }
  }

  /**
   * Check if server has been seen before
   */
  async isServerSeen(server: Partial<Server>): Promise<boolean> {
    const db = await this.loadSeenServers();
    
    // Check by ID if available
    if (server.id && db.servers[server.id]) {
      return true;
    }
    
    // Check by GitHub URL
    if (server.githubUrl) {
      const existing = Object.values(db.servers).find(s => s.githubUrl === server.githubUrl);
      if (existing) {
        return true;
      }
    }
    
    // Check by name and vendor (fuzzy matching)
    if (server.name && server.vendor) {
      const normalizedName = server.name.toLowerCase().trim();
      const normalizedVendor = server.vendor.toLowerCase().trim();
      
      const existing = Object.values(db.servers).find(s => 
        s.name.toLowerCase().trim() === normalizedName &&
        s.vendor.toLowerCase().trim() === normalizedVendor
      );
      
      if (existing) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Add server to seen database
   */
  async addSeenServer(server: Server): Promise<void> {
    const db = await this.loadSeenServers();
    
    // Ensure server has ID
    if (!server.id) {
      server.id = generateUUID();
    }
    
    // Validate server
    validateServerSchema(server);
    
    // Add to database
    db.servers[server.id] = server;
    
    // Update last scan date if this is a new discovery
    if (server.discoveryDate) {
      const discoveryDate = new Date(server.discoveryDate);
      const lastScanDate = new Date(db.stats.lastScanDate);
      
      if (discoveryDate > lastScanDate) {
        db.stats.lastScanDate = server.discoveryDate;
      }
    }
    
    await this.saveSeenServers();
  }

  /**
   * Update server status
   */
  async updateServerStatus(serverId: string, status: 'approved' | 'rejected', reviewer?: string, rejectionReason?: string): Promise<void> {
    const db = await this.loadSeenServers();
    
    if (!db.servers[serverId]) {
      throw new Error(`Server not found: ${serverId}`);
    }
    
    const server = db.servers[serverId];
    server.status = status;
    server.reviewDate = new Date().toISOString();
    server.reviewer = reviewer;
    
    if (status === 'rejected' && rejectionReason) {
      server.rejectionReason = rejectionReason;
    }
    
    server.updatedAt = new Date().toISOString();
    
    await this.saveSeenServers();
  }

  /**
   * Get server by ID
   */
  async getServer(serverId: string): Promise<Server | null> {
    const db = await this.loadSeenServers();
    return db.servers[serverId] || null;
  }

  /**
   * Get servers by status
   */
  async getServersByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<Server[]> {
    const db = await this.loadSeenServers();
    return Object.values(db.servers).filter(server => server.status === status);
  }

  /**
   * Get servers by vendor
   */
  async getServersByVendor(vendor: string): Promise<Server[]> {
    const db = await this.loadSeenServers();
    return Object.values(db.servers).filter(server => 
      server.vendor.toLowerCase() === vendor.toLowerCase()
    );
  }

  /**
   * Get servers discovered in date range
   */
  async getServersInDateRange(startDate: string, endDate: string): Promise<Server[]> {
    const db = await this.loadSeenServers();
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Object.values(db.servers).filter(server => {
      const discoveryDate = new Date(server.discoveryDate);
      return discoveryDate >= start && discoveryDate <= end;
    });
  }

  /**
   * Save new servers to weekly scan file
   */
  async saveNewServers(servers: Server[], stats: {
    queryCount: number;
    alreadyKnown: number;
    falsePositivesFiltered: number;
    totalVendorsSearched: number;
    apiCalls: number;
    processingTime: number;
    errorCount: number;
  }): Promise<string> {
    const scanDate = new Date().toISOString().split('T')[0];
    const fileName = `${scanDate}.json`;
    const filePath = join(this.config.getSystemConfig().newServersDir, fileName);
    
    const newServersFile: NewServersFile = {
      scanDate,
      queryCount: stats.queryCount,
      newServers: servers,
      alreadyKnown: stats.alreadyKnown,
      falsePositivesFiltered: stats.falsePositivesFiltered,
      stats: {
        totalVendorsSearched: stats.totalVendorsSearched,
        apiCalls: stats.apiCalls,
        processingTime: stats.processingTime,
        errorCount: stats.errorCount
      }
    };
    
    try {
      writeJsonFile(filePath, newServersFile);
      return filePath;
    } catch (error) {
      throw new StorageError(
        `Failed to save new servers file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          code: 'STORAGE_ERROR',
          operation: 'write',
          path: filePath
        }
      );
    }
  }

  /**
   * Load new servers from weekly scan file
   */
  async loadNewServers(date: string): Promise<NewServersFile | null> {
    const fileName = `${date}.json`;
    const filePath = join(this.config.getSystemConfig().newServersDir, fileName);
    
    try {
      if (!existsSync(filePath)) {
        return null;
      }
      
      return readJsonFile<NewServersFile>(filePath);
    } catch (error) {
      throw new StorageError(
        `Failed to load new servers file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          code: 'STORAGE_ERROR',
          operation: 'read',
          path: filePath
        }
      );
    }
  }

  /**
   * Get all weekly scan dates
   */
  async getWeeklyScanDates(): Promise<string[]> {
    const dirPath = this.config.getSystemConfig().newServersDir;
    
    try {
      // This would need fs.readdir implementation
      // For now, return empty array
      return [];
    } catch (error) {
      throw new StorageError(
        `Failed to get weekly scan dates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          code: 'STORAGE_ERROR',
          operation: 'read',
          path: dirPath
        }
      );
    }
  }

  /**
   * Save monthly report
   */
  async saveMonthlyReport(report: any): Promise<string> {
    const reportDate = new Date().toISOString().split('T')[0].slice(0, 7); // YYYY-MM
    const fileName = `${reportDate}.json`;
    const filePath = join(this.config.getSystemConfig().monthlyReportsDir, fileName);
    
    try {
      writeJsonFile(filePath, report);
      return filePath;
    } catch (error) {
      throw new StorageError(
        `Failed to save monthly report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          code: 'STORAGE_ERROR',
          operation: 'write',
          path: filePath
        }
      );
    }
  }

  /**
   * Load monthly report
   */
  async loadMonthlyReport(date: string): Promise<any | null> {
    const fileName = `${date}.json`;
    const filePath = join(this.config.getSystemConfig().monthlyReportsDir, fileName);
    
    try {
      if (!existsSync(filePath)) {
        return null;
      }
      
      return readJsonFile(filePath);
    } catch (error) {
      throw new StorageError(
        `Failed to load monthly report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          code: 'STORAGE_ERROR',
          operation: 'read',
          path: filePath
        }
      );
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalServers: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    uniqueVendors: number;
    approvalRate: number;
    lastScanDate: string;
  }> {
    const db = await this.loadSeenServers();
    const servers = Object.values(db.servers);
    
    const pendingReview = servers.filter(s => s.status === 'pending').length;
    const approved = servers.filter(s => s.status === 'approved').length;
    const rejected = servers.filter(s => s.status === 'rejected').length;
    const uniqueVendors = new Set(servers.map(s => s.vendor)).size;
    
    return {
      totalServers: servers.length,
      pendingReview,
      approved,
      rejected,
      uniqueVendors,
      approvalRate: servers.length > 0 ? approved / servers.length : 0,
      lastScanDate: db.stats.lastScanDate
    };
  }

  /**
   * Clean up old data
   */
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // Clean up old new servers files
    // This would need fs.readdir implementation
    // For now, just log
    console.log(`Cleanup would remove files older than ${cutoffDate.toISOString()}`);
  }

  /**
   * Export database for backup
   */
  async exportDatabase(): Promise<string> {
    const db = await this.loadSeenServers();
    const exportData = {
      ...db,
      exportDate: new Date().toISOString(),
      serverCount: Object.keys(db.servers).length
    };
    
    const exportPath = join(this.config.getSystemConfig().dataDir, `export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    writeJsonFile(exportPath, exportData);
    
    return exportPath;
  }

  /**
   * Import database from backup
   */
  async importDatabase(filePath: string): Promise<void> {
    try {
      const importData = readJsonFile<SeenServersDatabase>(filePath);
      
      // Validate import data
      if (!importData.version || !importData.servers) {
        throw new Error('Invalid import data format');
      }
      
      this.seenServers = importData;
      await this.saveSeenServers();
    } catch (error) {
      throw new StorageError(
        `Failed to import database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          code: 'STORAGE_ERROR',
          operation: 'read',
          path: filePath
        }
      );
    }
  }
}

/**
 * Create storage manager instance
 */
export function createStorageManager(): StorageManager {
  return new StorageManager();
}
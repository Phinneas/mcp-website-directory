/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  generateUUID,
  isValidISODate,
  calculateConfidenceScore,
  calculateNicheScore,
  formatDate
} from '../utils.js';

describe('Utility Functions', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
    
    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });
  
  describe('isValidISODate', () => {
    it('should validate correct ISO dates', () => {
      expect(isValidISODate('2024-01-01T00:00:00.000Z')).toBe(true);
      expect(isValidISODate('2024-12-31T23:59:59.999Z')).toBe(true);
    });
    
    it('should reject invalid dates', () => {
      expect(isValidISODate('not-a-date')).toBe(false);
      expect(isValidISODate('2024-01-01')).toBe(false); // Missing time
      expect(isValidISODate('2024-01-01T00:00:00')).toBe(false); // Missing Z
    });
  });
  
  describe('calculateConfidenceScore', () => {
    it('should calculate base score for minimal server', () => {
      const server = {
        name: 'Test Server',
        vendor: 'Test Vendor'
      };
      const score = calculateConfidenceScore(server);
      expect(score).toBe(0.5);
    });
    
    it('should increase score for GitHub URL', () => {
      const server = {
        name: 'Test Server',
        vendor: 'Test Vendor',
        githubUrl: 'https://github.com/test/test'
      };
      const score = calculateConfidenceScore(server);
      expect(score).toBe(0.7);
    });
    
    it('should increase score for documentation URL', () => {
      const server = {
        name: 'Test Server',
        vendor: 'Test Vendor',
        documentationUrl: 'https://docs.test.com'
      };
      const score = calculateConfidenceScore(server);
      expect(score).toBe(0.6);
    });
    
    it('should cap score at 1.0', () => {
      const server = {
        name: 'Test Server',
        vendor: 'Test Vendor',
        githubUrl: 'https://github.com/test/test',
        documentationUrl: 'https://docs.test.com',
        description: 'A very detailed description that is more than twenty characters long',
        tags: ['tag1', 'tag2', 'tag3'],
        useCases: ['use1', 'use2', 'use3']
      };
      const score = calculateConfidenceScore(server);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });
  
  describe('calculateNicheScore', () => {
    it('should calculate niche score for server with low stars', () => {
      const server = {
        githubStars: 50,
        lastCommitDate: '2024-01-01T00:00:00.000Z',
        tags: ['niche', 'specialized'],
        useCases: ['specific-use-case'],
        vendor: 'SmallVendor'
      };
      const score = calculateNicheScore(server as any);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });
    
    it('should give higher score for very low stars', () => {
      const serverLowStars = { githubStars: 10 } as any;
      const serverHighStars = { githubStars: 1000 } as any;
      
      const scoreLow = calculateNicheScore(serverLowStars);
      const scoreHigh = calculateNicheScore(serverHighStars);
      
      expect(scoreLow).toBeGreaterThan(scoreHigh);
    });
  });
  
  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-01-01T12:00:00.000Z');
      const formatted = formatDate(date);
      expect(formatted).toBe('2024-01-01');
    });
    
    it('should handle different dates', () => {
      const date = new Date('2024-12-31T23:59:59.999Z');
      const formatted = formatDate(date);
      expect(formatted).toBe('2024-12-31');
    });
  });
});
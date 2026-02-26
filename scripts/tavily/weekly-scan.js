#!/usr/bin/env node

/**
 * Weekly scan JavaScript entry point
 * This file allows the weekly scan to be run directly from Node.js
 */

import { runWeeklyScan } from './weekly-scan.js';

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Run the weekly scan
runWeeklyScan()
  .then(result => {
    if (result.success) {
      console.log('✅ Weekly scan completed successfully');
      console.log('📊 Statistics:', JSON.stringify(result.stats, null, 2));
      
      if (result.errors.length > 0) {
        console.warn('⚠️  Errors encountered:', result.errors.length);
        result.errors.forEach(error => {
          console.warn(`   - ${error.vendor}: ${error.error}`);
        });
      }
      
      process.exit(0);
    } else {
      console.error('❌ Weekly scan failed');
      console.error('📊 Statistics:', JSON.stringify(result.stats, null, 2));
      console.error('🚨 Errors:', JSON.stringify(result.errors, null, 2));
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unhandled error in weekly scan:', error);
    process.exit(1);
  });
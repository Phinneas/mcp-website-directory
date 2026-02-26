#!/usr/bin/env node

/**
 * Monthly review JavaScript entry point
 * This file allows the monthly review to be run directly from Node.js
 */

import { runMonthlyReview } from './monthly-review.js';

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

// Run the monthly review
runMonthlyReview()
  .then(result => {
    if (result.success && result.report) {
      console.log('✅ Monthly review completed successfully');
      console.log('📄 Report ID:', result.report.reportId);
      console.log('📊 Executive summary:', JSON.stringify(result.report.summary, null, 2));
      
      if (result.insights.length > 0) {
        console.log('💡 Insights:');
        result.insights.forEach(insight => {
          console.log(`   - ${insight}`);
        });
      }
      
      if (result.errors.length > 0) {
        console.warn('⚠️  Errors encountered:', result.errors.length);
        result.errors.forEach(error => {
          console.warn(`   - ${error.module}: ${error.error}`);
        });
      }
      
      process.exit(0);
    } else {
      console.error('❌ Monthly review failed or no report generated');
      console.error('🚨 Errors:', JSON.stringify(result.errors, null, 2));
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unhandled error in monthly review:', error);
    process.exit(1);
  });
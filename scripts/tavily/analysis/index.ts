/**
 * Analysis modules index
 */

export { runGapAnalysis } from './gap-analysis.js';
export { runCategoryHealthCheck } from './category-health.js';
export { runVendorMomentumScan } from './vendor-momentum.js';
export { runEmergingUseCaseDetection } from './emerging-use-cases.js';

// Re-export types needed by consumers
export type { GapAnalysisResult, CategoryHealthResult, VendorMomentumResult, EmergingUseCaseResult } from '../types.js';
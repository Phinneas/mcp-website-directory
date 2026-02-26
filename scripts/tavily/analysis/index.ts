/**
 * Analysis modules index
 */

export { runGapAnalysis } from './gap-analysis.js';
export { runCategoryHealthCheck } from './category-health.js';
export { runVendorMomentumScan } from './vendor-momentum.js';
export { runEmergingUseCaseDetection } from './emerging-use-cases.js';

export default {
  runGapAnalysis,
  runCategoryHealthCheck,
  runVendorMomentumScan,
  runEmergingUseCaseDetection
};
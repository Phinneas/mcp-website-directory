/**
 * User-Submitted Compatibility Reports System
 * Allows users to submit and view compatibility reports for client-server pairs
 * 
 * @typedef {Object} CompatibilityReport
 * @property {string} id
 * @property {string} clientId
 * @property {string} clientName
 * @property {string} serverId
 * @property {string} serverName
 * @property {'works' | 'partial' | 'broken' | 'unknown'} status
 * @property {'stdio' | 'sse' | 'both'} transport
 * @property {string} notes
 * @property {string} version
 * @property {number} timestamp
 * @property {boolean} verified
 * @property {number} upvotes
 * @property {number} downvotes
 * 
 * @typedef {Object} CompatibilityReportInput
 * @property {string} clientId
 * @property {string} clientName
 * @property {string} serverId
 * @property {string} serverName
 * @property {'works' | 'partial' | 'broken' | 'unknown'} status
 * @property {'stdio' | 'sse' | 'both'} transport
 * @property {string} notes
 * @property {string} version
 */

const STORAGE_KEY = 'mcp_compatibility_reports';
const MAX_REPORTS = 500;

/**
 * Generate unique report ID
 */
function generateReportId() {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all stored reports
 */
export function getAllReports() {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const reports = JSON.parse(stored);
    return Array.isArray(reports) ? reports : [];
  } catch (error) {
    console.error('Failed to load compatibility reports:', error);
    return [];
  }
}

/**
 * Save reports to storage
 */
function saveReports(reports) {
  if (typeof window === 'undefined') return;
  
  // Limit storage size
  const trimmed = reports.slice(-MAX_REPORTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/**
 * Submit a new compatibility report
 */
export function submitReport(input) {
  const reports = getAllReports();
  
  // Check for duplicate
  const existingIndex = reports.findIndex(
    r => r.clientId === input.clientId && r.serverId === input.serverId
  );
  
  const report = {
    id: existingIndex >= 0 ? reports[existingIndex].id : generateReportId(),
    clientId: input.clientId,
    clientName: input.clientName,
    serverId: input.serverId,
    serverName: input.serverName,
    status: input.status,
    transport: input.transport,
    notes: input.notes,
    version: input.version,
    timestamp: Date.now(),
    verified: false,
    upvotes: existingIndex >= 0 ? reports[existingIndex].upvotes : 0,
    downvotes: existingIndex >= 0 ? reports[existingIndex].downvotes : 0
  };
  
  if (existingIndex >= 0) {
    reports[existingIndex] = report;
  } else {
    reports.push(report);
  }
  
  saveReports(reports);
  return report;
}

/**
 * Get reports for a specific client-server pair
 */
export function getReportsForPair(clientId, serverId) {
  return getAllReports().filter(
    r => r.clientId === clientId && r.serverId === serverId
  );
}

/**
 * Get reports for a specific client
 */
export function getReportsForClient(clientId) {
  return getAllReports().filter(r => r.clientId === clientId);
}

/**
 * Get reports for a specific server
 */
export function getReportsForServer(serverId) {
  return getAllReports().filter(r => r.serverId === serverId);
}

/**
 * Upvote a report
 */
export function upvoteReport(reportId) {
  const reports = getAllReports();
  const report = reports.find(r => r.id === reportId);
  
  if (report) {
    report.upvotes++;
    saveReports(reports);
    return report;
  }
  
  return null;
}

/**
 * Downvote a report
 */
export function downvoteReport(reportId) {
  const reports = getAllReports();
  const report = reports.find(r => r.id === reportId);
  
  if (report) {
    report.downvotes++;
    saveReports(reports);
    return report;
  }
  
  return null;
}

/**
 * Calculate aggregate status from reports
 */
export function getAggregateStatus(clientId, serverId) {
  const reports = getReportsForPair(clientId, serverId);
  
  if (reports.length === 0) {
    return { status: 'unknown', confidence: 0, reportCount: 0 };
  }
  
  // Weighted voting based on upvotes
  const votes = { works: 0, partial: 0, broken: 0, unknown: 0 };
  
  for (const report of reports) {
    const weight = 1 + report.upvotes - report.downvotes;
    votes[report.status] += Math.max(weight, 1);
  }
  
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  const maxStatus = Object.entries(votes).reduce((a, b) => 
    b[1] > a[1] ? b : a
  );
  
  return {
    status: maxStatus[0],
    confidence: (maxStatus[1] / total) * 100,
    reportCount: reports.length
  };
}

/**
 * Get report statistics
 */
export function getReportStats() {
  const reports = getAllReports();
  
  return {
    total: reports.length,
    byStatus: {
      works: reports.filter(r => r.status === 'works').length,
      partial: reports.filter(r => r.status === 'partial').length,
      broken: reports.filter(r => r.status === 'broken').length,
      unknown: reports.filter(r => r.status === 'unknown').length
    },
    byClient: reports.reduce((acc, r) => {
      acc[r.clientId] = (acc[r.clientId] || 0) + 1;
      return acc;
    }, {}),
    byServer: reports.reduce((acc, r) => {
      acc[r.serverId] = (acc[r.serverId] || 0) + 1;
      return acc;
    }, {}),
    verified: reports.filter(r => r.verified).length
  };
}

/**
 * Clear all reports (admin function)
 */
export function clearAllReports() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export reports as JSON
 */
export function exportReports() {
  return JSON.stringify(getAllReports(), null, 2);
}

/**
 * Import reports from JSON
 */
export function importReports(json) {
  try {
    const imported = JSON.parse(json);
    if (!Array.isArray(imported)) throw new Error('Invalid format');
    
    const existing = getAllReports();
    const existingIds = new Set(existing.map(r => r.id));
    
    const newReports = imported.filter(r => 
      !existingIds.has(r.id) && 
      r.clientId && r.serverId && r.status
    );
    
    const merged = [...existing, ...newReports];
    saveReports(merged);
    
    return newReports.length;
  } catch (error) {
    console.error('Failed to import reports:', error);
    return 0;
  }
}

/**
 * Merge user reports with base compatibility matrix
 */
export function mergeWithBaseMatrix(baseMatrix) {
  const reports = getAllReports();
  const merged = JSON.parse(JSON.stringify(baseMatrix));
  
  for (const report of reports) {
    if (!merged[report.clientId]) {
      merged[report.clientId] = {};
    }
    
    // Only update if user has higher confidence or no existing entry
    const existing = merged[report.clientId][report.serverId];
    const aggregate = getAggregateStatus(report.clientId, report.serverId);
    
    if (!existing || existing === 'unknown' || aggregate.confidence > 70) {
      merged[report.clientId][report.serverId] = report.status;
    }
  }
  
  return merged;
}

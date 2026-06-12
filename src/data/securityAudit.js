/**
 * Security Audit Utilities
 * Functions for processing and displaying security audit data
 */

export interface SecurityAuditData {
  transport: 'stdio' | 'sse_http' | 'both';
  authMethod: 'None' | 'API Key' | 'OAuth2';
  tokenLifecycle: 'N/A' | 'short-lived' | 'long-lived';
  inputHandling: 'parameterized' | 'shell_strings' | 'mixed';
  dataResidency: 'local_only' | 'cloud';
  auditScore: number;
  auditDate: string;
  auditorNotes: string;
}

export interface SecurityScoreTier {
  tier: 'excellent' | 'good' | 'fair' | 'poor';
  label: string;
  color: string;
  emoji: string;
  description: string;
}

/**
 * Get security score tier based on audit score
 */
export function getScoreTier(score: number): SecurityScoreTier {
  if (score >= 80) {
    return {
      tier: 'excellent',
      label: 'Excellent',
      color: '#22c55e',
      emoji: '🛡️',
      description: 'Strong security practices with minimal risks'
    };
  } else if (score >= 65) {
    return {
      tier: 'good',
      label: 'Good',
      color: '#3b82f6',
      emoji: '🔒',
      description: 'Good security practices with some minor concerns'
    };
  } else if (score >= 50) {
    return {
      tier: 'fair',
      label: 'Fair',
      color: '#f59e0b',
      emoji: '⚠️',
      description: 'Adequate security with room for improvement'
    };
  } else {
    return {
      tier: 'poor',
      label: 'Poor',
      color: '#ef4444',
      emoji: '🚨',
      description: 'Security concerns that should be addressed'
    };
  }
}

/**
 * Format transport type for display
 */
export function formatTransport(transport: string): string {
  switch (transport) {
    case 'stdio': return 'Stdio';
    case 'sse_http': return 'SSE';
    case 'both': return 'Both';
    default: return transport;
  }
}

/**
 * Format auth method for display with icon
 */
export function formatAuthMethod(authMethod: string): { label: string; icon: string } {
  switch (authMethod) {
    case 'None':
      return { label: 'No Auth', icon: '⚠️' };
    case 'API Key':
      return { label: 'API Key', icon: '🔑' };
    case 'OAuth2':
      return { label: 'OAuth2', icon: '🔒' };
    case 'SSO-SAML':
      return { label: 'SSO/SAML', icon: '🔐' };
    default:
      return { label: authMethod, icon: '🔑' };
  }
}

/**
 * Get data residency display info
 */
export function formatDataResidency(residency: string): { label: string; icon: string; color: string } {
  switch (residency) {
    case 'local_only':
      return { label: 'Local Only', icon: '💻', color: '#22c55e' };
    case 'cloud':
      return { label: 'Cloud', icon: '☁️', color: '#3b82f6' };
    default:
      return { label: residency, icon: '❓', color: '#6b7280' };
  }
}

/**
 * Parse security audit JSON from database
 */
export function parseSecurityAudit(auditJson: string | null): SecurityAuditData | null {
  if (!auditJson) return null;
  
  try {
    return JSON.parse(auditJson) as SecurityAuditData;
  } catch (error) {
    console.warn('Failed to parse security audit data:', error);
    return null;
  }
}

/**
 * Security gate for the `add` command.
 * Displays audit score, tier, and individual dimensions.
 * Prompts for confirmation if the server is At Risk or has critical dependencies.
 */

import type { ServerDetail } from './api.js';

const TIER_COLORS: Record<string, string> = {
  'Secure': '\x1b[32m',   // green
  'Moderate': '\x1b[33m',  // yellow
  'At Risk': '\x1b[31m',   // red
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function colorize(text: string, color: string): string {
  return `${color}${text}${RESET}`;
}

export function displaySecurityReport(server: ServerDetail): void {
  const sec = server.security;
  if (!sec) {
    console.log(`  ${DIM}No security audit data available${RESET}`);
    return;
  }

  const tier = sec.tier;
  const color = TIER_COLORS[tier] || RESET;

  console.log('');
  console.log(`  ${BOLD}Security Audit${RESET}  ${color}${BOLD}[${tier}]${RESET}  Score: ${sec.audit_score}/100`);
  console.log(`  ${'─'.repeat(50)}`);

  const rows = [
    ['Transport', sec.transport, scoreTransport(sec.transport)],
    ['Auth', sec.auth_method, sec.auth_method === 'None' ? '⚠' : '✓'],
    ['Token Lifecycle', sec.token_lifecycle, sec.token_lifecycle === 'short-lived' ? '✓' : '⚠'],
    ['Input Handling', sec.input_handling, sec.input_handling === 'parameterized' ? '✓' : '⚠'],
    ['Data Residency', sec.data_residency, sec.data_residency === 'local_only' ? '✓' : '⚠'],
  ];

  for (const [label, value, icon] of rows) {
    console.log(`  ${label.padEnd(18)} ${String(value).padEnd(16)} ${icon}`);
  }

  // Dependency health
  const depIcon = sec.dependency_health === 'clean' ? '✓' : sec.dependency_health === 'critical' ? '✗' : '⚠';
  console.log(`  ${'Dependencies'.padEnd(18)} ${sec.dependency_health.padEnd(16)} ${depIcon}`);

  // Verified badge
  if (server.verified) {
    console.log(`  ${colorize('✓ Verified', '\x1b[32m')}${DIM} — audit ≥ 50, no critical dependencies${RESET}`);
  } else {
    console.log(`  ${colorize('✗ Not Verified', '\x1b[33m')}${DIM} — audit < 50 or critical dependencies detected${RESET}`);
  }

  console.log('');
}

function scoreTransport(t: string): string {
  if (t === 'stdio') return '✓';
  if (t === 'both') return '⚠';
  return '⚠';
}

export interface SecurityGateResult {
  proceed: boolean;
  warned: boolean;
}

/**
 * Run the security gate. Returns whether to proceed and whether a warning was shown.
 * If the server is At Risk or has critical dependencies, prompts for confirmation
 * unless --force is set.
 */
export async function securityGate(
  server: ServerDetail,
  force: boolean
): Promise<SecurityGateResult> {
  const sec = server.security;
  if (!sec) {
    // No audit data — proceed but note it
    console.log(`  ${DIM}No security audit available for this server. Proceed with caution.${RESET}`);
    return { proceed: true, warned: false };
  }

  const needsWarning = sec.audit_score < 50 || sec.dependency_health === 'critical';

  displaySecurityReport(server);

  if (!needsWarning) {
    return { proceed: true, warned: false };
  }

  if (force) {
    console.log(`  ${colorize('⚠ Security warnings bypassed with --force', '\x1b[33m')}${RESET}`);
    return { proceed: true, warned: true };
  }

  // Interactive confirmation
  const readline = await import('node:readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    rl.question(`  ${colorize('This server has security concerns. Install anyway? [y/N] ', '\x1b[33m')}`, (answer) => {
      rl.close();
      const proceed = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
      if (!proceed) {
        console.log('  Installation cancelled.');
      }
      resolve({ proceed, warned: true });
    });
  });
}

/**
 * `mymcpshelf verify <server-id>` — Re-check the security status of a server.
 * Fetches fresh data from the API and displays the audit report.
 */
import { getServer } from '../lib/api.js';
import { displaySecurityReport } from '../lib/security-gate.js';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';

export async function verifyCommand(serverId: string): Promise<void> {
  console.log(`\n${BOLD}mymcpshelf verify${RESET} ${serverId}\n`);

  let server;
  try {
    server = await getServer(serverId);
  } catch (err: any) {
    console.error(`  ${RED}Error:${RESET} ${err.message}`);
    process.exit(1);
  }

  console.log(`  ${BOLD}${server.name}${RESET}  ★ ${server.stars.toLocaleString()}`);
  console.log(`  ${server.shelf_url}`);
  console.log('');

  displaySecurityReport(server);

  if (server.reliability) {
    console.log(`  ${BOLD}Reliability${RESET}  Score: ${server.reliability.score}/100  [${server.reliability.tier}]  ${server.reliability.label}`);
    console.log('');
  }

  if (server.verified) {
    console.log(`  ${GREEN}✓ This server passes the verification gate.${RESET}`);
  } else {
    console.log(`  ${RED}✗ This server does not pass the verification gate.${RESET}`);
    if (server.security) {
      if (server.security.audit_score < 50) {
        console.log(`    Reason: Audit score ${server.security.audit_score}/100 is below 50 threshold.`);
      }
      if (server.security.dependency_health === 'critical') {
        console.log(`    Reason: Critical dependencies detected.`);
      }
    }
  }
  console.log('');
}

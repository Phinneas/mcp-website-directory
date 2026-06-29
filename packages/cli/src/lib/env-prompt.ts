/**
 * Prompt user for required environment variables.
 * Reads the env_schema from the server detail and asks for values.
 */

import type { ServerDetail } from './api.js';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const YELLOW = '\x1b[33m';

export async function promptEnvVars(server: ServerDetail): Promise<Record<string, string>> {
  const schema = server.env_schema;
  const keys = Object.keys(schema);

  if (keys.length === 0) {
    return {};
  }

  const required = keys.filter(k => schema[k].required);
  const optional = keys.filter(k => !schema[k].required);

  console.log(`  ${BOLD}Environment Variables${RESET}`);

  if (required.length > 0) {
    console.log(`  ${YELLOW}Required:${RESET}`);
  }

  const envValues: Record<string, string> = {};

  const readline = await import('node:readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  for (const key of required) {
    const desc = schema[key].description;
    const value = await askQuestion(rl, `  ${key}${desc ? ` (${desc})` : ''}: `);
    if (!value.trim()) {
      console.log(`  ${YELLOW}Warning: ${key} is empty. The server may not work without it.${RESET}`);
    }
    envValues[key] = value.trim();
  }

  if (optional.length > 0) {
    console.log(`  ${DIM}Optional (press Enter to skip):${RESET}`);
    for (const key of optional) {
      const desc = schema[key].description;
      const value = await askQuestion(rl, `  ${key}${desc ? ` (${desc})` : ''}: `);
      if (value.trim()) {
        envValues[key] = value.trim();
      }
    }
  }

  rl.close();
  return envValues;
}

function askQuestion(rl: any, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => resolve(answer));
  });
}

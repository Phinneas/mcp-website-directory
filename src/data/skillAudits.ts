/**
 * Manual Security Audits for Top Skills
 *
 * Human-reviewed assessments for the most-installed and featured skills.
 * Provides the "manually_reviewed" badge tier.
 *
 * Audit dimensions:
 *   promptInjectionRisk  — low | medium | high
 *   scriptSafety         — clean | warning | critical
 *   secretExposure       — boolean
 *   installTrust         — trusted | suspicious
 */

import { registerSkillAudit, type SkillAudit } from '../security/skill-scanner';

const AUDITS: SkillAudit[] = [
  {
    name: 'marketing-skills',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Curated marketing skills by Corey Haines. Install uses standard npx skills add. No dangerous patterns.',
  },
  {
    name: 'superpowers',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Official Anthropic skills framework. Well-documented, no script execution in install.',
  },
  {
    name: 'gitnexus',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Code intelligence skill by anthropic-skills. Install is npx gitnexus init — standard CLI.',
  },
  {
    name: 'mcp-builder',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Anthropic skill for building MCP servers. No suspicious install patterns.',
  },
  {
    name: 'find-skills',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Vercel Labs skill for skill discovery. Standard npx skills add install.',
  },
  {
    name: 'vercel-react-best-practices',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Vercel Labs React best practices. No dangerous patterns.',
  },
  {
    name: 'web-design-guidelines',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Vercel Labs design guidelines skill. Clean install.',
  },
  {
    name: 'frontend-design',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Anthropics frontend design skill. Standard install, no scripts.',
  },
  {
    name: 'agent-tools',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Inference.sh CLI skill. Install is standard npx. No suspicious patterns.',
  },
  {
    name: 'azure-ai',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Microsoft GitHub Copilot for Azure skill. Official publisher.',
  },
  {
    name: 'impeccable-design',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Anthropic design skill. Clean install pattern.',
  },
  {
    name: 'serena-mcp',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Serena coding agent toolkit. Standard pip install.',
  },
  {
    name: 'github-official-mcp-new',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Official GitHub MCP server skill. Trusted publisher.',
  },
  {
    name: 'playwright-browser-automation',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Microsoft Playwright skill. Official publisher.',
  },
  {
    name: 'mastra-docs',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Mastra.ai documentation skill. Clean install.',
  },
  {
    name: 'upstash-context7',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Upstash Context7 skill. Standard npx install.',
  },
  {
    name: 'mindsdb-mcp',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'MindsDB official skill. Trusted publisher.',
  },
  {
    name: 'panel-1panel',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: '1Panel server management skill. Clean install pattern.',
  },
  {
    name: 'fastmcp',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'FastMCP Python framework skill. pip install. No suspicious patterns.',
  },
  {
    name: 'figma-context-mcp',
    promptInjectionRisk: 'low',
    scriptSafety: 'clean',
    secretExposure: false,
    installTrust: 'trusted',
    notes: 'Figma Context MCP skill. Standard npx install.',
  },
];

// Register all audits at module load time
for (const audit of AUDITS) {
  registerSkillAudit(audit);
}

export { AUDITS };

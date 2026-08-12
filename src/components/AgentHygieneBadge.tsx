/**
 * AgentHygieneBadge — displays the Agent Hygiene Score on server detail pages.
 *
 * Separate from SecurityBadge (existing scan badge) and Security Audit (manual 6-dim audit).
 * This badge answers: "Is it safe to hand this server to an autonomous AI agent?"
 *
 * Score: 0-10, across 5 dimensions (each 0-2):
 *   Schema Strictness, Least-Privilege Scoping, Declared Boundaries,
 *   Auditability, Maintenance Signal.
 *
 * Tiers:
 *   8-10 Excellent (green) — safe for autonomous agent use
 *   6-7  Good     (blue)   — reasonable with scoped permissions
 *   4-5  Fair     (yellow) — use with caution
 *   0-3  Poor     (red)    — not recommended for autonomous agent use
 */

import { useState } from 'react';
import type { AgentHygieneScore } from '../data/agentHygieneScores';
import { getHygieneTier, HYGIENE_DIMENSIONS } from '../data/agentHygieneScores';

interface AgentHygieneBadgeProps {
  score: AgentHygieneScore;
  compact?: boolean;
}

const DIMENSION_ICONS: Record<string, string> = {
  schema: '📋',
  scoping: '🔑',
  boundaries: '🚧',
  auditability: '🔍',
  maintenance: '🛠️',
};

const DIMENSION_LABELS: Record<string, string> = {
  schema: 'Schema Strictness',
  scoping: 'Least-Privilege',
  boundaries: 'Boundaries',
  auditability: 'Auditability',
  maintenance: 'Maintenance',
};

function ScoreDot({ value }: { value: number }) {
  const colors = ['#ef4444', '#eab308', '#22c55e']; // 0=red, 1=yellow, 2=green
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: i < value ? colors[2] : 'rgba(255,255,255,0.1)',
            border: `1px solid ${i < value ? colors[2] : 'rgba(255,255,255,0.15)'}`,
          }}
        />
      ))}
    </div>
  );
}

export default function AgentHygieneBadge({ score, compact = false }: AgentHygieneBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const tier = getHygieneTier(score.total);

  if (compact) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.2rem 0.55rem',
          borderRadius: '12px',
          fontSize: '0.7rem',
          fontWeight: 700,
          backgroundColor: `${tier.color}1a`,
          color: tier.color,
          border: `1px solid ${tier.color}40`,
          whiteSpace: 'nowrap',
        }}
        title={`Agent Hygiene: ${tier.label} (${score.total}/10) — ${tier.description}`}
      >
        <span style={{ fontSize: '0.65rem', lineHeight: 1 }}>🤖</span>
        {score.total}/10
      </span>
    );
  }

  return (
    <div style={{ marginBottom: '0' }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: `${tier.color}0d`,
          border: `1px solid ${tier.color}30`,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>🤖</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: tier.color, fontSize: '0.9rem' }}>
            Agent Hygiene Score
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.15rem' }}>
            {tier.label} — {score.total}/10. {tier.description}
          </div>
        </div>
        <div
          style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            color: tier.color,
          }}
        >
          {score.total}
          <span style={{ fontSize: '0.65rem', fontWeight: 500, opacity: 0.7 }}>/10</span>
        </div>
        <span style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.75rem' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Expanded dimension breakdown */}
      {expanded && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '1rem',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Dimension bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {HYGIENE_DIMENSIONS.map((dim) => {
              const val = score.scores[dim.key as keyof typeof score.scores];
              const note = score.notes?.[dim.key];
              return (
                <div
                  key={dim.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <span style={{ width: '18px', textAlign: 'center' }}>{dim.icon}</span>
                  <span style={{ flex: 1, color: 'var(--text-primary, #000)' }}>{dim.name}</span>
                  <ScoreDot value={val} />
                  <span
                    style={{
                      width: '20px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: val === 2 ? '#22c55e' : val === 1 ? '#eab308' : '#ef4444',
                      fontSize: '0.75rem',
                    }}
                  >
                    {val}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          {score.notes && Object.keys(score.notes).length > 0 && (
            <div
              style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary, #64748b)',
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: 'var(--text-primary, #000)' }}>Notes:</strong>
              {Object.entries(score.notes).map(([key, note]) => (
                <div key={key} style={{ marginTop: '0.25rem' }}>
                  {DIMENSION_ICONS[key]} {DIMENSION_LABELS[key] || key}: {note}
                </div>
              ))}
            </div>
          )}

          {/* Methodology link */}
          <div
            style={{
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.7rem',
              color: 'var(--text-secondary, #64748b)',
              lineHeight: 1.5,
            }}
          >
            Assessed {score.assessedAt} from public README, schema, and GitHub data.{' '}
            <a
              href="/agent-hygiene"
              style={{ color: '#b45309', textDecoration: 'none' }}
            >
              View rubric →
            </a>
            {' · '}
            <a
              href={score.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#b45309', textDecoration: 'none' }}
            >
              Source ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export { AgentHygieneBadge };

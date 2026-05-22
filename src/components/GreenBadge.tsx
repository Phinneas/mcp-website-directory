// GreenBadge Component for MCP Servers
// Displays green hosting status with Verified/Estimated/User-Dependent tiers

interface GreenBadgeProps {
  greenScore?: {
    tier: 'green_verified' | 'green_estimated' | 'user_dependent' | 'unknown';
    label: string;
    description: string;
    carbonIntensity: number | null;
    region: string | null;
    greenVerified: boolean;
    hostingProvider: string | null;
    quality?: 'low' | 'moderate' | 'high';
  } | null;
  compact?: boolean;
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  green_verified: {
    bg: 'rgba(16, 185, 129, 0.1)',
    text: '#10b981',
    border: 'rgba(16, 185, 129, 0.3)',
    dot: '#10b981',
  },
  green_estimated: {
    bg: 'rgba(245, 158, 11, 0.1)',
    text: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.3)',
    dot: '#f59e0b',
  },
  user_dependent: {
    bg: 'rgba(99, 102, 241, 0.1)',
    text: '#818cf8',
    border: 'rgba(99, 102, 241, 0.3)',
    dot: '#818cf8',
  },
  unknown: {
    bg: 'rgba(100, 116, 139, 0.1)',
    text: '#64748b',
    border: 'rgba(100, 116, 139, 0.3)',
    dot: '#64748b',
  },
};

const TIER_ICONS: Record<string, string> = {
  green_verified: '🌿',
  green_estimated: '📊',
  user_dependent: '💻',
  unknown: '❓',
};

export function GreenBadge({ greenScore, compact = false }: GreenBadgeProps) {
  if (!greenScore || greenScore.tier === 'unknown') return null;

  const style = TIER_STYLES[greenScore.tier] || TIER_STYLES.unknown;
  const icon = TIER_ICONS[greenScore.tier] || '❓';

  if (compact) {
    return (
      <span
        className="green-badge-compact"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.2rem 0.55rem',
          borderRadius: '12px',
          fontSize: '0.7rem',
          fontWeight: '600',
          backgroundColor: style.bg,
          color: style.text,
          border: `1px solid ${style.border}`,
          whiteSpace: 'nowrap',
        }}
        title={greenScore.description}
      >
        <span style={{ fontSize: '0.65rem', lineHeight: 1 }}>{icon}</span>
        {greenScore.label}
      </span>
    );
  }

  return (
    <div
      className="green-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
      title={greenScore.description}
    >
      <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>{icon}</span>
      <span>{greenScore.label}</span>
      {greenScore.tier === 'green_verified' && (
        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>Verified</span>
      )}
      {greenScore.tier === 'green_estimated' && greenScore.region && (
        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{greenScore.region}</span>
      )}
    </div>
  );
}

// Health Badge Component for MCP Servers
// Displays maintenance status with constructive language

interface HealthBadgeProps {
  healthStatus?: string;
  lastCommitDate?: string | null;
  showLabel?: boolean;
}

export function HealthBadge({ healthStatus, lastCommitDate, showLabel = true }: HealthBadgeProps) {
  if (!healthStatus || healthStatus === 'unknown') {
    return null;
  }

  const { color, label, description } = getHealthInfo(healthStatus, lastCommitDate);

  return (
    <div
      className="health-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.875rem',
        fontWeight: '600',
        backgroundColor: color.bg,
        color: color.text,
        border: `1px solid ${color.border}`,
      }}
      title={description}
    >
      <span
        style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color.dot,
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />
      {showLabel && <span>{label}</span>}
    </div>
  );
}

function getHealthInfo(status: string, lastCommitDate?: string | null) {
  const daysSinceCommit = lastCommitDate
    ? Math.floor((Date.now() - new Date(lastCommitDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  switch (status) {
    case 'active':
      return {
        color: {
          bg: 'rgba(16, 185, 129, 0.1)',
          text: '#10b981',
          border: 'rgba(16, 185, 129, 0.3)',
          dot: '#10b981',
        },
        label: 'Active',
        description: daysSinceCommit
          ? `Last commit ${daysSinceCommit} days ago - actively maintained`
          : 'Actively maintained with recent commits',
      };

    case 'maintained':
      return {
        color: {
          bg: 'rgba(245, 158, 11, 0.1)',
          text: '#f59e0b',
          border: 'rgba(245, 158, 11, 0.3)',
          dot: '#f59e0b',
        },
        label: 'Maintained',
        description: daysSinceCommit
          ? `Last commit ${daysSinceCommit} days ago - stable maintenance`
          : 'Stable maintenance with recent activity',
      };

    case 'maintenance_required':
      return {
        color: {
          bg: 'rgba(239, 68, 68, 0.1)',
          text: '#ef4444',
          border: 'rgba(239, 68, 68, 0.3)',
          dot: '#ef4444',
        },
        label: 'Maintenance Required',
        description: daysSinceCommit
          ? `Last commit ${daysSinceCommit} days ago - needs attention`
          : 'Requires maintenance attention - inactive for extended period',
      };

    default:
      return {
        color: {
          bg: 'rgba(100, 116, 139, 0.1)',
          text: '#64748b',
          border: 'rgba(100, 116, 139, 0.3)',
          dot: '#64748b',
        },
        label: 'Unknown',
        description: 'Health status unknown',
      };
  }
}

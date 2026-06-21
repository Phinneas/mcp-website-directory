import { useState, useEffect, useRef, useCallback } from 'react';
import type { MCPServer, SecurityAuditData, ReliabilityScoreData } from '../utils/d1';
import { getDeploymentBadge } from '../utils/serverData.js';
import { getScoreTier } from '../data/securityAudit.ts';
import { HealthBadge } from './HealthBadge';
import { GreenBadge } from './GreenBadge';
import { CommunityBadge } from './CommunityBadge';

interface Props {
  initialServers: MCPServer[];
  total: number;
  meta?: {
    deployment?: string;
    [key: string]: any;
  };
}

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'aggregators', label: 'Meta-MCPs' },
  { value: 'browser-automation', label: 'Browser' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'communication', label: 'Communication' },
  { value: 'databases', label: 'Databases' },
  { value: 'data-analytics', label: 'Data & Analytics' },
  { value: 'development', label: 'Development' },
  { value: 'file-systems', label: 'File Systems' },
  { value: 'ai-tools', label: 'AI & LLM' },
  { value: 'knowledge-rag', label: 'Knowledge/RAG' },
  { value: 'media', label: 'Media' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'search', label: 'Search' },
  { value: 'security', label: 'Security' },
  { value: 'finance', label: 'Finance' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getServerIcon(name: string): string {
  return name.charAt(0).toUpperCase();
}

function formatStars(stars?: number): string {
  if (!stars) return '';
  if (stars >= 1000) return `★ ${(stars / 1000).toFixed(1)}k`;
  return `★ ${stars}`;
}

function getReliabilityColor(tier: string): string {
  const colors: Record<string, string> = {
    excellent: '#22c55e',
    strong: '#3b82f6',
    moderate: '#f59e0b',
    limited: '#f97316',
    minimal: '#ef4444',
  };
  return colors[tier] || '#64748b';
}

function SkeletonCard() {
  return (
    <div className="server-card skeleton-card" style={{ opacity: 0.6 }}>
      <div className="server-header">
        <div className="icon-wrapper">
          <div className="server-icon skeleton-shimmer" style={{ background: '#e0e0e0', borderRadius: '8px' }}>&nbsp;</div>
        </div>
        <div className="server-title" style={{ flex: 1 }}>
          <div className="skeleton-shimmer" style={{ height: '1rem', width: '60%', borderRadius: '4px', background: '#e0e0e0', marginBottom: '0.4rem' }} />
          <div className="skeleton-shimmer" style={{ height: '0.75rem', width: '40%', borderRadius: '4px', background: '#e0e0e0' }} />
        </div>
      </div>
      <div className="server-description">
        <div className="skeleton-shimmer" style={{ height: '0.75rem', width: '100%', borderRadius: '4px', background: '#e0e0e0', marginBottom: '0.4rem' }} />
        <div className="skeleton-shimmer" style={{ height: '0.75rem', width: '80%', borderRadius: '4px', background: '#e0e0e0' }} />
      </div>
    </div>
  );
}

function ServerCard({ server }: { server: MCPServer }) {
  const slug = slugify(server.fields.name);
  const logoUrl = server.fields.logoUrl || null;
  const [logoFailed, setLogoFailed] = useState(false);
  
  // Get deployment badge info
  const deploymentInfo = server.deployment ? getDeploymentBadge(server.deployment) : null;
  const secondaryDeployments = server.deployment_metadata?.secondary_deployments || [];

  // Security audit data
  const audit = server.securityAudit;
  const tier = audit ? getScoreTier(audit.auditScore) : null;

  const transportLabel = (t: string) => t === 'stdio' ? 'Stdio' : t === 'sse_http' ? 'SSE' : 'Both';
  const authLabel = (a: string) => {
    if (a === 'None') return '⚠️ No Auth';
    if (a === 'OAuth2') return '🔒 OAuth2';
    if (a === 'SSO-SAML') return '🔐 SSO/SAML';
    return '🔑 API Key';
  };

  return (
    <div className="server-card" data-category={server.fields.category || 'other'}>
      <a href={`/server/${slug}`} className="server-card-link">
        <div className="server-header">
          <div className="icon-wrapper">
            {logoUrl && !logoFailed ? (
              <img
                src={logoUrl}
                alt={`${server.fields.name} logo`}
                className="server-logo"
                loading="lazy"
                width={48}
                height={48}
                onError={() => setLogoFailed(true)}
              />
            ) : null}
            <div
              className="server-icon"
              style={{ display: logoUrl && !logoFailed ? 'none' : undefined }}
            >
              {getServerIcon(server.fields.name)}
            </div>
          </div>
          <div className="server-title">
            <h3>{server.fields.name}</h3>
            <div className="server-author">{server.fields.author || ''}</div>
          </div>
          
          {/* Deployment Badge */}
          {deploymentInfo && (
            <div className={`deployment-badge deployment-${deploymentInfo.color}`} 
                 title={`Deployment: ${deploymentInfo.tooltip}`}>
              <span className="badge-icon">{deploymentInfo.icon}</span>
              <span className="badge-text">{deploymentInfo.label}</span>
              {secondaryDeployments.length > 0 && (
                <span className="badge-secondary">+{secondaryDeployments.length}</span>
              )}
            </div>
          )}
        </div>
        
        <div className="server-description">
          {(server.fields.description || '').length > 120
            ? (server.fields.description || '').slice(0, 120).trimEnd() + '…'
            : server.fields.description}
        </div>
        
        {/* Health Status Badge */}
        {(server as any).health_status && (
          <div className="server-health-status">
            <HealthBadge 
              healthStatus={(server as any).health_status}
              lastCommitDate={(server as any).last_commit_date}
              showLabel={true}
            />
          </div>
        )}

        {/* Security Audit Badges */}
        {audit && (
          <div className="security-badges" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <span className="meta-tag" style={{ background: tier?.color + '22', color: tier?.color, border: `1px solid ${tier?.color}44` }} title={`Security Score: ${audit.auditScore}/100 — ${tier?.label}`}>
              {tier?.emoji} {audit.auditScore}
            </span>
            <span className="meta-tag" title={`Transport: ${transportLabel(audit.transport)}`}>
              📡 {transportLabel(audit.transport)}
            </span>
            <span className="meta-tag" title={`Auth: ${audit.authMethod}`}>
              {authLabel(audit.authMethod)}
            </span>
          </div>
        )}

        {/* Green Score Badge */}
        {(server as any).greenScore && (
          <div style={{ marginBottom: '0.5rem' }}>
            <GreenBadge greenScore={(server as any).greenScore} compact />
          </div>
        )}

        {/* Reliability Score Badge */}
        {server.reliability && (
          <div style={{ marginBottom: '0.5rem' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 700,
                background: getReliabilityColor(server.reliability.tier) + '22',
                color: getReliabilityColor(server.reliability.tier),
                border: `1px solid ${getReliabilityColor(server.reliability.tier)}44`,
              }}
              title={`Reliability: ${server.reliability.score}/100 — ${server.reliability.label}`}
            >
              📊 {server.reliability.score}/100
            </span>
          </div>
        )}

        {/* Community Badge */}
        <div style={{ marginBottom: '0.5rem' }}>
          <CommunityBadge serverId={server.id} />
        </div>
        
        <div className="server-meta">
          {server.fields.language && <span className="meta-tag">{server.fields.language}</span>}
          {server.fields.author && (
            <span className="meta-tag">
              {server.fields.author.includes('@') ? 'Official' : 'Community'}
            </span>
          )}
          {server.fields.stars ? <span className="meta-tag">{formatStars(server.fields.stars)}</span> : null}
          
          {/* Enterprise Features Badge */}
          {server.enterprise_features && server.enterprise_features.includes('enterprise_ready') && (
            <span className="meta-tag enterprise-tag" title="Enterprise Ready">
              🏢 Enterprise
            </span>
          )}
        </div>
      </a>
      
      <div className="server-actions">
        <a href={`/server/${slug}`} className="btn btn-primary">
          🔗 View Details
        </a>
        <button
          className="btn btn-secondary copy-btn"
          data-package={server.fields.npm_package || `mcp-${server.fields.name.toLowerCase().replace(/\s+/g, '-')}`}
          onClick={(e) => {
            const btn = e.currentTarget;
            const pkg = btn.dataset.package || '';
            navigator.clipboard?.writeText(`npx ${pkg}`).then(() => {
              const orig = btn.textContent;
              btn.textContent = '✅ Copied!';
              setTimeout(() => { btn.textContent = orig; }, 1500);
            });
          }}
        >
          📋 Copy
        </button>
      </div>
    </div>
  );
}

export default function ServerGrid({ initialServers, total: initialTotal, meta }: Props) {
  const [servers, setServers] = useState<MCPServer[]>(initialServers);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [localOnly, setLocalOnly] = useState(false);
  const deployment = meta?.deployment || 'all';
  const [offset, setOffset] = useState(initialServers.length);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchServers = useCallback(async (
    q: string,
    cat: string,
    dep: string,
    off: number,
    append: boolean,
    local: boolean
  ) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({ offset: String(off), limit: '24' });
      if (cat && cat !== 'all') params.set('category', cat);
      if (dep && dep !== 'all') params.set('deployment', dep);
      if (q.trim()) params.set('search', q.trim());
      if (local) params.set('local_only', 'true');

      const res = await fetch(`/api/servers?${params}`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json() as { servers: MCPServer[]; total: number; hasMore: boolean; nextOffset: number };

      if (append) {
        setServers(prev => [...prev, ...data.servers]);
      } else {
        setServers(data.servers);
      }
      setTotal(data.total);
      setOffset(data.nextOffset);
    } catch {
      // keep current state on error
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // On search/category/deployment/localOnly change, debounce and reset
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchServers(search, category, deployment, 0, false, localOnly);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, category, deployment, localOnly, fetchServers]);

  const hasMore = offset < total;

  return (
    <>
      <div className="search-section">
        <h2 className="search-section-heading">
          Explore {total || initialTotal} Verified Servers
        </h2>
        <div className="search-bar">
          <span className="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search MCP servers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="categories">
          {CATEGORIES.map(cat => (
            <span
              key={cat.value}
              className={`category-tag${category === cat.value ? ' active' : ''}`}
              data-category={cat.value}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </span>
          ))}
        </div>
        
        {/* Local-Only (stdio) Toggle */}
        <div className="filter-toggles" style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'center' }}>
          <label className="local-only-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: localOnly ? '#22c55e' : '#94a3b8', fontWeight: localOnly ? 600 : 400, userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={localOnly}
              onChange={e => setLocalOnly(e.target.checked)}
              style={{ accentColor: '#22c55e', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            💻 Local-Only (stdio)
          </label>
          {localOnly && (
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Showing stdio servers with local-only data residency
            </span>
          )}
        </div>
      </div>

      <div className="servers-grid" id="serversGrid">
        {loading
          ? Array.from({ length: 24 }).map((_, i) => <SkeletonCard key={i} />)
          : servers.map(server => <ServerCard key={server.id} server={server} />)}
      </div>

      {!loading && hasMore && (
        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
            onClick={() => fetchServers(search, category, deployment, offset, true, localOnly)}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading…' : `Load More (${total - offset} remaining)`}
          </button>
        </div>
      )}
    </>
  );
}

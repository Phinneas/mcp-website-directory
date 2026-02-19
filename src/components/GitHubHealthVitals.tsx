import React, { useState, useEffect } from 'react';
import { fetchGitHubHealthVitals, calculateHealthScore, getHealthStatus } from '../utils/githubApi';

interface HealthMetrics {
  repoInfo: {
    owner: string;
    repo: string;
  };
  freshness: {
    commitVelocity: number;
    daysSinceLastRelease: number | null;
    lastReleaseDate: string | null;
    hasReleases: boolean;
  };
  health: {
    issueResolutionRate: number;
    openIssues: number;
    closedIssues: number;
    totalIssues: number;
  };
  community: {
    totalStars: number;
    starsGained30Days: number;
    starGrowthRate: number;
  };
  lastUpdated?: string;
}

interface GitHubHealthVitalsProps {
  githubUrl: string;
  token?: string;
}

export default function GitHubHealthVitals({ githubUrl, token }: GitHubHealthVitalsProps) {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    async function loadHealthMetrics() {
      setLoading(true);
      setError(null);

      try {
        const data: any = await fetchGitHubHealthVitals(githubUrl, token);
        
        if (data.error) {
          setError(data.error);
          return;
        }

        setHealthMetrics(data);
        const healthScore = calculateHealthScore(data);
        setScore(healthScore);
        setStatus(getHealthStatus(healthScore));

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load health metrics');
      } finally {
        setLoading(false);
      }
    }

    loadHealthMetrics();
  }, [githubUrl, token]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (!healthMetrics) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
        <p className="text-sm">No health metrics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Health Score */}
      {score !== null && status && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Overall Health Score</h4>
            <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-gray-900">{score}</div>
            <div className="text-xs text-gray-600">out of 100</div>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                score >= 80 ? 'bg-green-500' :
                score >= 60 ? 'bg-blue-500' :
                score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}

      {/* Commit Velocity */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-1">Commit Velocity</h5>
            <p className="text-xs text-gray-600">Commits in last 30 days</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {healthMetrics.freshness.commitVelocity}
            </div>
            <div className="text-xs text-gray-600">commits</div>
          </div>
        </div>
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${Math.min((healthMetrics.freshness.commitVelocity / 60) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Issue Resolution Rate */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-1">Issue Resolution</h5>
            <p className="text-xs text-gray-600">
              {healthMetrics.health.closedIssues} of {healthMetrics.health.totalIssues} issues closed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {healthMetrics.health.issueResolutionRate}%
            </div>
            <div className="text-xs text-gray-600">resolution rate</div>
          </div>
        </div>
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${healthMetrics.health.issueResolutionRate}%` }}
          />
        </div>
        <div className="mt-2 flex gap-2 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            {healthMetrics.health.openIssues} open
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {healthMetrics.health.closedIssues} closed
          </span>
        </div>
      </div>

      {/* Release Freshness */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-1">Release Freshness</h5>
            <p className="text-xs text-gray-600">
              {healthMetrics.freshness.hasReleases
                ? `Last release: ${new Date(healthMetrics.freshness.lastReleaseDate!).toLocaleDateString()}`
                : 'No releases published'}
            </p>
          </div>
          <div className="text-right">
            {healthMetrics.freshness.hasReleases && healthMetrics.freshness.daysSinceLastRelease !== null ? (
              <>
                <div className="text-2xl font-bold text-gray-900">
                  {healthMetrics.freshness.daysSinceLastRelease}
                </div>
                <div className="text-xs text-gray-600">days ago</div>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-400">—</div>
            )}
          </div>
        </div>
        {healthMetrics.freshness.hasReleases && (
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                healthMetrics.freshness.daysSinceLastRelease! <= 30 ? 'bg-green-500' :
                healthMetrics.freshness.daysSinceLastRelease! <= 90 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(10, 100 - healthMetrics.freshness.daysSinceLastRelease!))}%` }}
            />
          </div>
        )}
      </div>

      {/* Community Growth */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-1">Community Growth</h5>
            <p className="text-xs text-gray-600">
              {healthMetrics.community.starsGained30Days} new stars in 30 days
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {healthMetrics.community.totalStars.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">total stars</div>
          </div>
        </div>
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-500"
            style={{ width: `${Math.min((healthMetrics.community.starGrowthRate / 10) * 100, 100)}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-600">
          +{healthMetrics.community.starsGained30Days} stars ({healthMetrics.community.starGrowthRate}% growth)
        </div>
      </div>

      {/* Repository Info */}
      <div className="text-xs text-gray-500 text-center pt-2">
        Data refreshed on {new Date(healthMetrics.lastUpdated || Date.now()).toLocaleDateString()}
      </div>
    </div>
  );
}

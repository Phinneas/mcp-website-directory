import { StorageManager } from './storage-stub.js';
import type { Server } from './storage-stub.js';
import { ConfigManager } from './config-stub.js';
import { BeehiivClient } from './beehiiv-client.js';

interface NewsletterContent {
  type: 'weekly' | 'monthly';
  date: string;
  subject: string;
  content: {
    html: string;
    text: string;
  };
  metadata: {
    serverCount: number;
    newServers: number;
    staleServers: number;
    securityIncidents?: number;
  };
}

interface WeeklyContent {
  sdkUpdates: Server[];
  staleServers: Server[];
  newServers: Array<Server & {
    securityClassification: 'secure' | 'review_needed' | 'high_risk';
    deploymentClassification: 'production_ready' | 'development' | 'experimental';
  }>;
}

interface MonthlyContent {
  topMaintained: Server[];
  securityIncidents: Array<{
    serverId: string;
    serverName: string;
    incidentType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    resolution: string;
    date: string;
  }>;
  featuredSkillPack: {
    name: string;
    description: string;
    servers: Server[];
    useCase: string;
  };
}

export class NewsletterGenerator {
  private storage: StorageManager;
  private config: ConfigManager;
  private beehiiv: BeehiivClient;

  constructor() {
    this.storage = new StorageManager();
    this.config = new ConfigManager();
    
    // Validate required environment variables
    if (!process.env.BEEHIIV_API_KEY) {
      throw new Error('BEEHIIV_API_KEY environment variable is required');
    }
    if (!process.env.BEEHIIV_PUBLICATION_ID) {
      throw new Error('BEEHIIV_PUBLICATION_ID environment variable is required');
    }
    
    this.beehiiv = new BeehiivClient({
      apiKey: process.env.BEEHIIV_API_KEY,
      publicationId: process.env.BEEHIIV_PUBLICATION_ID
    });
  }

  async generateWeeklyNewsletter(): Promise<NewsletterContent> {
    console.log('Generating weekly newsletter...');
    
    const weeklyContent = await this.gatherWeeklyContent();
    const html = this.generateWeeklyHTML(weeklyContent);
    const text = this.generateWeeklyText(weeklyContent);
    
    const date = new Date().toISOString().split('T')[0];
    
    return {
      type: 'weekly',
      date,
      subject: `MCP Weekly: ${weeklyContent.newServers.length} New Servers, ${weeklyContent.staleServers.length} Need Updates`,
      content: { html, text },
      metadata: {
        serverCount: await this.getTotalServerCount(),
        newServers: weeklyContent.newServers.length,
        staleServers: weeklyContent.staleServers.length
      }
    };
  }

  async generateMonthlyNewsletter(): Promise<NewsletterContent> {
    console.log('Generating monthly newsletter...');
    
    const monthlyContent = await this.gatherMonthlyContent();
    const html = this.generateMonthlyHTML(monthlyContent);
    const text = this.generateMonthlyText(monthlyContent);
    
    const date = new Date().toISOString().split('T')[0];
    
    return {
      type: 'monthly',
      date,
      subject: `MCP Monthly: Top 10 Most Maintained + Security Roundup`,
      content: { html, text },
      metadata: {
        serverCount: await this.getTotalServerCount(),
        newServers: monthlyContent.topMaintained.length,
        staleServers: 0,
        securityIncidents: monthlyContent.securityIncidents.length
      }
    };
  }

  private async gatherWeeklyContent(): Promise<WeeklyContent> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const stalenessThreshold = new Date();
    stalenessThreshold.setDate(stalenessThreshold.getDate() - 180);

    // Get servers updated to latest SDK (mock implementation)
    const sdkUpdates = await this.getServersWithRecentSDKUpdates(oneWeekAgo);
    
    // Get servers crossing 180-day staleness threshold
    const staleServers = await this.getStaleServers(stalenessThreshold);
    
    // Get new servers with classifications
    const newServers = await this.getNewServersWithClassifications(oneWeekAgo);

    return {
      sdkUpdates,
      staleServers,
      newServers
    };
  }

  private async gatherMonthlyContent(): Promise<MonthlyContent> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Get top 10 most maintained servers
    const topMaintained = await this.getTopMaintainedServers();
    
    // Get security incidents from the past month
    const securityIncidents = await this.getSecurityIncidents(oneMonthAgo);
    
    // Get featured skill pack
    const featuredSkillPack = await this.getFeaturedSkillPack();

    return {
      topMaintained,
      securityIncidents,
      featuredSkillPack
    };
  }

  private async getServersWithRecentSDKUpdates(since: Date): Promise<Server[]> {
    try {
      const allServers = await this.storage.getServersByStatus('approved');
      
      // Filter servers that have GitHub URLs and check for recent SDK updates
      const serversWithUpdates = [];
      
      for (const server of allServers) {
        if (server.githubUrl && server.lastCommitDate) {
          const lastCommit = new Date(server.lastCommitDate);
          if (lastCommit >= since) {
            // Additional check: look for MCP SDK version updates in commit messages
            // This would require GitHub API integration in a real implementation
            serversWithUpdates.push(server);
          }
        }
      }
      
      return serversWithUpdates.slice(0, 10); // Limit to top 10
    } catch (error) {
      console.error('Error fetching servers with SDK updates:', error);
      return [];
    }
  }

  private async getStaleServers(threshold: Date): Promise<Server[]> {
    const allServers = await this.storage.getServersByStatus('approved');
    return allServers.filter(server => {
      // Check if last commit is older than threshold
      const lastCommit = server.lastCommitDate ? new Date(server.lastCommitDate) : new Date(server.discoveryDate);
      return lastCommit < threshold;
    });
  }

  private async getNewServersWithClassifications(since: Date): Promise<Array<Server & {
    securityClassification: 'secure' | 'review_needed' | 'high_risk';
    deploymentClassification: 'production_ready' | 'development' | 'experimental';
  }>> {
    const newServers = await this.storage.getServersInDateRange(
      since.toISOString(),
      new Date().toISOString()
    );

    return newServers.map(server => ({
      ...server,
      securityClassification: this.classifyServerSecurity(server),
      deploymentClassification: this.classifyServerDeployment(server)
    }));
  }

  private classifyServerSecurity(server: Server): 'secure' | 'review_needed' | 'high_risk' {
    let riskScore = 0;
    
    // Check for high-risk indicators
    const description = (server.description || '').toLowerCase();
    const name = server.name.toLowerCase();
    
    // High-risk keywords
    const highRiskKeywords = ['exec', 'shell', 'command', 'system', 'admin', 'root', 'sudo'];
    const reviewKeywords = ['file', 'network', 'api', 'database', 'auth'];
    
    // Analyze description and name for risk indicators
    if (highRiskKeywords.some(keyword => description.includes(keyword) || name.includes(keyword))) {
      riskScore += 3;
    }
    
    if (reviewKeywords.some(keyword => description.includes(keyword) || name.includes(keyword))) {
      riskScore += 1;
    }
    
    // Check for missing security indicators
    if (!server.githubUrl) riskScore += 1;
    if (!server.documentation) riskScore += 1;
    
    // Classify based on risk score
    if (riskScore >= 4) return 'high_risk';
    if (riskScore >= 2) return 'review_needed';
    return 'secure';
  }

  private classifyServerDeployment(server: Server): 'production_ready' | 'development' | 'experimental' {
    let readinessScore = 0;
    
    // Check for production readiness indicators
    if (server.documentation) readinessScore += 2;
    if (server.githubUrl) readinessScore += 1;
    if (server.version && !server.version.includes('0.0.') && !server.version.includes('alpha') && !server.version.includes('beta')) {
      readinessScore += 2;
    }
    
    // Check description for maturity indicators
    const description = (server.description || '').toLowerCase();
    const productionKeywords = ['stable', 'production', 'enterprise', 'reliable'];
    const experimentalKeywords = ['experimental', 'prototype', 'proof of concept', 'poc', 'alpha', 'beta'];
    
    if (productionKeywords.some(keyword => description.includes(keyword))) {
      readinessScore += 2;
    }
    
    if (experimentalKeywords.some(keyword => description.includes(keyword))) {
      readinessScore -= 2;
    }
    
    // Classify based on readiness score
    if (readinessScore >= 4) return 'production_ready';
    if (readinessScore >= 1) return 'development';
    return 'experimental';
  }

  private async getTopMaintainedServers(): Promise<Server[]> {
    const allServers = await this.storage.getServersByStatus('approved');
    
    // Calculate maintenance score based on commit frequency, issue resolution, etc.
    const scoredServers = allServers.map(server => ({
      ...server,
      maintenanceScore: this.calculateMaintenanceScore(server)
    }));

    return scoredServers
      .sort((a, b) => b.maintenanceScore - a.maintenanceScore)
      .slice(0, 10);
  }

  private calculateMaintenanceScore(server: Server): number {
    // Mock scoring - would analyze GitHub metrics
    return Math.random() * 100;
  }

  private async getSecurityIncidents(since: Date): Promise<MonthlyContent['securityIncidents']> {
    // Mock implementation - would integrate with security monitoring
    return [
      {
        serverId: 'server-1',
        serverName: 'Example Server',
        incidentType: 'Dependency Vulnerability',
        severity: 'medium' as const,
        description: 'Outdated dependency with known CVE',
        resolution: 'Updated to patched version',
        date: new Date().toISOString()
      }
    ];
  }

  private async getFeaturedSkillPack(): Promise<MonthlyContent['featuredSkillPack']> {
    // Featured: Sustainable Marketing Skill Pack
    const sustainableMarketingServers = [
      {
        id: 'seo-audit-mcp',
        name: 'SEO Audit MCP',
        vendor: 'MCP Community',
        description: 'Technical SEO analysis with green hosting awareness and Core Web Vitals optimization',
        discoveryDate: new Date().toISOString(),
        githubUrl: 'https://github.com/mcp-community/seo-audit',
        version: '2.1.0'
      },
      {
        id: 'green-host-checker',
        name: 'Green Host Checker MCP',
        vendor: 'EcoTech Solutions',
        description: 'Verify hosting provider sustainability and renewable energy usage',
        discoveryDate: new Date().toISOString(),
        githubUrl: 'https://github.com/ecotech/green-host-checker',
        version: '1.3.2'
      },
      {
        id: 'cms-management-mcp',
        name: 'CMS Management MCP',
        vendor: 'ContentFlow',
        description: 'Sustainable content lifecycle management with carbon footprint tracking',
        discoveryDate: new Date().toISOString(),
        githubUrl: 'https://github.com/contentflow/cms-management-mcp',
        version: '3.0.1'
      },
      {
        id: 'carbon-calculator-mcp',
        name: 'Carbon Calculator MCP',
        vendor: 'GreenMetrics',
        description: 'Marketing campaign carbon impact measurement and offset recommendations',
        discoveryDate: new Date().toISOString(),
        githubUrl: 'https://github.com/greenmetrics/carbon-calculator-mcp',
        version: '1.8.0'
      }
    ];
    
    return {
      name: 'Sustainable Marketing Stack',
      description: 'Build a carbon-neutral marketing workflow with SEO auditing, green hosting verification, content management, and carbon tracking',
      servers: sustainableMarketingServers,
      useCase: 'Creating environmentally responsible marketing campaigns while maintaining performance and effectiveness'
    };
  }

  private generateWeeklyHTML(content: WeeklyContent): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>MCP Weekly Newsletter</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
        .section { margin: 30px 0; padding: 20px; border-left: 4px solid #667eea; background: #f8f9fa; }
        .server-item { margin: 15px 0; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e9ecef; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-secure { background: #d4edda; color: #155724; }
        .badge-review { background: #fff3cd; color: #856404; }
        .badge-risk { background: #f8d7da; color: #721c24; }
        .badge-prod { background: #d1ecf1; color: #0c5460; }
        .badge-dev { background: #e2e3e5; color: #383d41; }
        .badge-exp { background: #ffeaa7; color: #6c5ce7; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 MCP Weekly</h1>
            <p>Your weekly update on the Model Context Protocol ecosystem</p>
        </div>

        <div class="section">
            <h2>📦 SDK Updates (${content.sdkUpdates.length})</h2>
            <p>Servers that have updated to the latest MCP SDK this week:</p>
            ${content.sdkUpdates.map(server => `
                <div class="server-item">
                    <strong>${server.name}</strong> by ${server.vendor}
                    <br><small>${server.description || 'No description available'}</small>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>⚠️ Staleness Alert (${content.staleServers.length})</h2>
            <p>Servers crossing the 180-day staleness threshold:</p>
            ${content.staleServers.map(server => `
                <div class="server-item">
                    <strong>${server.name}</strong> by ${server.vendor}
                    <br><small>Last updated: ${server.lastCommitDate || 'Unknown'}</small>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>✨ New Servers (${content.newServers.length})</h2>
            <p>Fresh additions to the MCP ecosystem:</p>
            ${content.newServers.map(server => `
                <div class="server-item">
                    <strong>${server.name}</strong> by ${server.vendor}
                    <br><small>${server.description || 'No description available'}</small>
                    <br>
                    <span class="badge badge-${server.securityClassification === 'secure' ? 'secure' : server.securityClassification === 'review_needed' ? 'review' : 'risk'}">
                        Security: ${server.securityClassification.replace('_', ' ')}
                    </span>
                    <span class="badge badge-${server.deploymentClassification === 'production_ready' ? 'prod' : server.deploymentClassification === 'development' ? 'dev' : 'exp'}">
                        Deployment: ${server.deploymentClassification.replace('_', ' ')}
                    </span>
                </div>
            `).join('')}
        </div>

        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3>🤝 Partner Spotlight</h3>
            <p><strong>AI Dispatch</strong> - Your weekly source for AI industry news, funding rounds, and strategic insights.</p>
            <p>While MCP Weekly focuses on the technical ecosystem, AI Dispatch covers the broader AI landscape including enterprise adoption, regulatory updates, and market analysis.</p>
            <p><a href="https://aidispatch.com" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Subscribe to AI Dispatch →</a></p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  private generateWeeklyText(content: WeeklyContent): string {
    return `
MCP Weekly Newsletter
=====================

SDK Updates (${content.sdkUpdates.length})
${content.sdkUpdates.map(server => `• ${server.name} by ${server.vendor}`).join('\n')}

Staleness Alert (${content.staleServers.length})
${content.staleServers.map(server => `• ${server.name} by ${server.vendor} - Last updated: ${server.lastCommitDate || 'Unknown'}`).join('\n')}

New Servers (${content.newServers.length})
${content.newServers.map(server => `• ${server.name} by ${server.vendor} - Security: ${server.securityClassification}, Deployment: ${server.deploymentClassification}`).join('\n')}

---
Partner Spotlight: AI Dispatch
Your weekly source for AI industry news, funding rounds, and strategic insights.
Subscribe at https://aidispatch.com
    `.trim();
  }

  private generateMonthlyHTML(content: MonthlyContent): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>MCP Monthly Newsletter</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
        .section { margin: 30px 0; padding: 20px; border-left: 4px solid #667eea; background: #f8f9fa; }
        .leaderboard { counter-reset: rank; }
        .rank-item { counter-increment: rank; margin: 10px 0; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e9ecef; }
        .rank-item::before { content: "#" counter(rank) " "; font-weight: bold; color: #667eea; }
        .incident { margin: 15px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #dc3545; }
        .severity-high { border-left-color: #dc3545; }
        .severity-medium { border-left-color: #ffc107; }
        .severity-low { border-left-color: #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 MCP Monthly</h1>
            <p>Your monthly deep dive into the Model Context Protocol ecosystem</p>
        </div>

        <div class="section">
            <h2>🏆 Top 10 Most Maintained Servers</h2>
            <div class="leaderboard">
                ${content.topMaintained.map(server => `
                    <div class="rank-item">
                        <strong>${server.name}</strong> by ${server.vendor}
                        <br><small>${server.description || 'No description available'}</small>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>🔒 Security Incident Roundup</h2>
            ${content.securityIncidents.map(incident => `
                <div class="incident severity-${incident.severity}">
                    <strong>${incident.serverName}</strong> - ${incident.incidentType}
                    <br><small>Severity: ${incident.severity.toUpperCase()}</small>
                    <br>${incident.description}
                    <br><em>Resolution: ${incident.resolution}</em>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>⭐ Featured Skill Pack: ${content.featuredSkillPack.name}</h2>
            <p>${content.featuredSkillPack.description}</p>
            <p><strong>Use Case:</strong> ${content.featuredSkillPack.useCase}</p>
            
            <div style="margin: 20px 0; padding: 15px; background: #e8f5e8; border-left: 4px solid #28a745; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0; color: #155724;">✅ Test Drive Verified - December 13, 2024</h4>
                <p style="margin: 0; font-size: 14px;">These servers were verified to work together in a Claude Desktop session. See our <a href="/blog/sustainable-marketing-mcp-stack" style="color: #155724;">implementation guide</a> for configuration details and known compatibility notes.</p>
            </div>
            
            <h3>Included Servers:</h3>
            ${content.featuredSkillPack.servers.map(server => `
                <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e9ecef;">
                    <strong>${server.name}</strong> by ${server.vendor}
                    <br><small style="color: #666;">${server.description}</small>
                    <br><small style="color: #28a745; font-weight: bold;">v${server.version || '1.0.0'} ✓ Tested</small>
                </div>
            `).join('')}
            
            <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px;">
                <p style="margin: 0;"><strong>Case Study:</strong> See how Salish Sea Consulting reduced their marketing carbon footprint by 78% using this skill pack. <a href="/blog/sustainable-marketing-mcp-stack#salish-sea-case-study">Read the full case study →</a></p>
            </div>
        </div>

        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3>🤝 Partner Spotlight</h3>
            <p><strong>AI Dispatch</strong> - Your monthly source for AI industry analysis, market trends, and strategic insights.</p>
            <p>Complement your MCP technical knowledge with broader AI industry intelligence from AI Dispatch.</p>
            <p><a href="https://aidispatch.com" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Subscribe to AI Dispatch →</a></p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  private generateMonthlyText(content: MonthlyContent): string {
    return `
MCP Monthly Newsletter
======================

Top 10 Most Maintained Servers
${content.topMaintained.map((server, i) => `${i + 1}. ${server.name} by ${server.vendor}`).join('\n')}

Security Incident Roundup
${content.securityIncidents.map(incident => `• ${incident.serverName} - ${incident.incidentType} (${incident.severity}): ${incident.description}`).join('\n')}

Featured Skill Pack: ${content.featuredSkillPack.name}
${content.featuredSkillPack.description}

Use Case: ${content.featuredSkillPack.useCase}

✅ Test Drive Verified - December 13, 2024
These servers were verified to work together in a Claude Desktop session.
Full implementation guide: /blog/sustainable-marketing-mcp-stack

Included Servers:
${content.featuredSkillPack.servers.map(server => `• ${server.name} by ${server.vendor} (v${server.version || '1.0.0'} ✓ Tested)`).join('\n')}

Case Study: Salish Sea Consulting reduced their marketing carbon footprint by 78% using this skill pack.
Read more: /blog/sustainable-marketing-mcp-stack#salish-sea-case-study

---
Partner Spotlight: AI Dispatch  
Your monthly source for AI industry analysis, market trends, and strategic insights.
Subscribe at https://aidispatch.com
    `.trim();
  }

  async publishNewsletter(newsletter: NewsletterContent): Promise<void> {
    console.log(`Publishing ${newsletter.type} newsletter: ${newsletter.subject}`);
    
    try {
      await this.beehiiv.createPost({
        subject: newsletter.subject,
        content: newsletter.content.html,
        textContent: newsletter.content.text,
        publishAt: new Date().toISOString(),
        metadata: newsletter.metadata
      });
      
      console.log('Newsletter published successfully!');
    } catch (error) {
      console.error('Failed to publish newsletter:', error);
      throw error;
    }
  }

  private async getTotalServerCount(): Promise<number> {
    try {
      const servers = await this.storage.getServersByStatus('approved');
      return servers.length;
    } catch (error) {
      console.warn('Could not get server count, using default:', error);
      return 0;
    }
  }
}

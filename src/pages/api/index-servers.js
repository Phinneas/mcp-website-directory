import { initializeIndex, indexServers, getIndexStats } from '../../utils/meilisearch.js';
import { getMCPServers } from '../../utils/teableApi.js';

export async function POST({ request }) {
  try {
    // Check if request has proper authorization (you might want to add API key validation)
    const authHeader = request.headers.get('Authorization');
    const expectedToken = import.meta.env.MEILISEARCH_ADMIN_KEY;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Initialize the index
    await initializeIndex();

    // Get servers from Teable or use static data
    let servers = [];
    try {
      servers = await getMCPServers();
    } catch (error) {
      console.error('Failed to fetch from Teable, using static data for indexing');
      // Use static fallback data for indexing
      servers = [
        {
          id: 'github-mcp',
          fields: {
            name: 'GitHub MCP Server',
            description: 'Access GitHub repositories, issues, and pull requests directly through MCP. Perfect for AI assistants that need to interact with code repositories.',
            author: '@modelcontextprotocol',
            category: 'development',
            language: 'TypeScript',
            stars: 1200,
            github_url: 'https://github.com/modelcontextprotocol/servers',
            npm_package: '@modelcontextprotocol/server-github'
          }
        },
        {
          id: 'filesystem-mcp',
          fields: {
            name: 'File System MCP',
            description: 'Secure file operations with configurable access controls. Read, write, and manage files safely through AI conversations.',
            author: '@anthropic',
            category: 'productivity',
            language: 'Python',
            stars: 890,
            github_url: 'https://github.com/anthropics/mcp-filesystem',
            npm_package: '@anthropic/mcp-filesystem'
          }
        },
        {
          id: 'web-scraper-mcp',
          fields: {
            name: 'Web Scraper MCP',
            description: 'Extract and analyze web content efficiently. Built with Puppeteer for JavaScript-heavy sites and dynamic content.',
            author: '@community',
            category: 'web-scraping',
            language: 'JavaScript',
            stars: 654,
            github_url: 'https://github.com/mcp-community/web-scraper',
            npm_package: '@mcp/web-scraper'
          }
        },
        {
          id: 'database-mcp',
          fields: {
            name: 'Database MCP',
            description: 'Connect to PostgreSQL, MySQL, and SQLite databases. Execute queries and manage database operations through natural language.',
            author: '@dbtools',
            category: 'database',
            language: 'Go',
            stars: 432,
            github_url: 'https://github.com/dbtools/mcp-database',
            npm_package: '@dbtools/mcp-database'
          }
        },
        {
          id: 'slack-mcp',
          fields: {
            name: 'Slack MCP Server',
            description: 'Send messages, read channels, and manage Slack workspaces. Perfect for AI assistants that need to interact with team communication.',
            author: '@slackapi',
            category: 'communication',
            language: 'Python',
            stars: 567,
            github_url: 'https://github.com/slackapi/mcp-slack',
            npm_package: '@slack/mcp-server'
          }
        },
        {
          id: 'aws-mcp',
          fields: {
            name: 'AWS MCP Server',
            description: 'Manage AWS resources through MCP. Control EC2 instances, S3 buckets, and other AWS services with AI assistance.',
            author: '@aws-samples',
            category: 'cloud',
            language: 'Python',
            stars: 789,
            github_url: 'https://github.com/aws-samples/mcp-aws',
            npm_package: '@aws/mcp-server'
          }
        }
      ];
    }

    if (servers.length === 0) {
      return new Response(JSON.stringify({
        error: 'No servers found to index'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Index the servers
    const indexTask = await indexServers(servers);
    
    // Get updated stats
    const stats = await getIndexStats();

    return new Response(JSON.stringify({
      message: 'Servers indexed successfully',
      indexed: servers.length,
      task: indexTask,
      stats
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Indexing error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to index servers',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function GET() {
  try {
    const stats = await getIndexStats();
    
    return new Response(JSON.stringify({
      stats,
      message: 'Index statistics retrieved successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to get index statistics',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
/**
 * Compatibility Matrix - Client × Server compatibility data
 * Tracks which MCP servers work with which clients
 */

export const compatibilityMatrix = {
  // Client definitions
  clients: {
    'claude-desktop': {
      name: 'Claude Desktop',
      icon: '🤖',
      transport: ['stdio', 'sse'],
      version: '0.4.0+',
      popularity: 95
    },
    'cursor': {
      name: 'Cursor',
      icon: '✨',
      transport: ['stdio'],
      version: '0.40+',
      popularity: 85
    },
    'cline': {
      name: 'Cline (VS Code)',
      icon: '🔧',
      transport: ['stdio'],
      version: '3.0+',
      popularity: 80
    },
    'continue': {
      name: 'Continue (VS Code)',
      icon: '▶️',
      transport: ['stdio', 'sse'],
      version: '0.8+',
      popularity: 75
    },
    'vscode': {
      name: 'VS Code (Official)',
      icon: '💻',
      transport: ['stdio', 'sse'],
      version: '1.95+',
      popularity: 90
    },
    'windsurf': {
      name: 'Windsurf',
      icon: '🌊',
      transport: ['stdio'],
      version: '1.0+',
      popularity: 70
    },
    'zed': {
      name: 'Zed',
      icon: '⚡',
      transport: ['stdio'],
      version: '0.140+',
      popularity: 60
    }
  },

  // Server transport requirements
  serverTransports: {
    'github-mcp': { supports: ['stdio'], recommended: 'stdio' },
    'filesystem-mcp': { supports: ['stdio'], recommended: 'stdio' },
    'puppeteer-mcp': { supports: ['stdio'], recommended: 'stdio' },
    'postgres-mcp': { supports: ['stdio', 'sse'], recommended: 'stdio' },
    'sqlite-mcp': { supports: ['stdio'], recommended: 'stdio' },
    'gdrive-mcp': { supports: ['stdio', 'sse'], recommended: 'stdio' },
    'mindsdb-mcp': { supports: ['sse'], recommended: 'sse' },
    'activepieces-mcp': { supports: ['sse'], recommended: 'sse' },
    'fastmcp': { supports: ['stdio', 'sse'], recommended: 'stdio' },
    'aws-mcp': { supports: ['stdio'], recommended: 'stdio' },
    'azure-mcp': { supports: ['stdio'], recommended: 'stdio' },
    'gcp-mcp': { supports: ['stdio'], recommended: 'stdio' },
    'slack-mcp': { supports: ['stdio', 'sse'], recommended: 'stdio' },
    'discord-mcp': { supports: ['stdio'], recommended: 'stdio' },
    'langchain-mcp': { supports: ['sse'], recommended: 'sse' },
    'llamaindex-mcp': { supports: ['sse'], recommended: 'sse' },
    'kubernetes-mcp': { supports: ['stdio'], recommended: 'stdio' },
    'terraform-mcp': { supports: ['stdio'], recommended: 'stdio' }
  },

  // Compatibility status: 'yes', 'partial', 'no', 'unknown'
  compatibility: {
    'claude-desktop': {
      'github-mcp': 'yes',
      'filesystem-mcp': 'yes',
      'puppeteer-mcp': 'yes',
      'postgres-mcp': 'yes',
      'sqlite-mcp': 'yes',
      'gdrive-mcp': 'yes',
      'mindsdb-mcp': 'yes',
      'activepieces-mcp': 'yes',
      'fastmcp': 'yes',
      'aws-mcp': 'yes',
      'azure-mcp': 'yes',
      'gcp-mcp': 'yes',
      'slack-mcp': 'yes',
      'discord-mcp': 'yes',
      'langchain-mcp': 'yes',
      'llamaindex-mcp': 'yes',
      'kubernetes-mcp': 'yes',
      'terraform-mcp': 'yes'
    },
    'cursor': {
      'github-mcp': 'yes',
      'filesystem-mcp': 'yes',
      'puppeteer-mcp': 'yes',
      'postgres-mcp': 'yes',
      'sqlite-mcp': 'yes',
      'gdrive-mcp': 'yes',
      'mindsdb-mcp': 'no', // Requires SSE
      'activepieces-mcp': 'no', // Requires SSE
      'fastmcp': 'yes',
      'aws-mcp': 'yes',
      'azure-mcp': 'yes',
      'gcp-mcp': 'yes',
      'slack-mcp': 'yes',
      'discord-mcp': 'yes',
      'langchain-mcp': 'no', // Requires SSE
      'llamaindex-mcp': 'no', // Requires SSE
      'kubernetes-mcp': 'yes',
      'terraform-mcp': 'yes'
    },
    'cline': {
      'github-mcp': 'yes',
      'filesystem-mcp': 'yes',
      'puppeteer-mcp': 'yes',
      'postgres-mcp': 'yes',
      'sqlite-mcp': 'yes',
      'gdrive-mcp': 'yes',
      'mindsdb-mcp': 'no',
      'activepieces-mcp': 'no',
      'fastmcp': 'yes',
      'aws-mcp': 'yes',
      'azure-mcp': 'yes',
      'gcp-mcp': 'yes',
      'slack-mcp': 'yes',
      'discord-mcp': 'yes',
      'langchain-mcp': 'no',
      'llamaindex-mcp': 'no',
      'kubernetes-mcp': 'yes',
      'terraform-mcp': 'yes'
    },
    'continue': {
      'github-mcp': 'yes',
      'filesystem-mcp': 'yes',
      'puppeteer-mcp': 'yes',
      'postgres-mcp': 'yes',
      'sqlite-mcp': 'yes',
      'gdrive-mcp': 'yes',
      'mindsdb-mcp': 'yes',
      'activepieces-mcp': 'yes',
      'fastmcp': 'yes',
      'aws-mcp': 'yes',
      'azure-mcp': 'yes',
      'gcp-mcp': 'yes',
      'slack-mcp': 'yes',
      'discord-mcp': 'yes',
      'langchain-mcp': 'yes',
      'llamaindex-mcp': 'yes',
      'kubernetes-mcp': 'yes',
      'terraform-mcp': 'yes'
    },
    'vscode': {
      'github-mcp': 'yes',
      'filesystem-mcp': 'yes',
      'puppeteer-mcp': 'yes',
      'postgres-mcp': 'yes',
      'sqlite-mcp': 'yes',
      'gdrive-mcp': 'yes',
      'mindsdb-mcp': 'yes',
      'activepieces-mcp': 'yes',
      'fastmcp': 'yes',
      'aws-mcp': 'yes',
      'azure-mcp': 'yes',
      'gcp-mcp': 'yes',
      'slack-mcp': 'yes',
      'discord-mcp': 'yes',
      'langchain-mcp': 'yes',
      'llamaindex-mcp': 'yes',
      'kubernetes-mcp': 'yes',
      'terraform-mcp': 'yes'
    },
    'windsurf': {
      'github-mcp': 'yes',
      'filesystem-mcp': 'yes',
      'puppeteer-mcp': 'yes',
      'postgres-mcp': 'yes',
      'sqlite-mcp': 'yes',
      'gdrive-mcp': 'yes',
      'mindsdb-mcp': 'no',
      'activepieces-mcp': 'no',
      'fastmcp': 'yes',
      'aws-mcp': 'yes',
      'azure-mcp': 'yes',
      'gcp-mcp': 'yes',
      'slack-mcp': 'yes',
      'discord-mcp': 'yes',
      'langchain-mcp': 'no',
      'llamaindex-mcp': 'no',
      'kubernetes-mcp': 'yes',
      'terraform-mcp': 'yes'
    },
    'zed': {
      'github-mcp': 'yes',
      'filesystem-mcp': 'yes',
      'puppeteer-mcp': 'yes',
      'postgres-mcp': 'yes',
      'sqlite-mcp': 'yes',
      'gdrive-mcp': 'yes',
      'mindsdb-mcp': 'no',
      'activepieces-mcp': 'no',
      'fastmcp': 'yes',
      'aws-mcp': 'yes',
      'azure-mcp': 'yes',
      'gcp-mcp': 'yes',
      'slack-mcp': 'yes',
      'discord-mcp': 'yes',
      'langchain-mcp': 'no',
      'llamaindex-mcp': 'no',
      'kubernetes-mcp': 'yes',
      'terraform-mcp': 'yes'
    }
  },

  // Known issues/notes
  notes: {
    'cursor:mindsdb-mcp': 'Cursor only supports stdio transport, this server requires SSE',
    'cline:langchain-mcp': 'Cline only supports stdio transport, this server requires SSE',
    'claude-desktop:mindsdb-mcp': 'Requires SSE transport configuration in Claude Desktop config',
    'postgres-mcp': 'Supports both stdio and SSE, but stdio is recommended for most clients',
    'gdrive-mcp': 'Requires OAuth setup, see documentation for each client'
  }
};

/**
 * Get compatibility status for a client-server pair
 */
export function getCompatibility(clientId: string, serverId: string): 'yes' | 'partial' | 'no' | 'unknown' {
  return compatibilityMatrix.compatibility[clientId]?.[serverId] || 'unknown';
}

/**
 * Get note for a client-server pair
 */
export function getCompatibilityNote(clientId: string, serverId: string): string | null {
  return compatibilityMatrix.notes[`${clientId}:${serverId}`] || 
         compatibilityMatrix.notes[serverId] || 
         null;
}

/**
 * Get all compatible clients for a server
 */
export function getCompatibleClients(serverId: string): string[] {
  return Object.entries(compatibilityMatrix.compatibility)
    .filter(([_, servers]) => servers[serverId] === 'yes')
    .map(([clientId]) => clientId);
}

/**
 * Get all compatible servers for a client
 */
export function getCompatibleServers(clientId: string): string[] {
  const clientData = compatibilityMatrix.compatibility[clientId];
  if (!clientData) return [];
  
  return Object.entries(clientData)
    .filter(([_, status]) => status === 'yes')
    .map(([serverId]) => serverId);
}

/**
 * Get servers that require SSE transport
 */
export function getSSEServers(): string[] {
  return Object.entries(compatibilityMatrix.serverTransports)
    .filter(([_, config]) => config.supports.includes('sse') && !config.supports.includes('stdio'))
    .map(([serverId]) => serverId);
}

/**
 * Get transport compatibility info
 */
export function getTransportInfo(clientId: string, serverId: string): {
  clientTransports: string[];
  serverTransports: string[];
  compatible: boolean;
  recommendedTransport: string;
} {
  const client = compatibilityMatrix.clients[clientId];
  const server = compatibilityMatrix.serverTransports[serverId];
  
  if (!client || !server) {
    return {
      clientTransports: [],
      serverTransports: [],
      compatible: false,
      recommendedTransport: 'unknown'
    };
  }
  
  const compatible = client.transport.some(t => server.supports.includes(t));
  
  return {
    clientTransports: client.transport,
    serverTransports: server.supports,
    compatible,
    recommendedTransport: server.recommended
  };
}

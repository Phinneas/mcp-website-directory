// Stub implementation for StorageManager until tavily integration is complete
export interface Server {
  id: string;
  name: string;
  vendor: string;
  description?: string;
  discoveryDate: string;
  lastCommitDate?: string;
  githubUrl?: string;
  documentation?: string;
  version?: string;
}

export type ServerStatus = 'pending' | 'approved' | 'rejected';

export class StorageManager {
  async getServersByStatus(status: ServerStatus): Promise<Server[]> {
    // Mock data for testing
    return [
      {
        id: '1',
        name: 'Example Server 1',
        vendor: 'Example Vendor',
        description: 'A sample MCP server for testing',
        discoveryDate: new Date().toISOString(),
        lastCommitDate: new Date().toISOString(),
        githubUrl: 'https://github.com/example/server1',
        documentation: 'https://docs.example.com',
        version: '1.0.0'
      },
      {
        id: '2',
        name: 'Example Server 2',
        vendor: 'Another Vendor',
        description: 'Another sample MCP server with file system access',
        discoveryDate: new Date().toISOString(),
        lastCommitDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), // 200 days ago
        githubUrl: 'https://github.com/example/server2',
        version: '0.1.0'
      },
      {
        id: '3',
        name: 'Shell Command Server',
        vendor: 'Security Test',
        description: 'Executes shell commands for system administration',
        discoveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        lastCommitDate: new Date().toISOString(),
        githubUrl: 'https://github.com/example/shell-server',
        version: '1.2.0'
      },
      {
        id: '4',
        name: 'Production Database Connector',
        vendor: 'Enterprise Corp',
        description: 'Stable production-ready database integration server',
        discoveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        lastCommitDate: new Date().toISOString(),
        githubUrl: 'https://github.com/example/db-connector',
        documentation: 'https://docs.example.com/db-connector',
        version: '2.1.0'
      }
    ];
  }

  async getServersInDateRange(start: string, end: string): Promise<Server[]> {
    const allServers = await this.getServersByStatus('approved');
    return allServers.filter(server => {
      const serverDate = new Date(server.discoveryDate);
      return serverDate >= new Date(start) && serverDate <= new Date(end);
    });
  }
}

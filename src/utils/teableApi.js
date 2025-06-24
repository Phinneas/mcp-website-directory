import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.TEABLE_API_URL,
  headers: {
    'Authorization': `Bearer ${import.meta.env.TEABLE_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Get all MCP servers from Teable
export async function getMCPServers() {
  try {
    // Get configuration from environment variables (set in Railway)
    const baseId = import.meta.env.TEABLE_BASE_ID;
    const tableId = import.meta.env.TEABLE_TABLE_ID;
    
    if (!baseId || !tableId) {
      console.error('Missing required Teable configuration: TEABLE_BASE_ID or TEABLE_TABLE_ID');
      return [];
    }
    
    const response = await api.get(`/api/base/${baseId}/table/${tableId}/record`);
    return response.data.records || [];
  } catch (error) {
    console.error('Teable API Error:', error);
    return [];
  }
}

// Get a specific MCP server by ID
export async function getMCPServerById(serverId) {
  try {
    const baseId = import.meta.env.TEABLE_BASE_ID;
    const tableId = import.meta.env.TEABLE_TABLE_ID;
    
    if (!baseId || !tableId) {
      console.error('Missing required Teable configuration: TEABLE_BASE_ID or TEABLE_TABLE_ID');
      return null;
    }
    
    const response = await api.get(`/api/base/${baseId}/table/${tableId}/record/${serverId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching MCP server with ID ${serverId}:`, error);
    return null;
  }
}

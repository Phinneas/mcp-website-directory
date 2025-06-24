import axios from 'axios';

// Teable API client
export class TeableClient {
  constructor(apiKey, baseUrl = 'https://api.teable.io') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Get records from a table
  async getRecords(tableId, options = {}) {
    try {
      const { viewId, filter, sort, fields } = options;
      
      const params = new URLSearchParams();
      if (viewId) params.append('viewId', viewId);
      if (filter) params.append('filter', JSON.stringify(filter));
      if (sort) params.append('sort', JSON.stringify(sort));
      if (fields) params.append('fields', fields.join(','));
      
      const response = await this.client.get(`/tables/${tableId}/records?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching records from Teable:', error);
      throw error;
    }
  }

  // Get a single record by ID
  async getRecord(tableId, recordId) {
    try {
      const response = await this.client.get(`/tables/${tableId}/records/${recordId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching record from Teable:', error);
      throw error;
    }
  }

  // Create a new record
  async createRecord(tableId, data) {
    try {
      const response = await this.client.post(`/tables/${tableId}/records`, { records: [{ fields: data }] });
      return response.data;
    } catch (error) {
      console.error('Error creating record in Teable:', error);
      throw error;
    }
  }

  // Update an existing record
  async updateRecord(tableId, recordId, data) {
    try {
      const response = await this.client.patch(`/tables/${tableId}/records/${recordId}`, { fields: data });
      return response.data;
    } catch (error) {
      console.error('Error updating record in Teable:', error);
      throw error;
    }
  }

  // Delete a record
  async deleteRecord(tableId, recordId) {
    try {
      const response = await this.client.delete(`/tables/${tableId}/records/${recordId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record from Teable:', error);
      throw error;
    }
  }
}

// Create a singleton instance
let teableClient = null;

// Initialize the Teable client
export function initTeableClient() {
  const apiKey = import.meta.env.TEABLE_API_KEY;
  const baseUrl = import.meta.env.TEABLE_BASE_URL || 'https://api.teable.io';
  
  if (!apiKey) {
    console.warn('Teable API key not found in environment variables');
    return null;
  }
  
  teableClient = new TeableClient(apiKey, baseUrl);
  return teableClient;
}

// Get the Teable client instance
export function getTeableClient() {
  if (!teableClient) {
    return initTeableClient();
  }
  return teableClient;
}

export default getTeableClient;

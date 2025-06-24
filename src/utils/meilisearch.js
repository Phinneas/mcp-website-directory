import { MeiliSearch } from 'meilisearch';

// Initialize MeiliSearch client
const client = new MeiliSearch({
  host: import.meta.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700',
  apiKey: import.meta.env.MEILISEARCH_API_KEY || '',
});

const INDEX_NAME = 'mcp_servers';

// Initialize the MCP servers index
export async function initializeIndex() {
  try {
    // Create index if it doesn't exist
    await client.createIndex(INDEX_NAME, { primaryKey: 'id' });
    
    // Configure searchable attributes
    await client.index(INDEX_NAME).updateSearchableAttributes([
      'name',
      'description',
      'author',
      'category',
      'language',
      'tags'
    ]);

    // Configure filterable attributes
    await client.index(INDEX_NAME).updateFilterableAttributes([
      'category',
      'language',
      'author',
      'status'
    ]);

    // Configure sortable attributes
    await client.index(INDEX_NAME).updateSortableAttributes([
      'stars',
      'name',
      'created_at'
    ]);

    console.log('MeiliSearch index initialized successfully');
  } catch (error) {
    if (error.code !== 'index_already_exists') {
      console.error('Error initializing MeiliSearch index:', error);
    }
  }
}

// Add or update documents in the index
export async function indexServers(servers) {
  try {
    const index = client.index(INDEX_NAME);
    
    // Prepare documents for indexing
    const documents = servers.map(server => ({
      id: server.id,
      name: server.fields?.name || '',
      description: server.fields?.description || '',
      author: server.fields?.author || '',
      category: server.fields?.category || '',
      language: server.fields?.language || '',
      stars: server.fields?.stars || 0,
      status: server.fields?.status || 'active',
      github_url: server.fields?.github_url || '',
      npm_package: server.fields?.npm_package || '',
      version: server.fields?.version || '',
      created_at: server.fields?.created_at || Date.now(),
      tags: [
        server.fields?.category,
        server.fields?.language,
        server.fields?.author?.replace('@', '')
      ].filter(Boolean)
    }));

    const task = await index.addDocuments(documents);
    console.log('Servers indexed successfully:', task);
    return task;
  } catch (error) {
    console.error('Error indexing servers:', error);
    throw error;
  }
}

// Search servers with MeiliSearch
export async function searchServers(query, options = {}) {
  try {
    const index = client.index(INDEX_NAME);
    
    const searchOptions = {
      limit: options.limit || 20,
      offset: options.offset || 0,
      filter: options.filter || null,
      sort: options.sort || null,
      attributesToHighlight: ['name', 'description'],
      attributesToCrop: ['description'],
      cropLength: 200,
      ...options
    };

    const results = await index.search(query, searchOptions);
    return results;
  } catch (error) {
    console.error('Error searching servers:', error);
    // Fallback to empty results
    return {
      hits: [],
      query,
      processingTimeMs: 0,
      limit: options.limit || 20,
      offset: options.offset || 0,
      estimatedTotalHits: 0
    };
  }
}

// Get servers by category
export async function getServersByCategory(category, options = {}) {
  return await searchServers('', {
    filter: `category = "${category}"`,
    ...options
  });
}

// Get popular servers (sorted by stars)
export async function getPopularServers(options = {}) {
  return await searchServers('', {
    sort: ['stars:desc'],
    ...options
  });
}

// Get recent servers
export async function getRecentServers(options = {}) {
  return await searchServers('', {
    sort: ['created_at:desc'],
    ...options
  });
}

// Delete a server from the index
export async function deleteServer(serverId) {
  try {
    const index = client.index(INDEX_NAME);
    const task = await index.deleteDocument(serverId);
    console.log('Server deleted from index:', task);
    return task;
  } catch (error) {
    console.error('Error deleting server from index:', error);
    throw error;
  }
}

// Get index stats
export async function getIndexStats() {
  try {
    const index = client.index(INDEX_NAME);
    const stats = await index.getStats();
    return stats;
  } catch (error) {
    console.error('Error getting index stats:', error);
    return null;
  }
}

// Health check for MeiliSearch
export async function healthCheck() {
  try {
    const health = await client.health();
    return health.status === 'available';
  } catch (error) {
    console.error('MeiliSearch health check failed:', error);
    return false;
  }
}

export { client };
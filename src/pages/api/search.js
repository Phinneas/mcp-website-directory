import { searchServers, getServersByCategory, healthCheck } from '../../utils/meilisearch.js';

export async function GET({ url, request }) {
  try {
    // Check if MeiliSearch is available
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      return new Response(JSON.stringify({
        error: 'Search service unavailable',
        hits: [],
        query: '',
        processingTimeMs: 0,
        estimatedTotalHits: 0
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    const searchParams = new URL(url).searchParams;
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const sort = searchParams.get('sort');

    let results;

    if (category && category !== 'all') {
      // Filter by category
      results = await getServersByCategory(category, {
        limit,
        offset,
        sort: sort ? [sort] : undefined
      });
    } else {
      // General search
      results = await searchServers(query, {
        limit,
        offset,
        sort: sort ? [sort] : undefined
      });
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      hits: [],
      query: '',
      processingTimeMs: 0,
      estimatedTotalHits: 0
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

export async function POST({ request }) {
  try {
    const { query, options } = await request.json();
    
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      return new Response(JSON.stringify({
        error: 'Search service unavailable'
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const results = await searchServers(query, options);
    
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error) {
    console.error('Search API POST error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
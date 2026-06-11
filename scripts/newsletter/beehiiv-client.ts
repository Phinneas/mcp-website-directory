interface BeehiivConfig {
  apiKey: string;
  publicationId: string;
  baseUrl?: string;
}

interface BeehiivPost {
  subject: string;
  content: string;
  textContent?: string;
  publishAt?: string;
  metadata?: Record<string, any>;
}

interface BeehiivResponse {
  id: string;
  status: 'draft' | 'scheduled' | 'published';
  publishedAt?: string;
  url?: string;
}

export class BeehiivClient {
  private config: BeehiivConfig;

  constructor(config: BeehiivConfig) {
    this.config = {
      baseUrl: 'https://api.beehiiv.com/v2',
      ...config
    };
  }

  async createPost(post: BeehiivPost): Promise<BeehiivResponse> {
    const url = `${this.config.baseUrl}/publications/${this.config.publicationId}/posts`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: post.subject,
        content: post.content,
        content_tags: ['mcp', 'newsletter', 'automation'],
        audience: 'free',
        status: post.publishAt ? 'scheduled' : 'published',
        publish_date: post.publishAt,
        web_content: post.content,
        email_content: post.content,
        plaintext_content: post.textContent
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Beehiiv API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async getPost(postId: string): Promise<BeehiivResponse> {
    const url = `${this.config.baseUrl}/publications/${this.config.publicationId}/posts/${postId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Beehiiv API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async updatePost(postId: string, updates: Partial<BeehiivPost>): Promise<BeehiivResponse> {
    const url = `${this.config.baseUrl}/publications/${this.config.publicationId}/posts/${postId}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Beehiiv API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async deletePost(postId: string): Promise<void> {
    const url = `${this.config.baseUrl}/publications/${this.config.publicationId}/posts/${postId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Beehiiv API error: ${response.status} - ${error}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/publications/${this.config.publicationId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Beehiiv connection test failed:', error);
      return false;
    }
  }
}

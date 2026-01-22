/**
 * Unit tests for logoResolver utility
 * Tests logo resolution and batch processing functionality
 */

import { resolveServerLogo, batchResolveLogos } from '../../src/utils/logoResolver.js';

// Mock fetch for testing
global.fetch = async (url) => {
  // Simulate successful GitHub stats response
  if (url.includes('github-stats')) {
    return {
      ok: true,
      json: async () => ({
        logoUrl: 'https://avatars.githubusercontent.com/u/12345?v=4&s=128',
        logoSource: 'github',
        updatedAt: '2026-01-21T10:00:00Z'
      })
    };
  }
  
  // Simulate error response
  return {
    ok: false,
    status: 404,
    json: async () => ({ error: 'Not found' })
  };
};

describe('resolveServerLogo', () => {
  it('should resolve GitHub avatar for valid repo', async () => {
    const server = {
      id: 'test-1',
      fields: {
        github_url: 'https://github.com/modelcontextprotocol/servers'
      }
    };
    
    const result = await resolveServerLogo(server);
    
    expect(result).toBeDefined();
    expect(result.url).toContain('avatars.githubusercontent.com');
    expect(result.source).toBe('github');
    expect(result.cachedAt).toBeDefined();
  });

  it('should return null for missing GitHub URL', async () => {
    const server = {
      id: 'test-2',
      fields: {}
    };
    
    const result = await resolveServerLogo(server);
    
    expect(result.url).toBeNull();
    expect(result.source).toBeNull();
    expect(result.cachedAt).toBeNull();
  });

  it('should return null for invalid GitHub URL format', async () => {
    const server = {
      id: 'test-3',
      fields: {
        github_url: 'https://example.com/not-github'
      }
    };
    
    const result = await resolveServerLogo(server);
    
    expect(result.url).toBeNull();
    expect(result.source).toBeNull();
  });

  it('should handle null server gracefully', async () => {
    const result = await resolveServerLogo(null);
    
    expect(result.url).toBeNull();
    expect(result.source).toBeNull();
    expect(result.cachedAt).toBeNull();
  });

  it('should handle undefined fields gracefully', async () => {
    const server = {
      id: 'test-4'
    };
    
    const result = await resolveServerLogo(server);
    
    expect(result.url).toBeNull();
    expect(result.source).toBeNull();
  });
});

describe('batchResolveLogos', () => {
  it('should resolve logos for multiple servers', async () => {
    const servers = [
      {
        id: 'srv-1',
        fields: { github_url: 'https://github.com/owner1/repo1' }
      },
      {
        id: 'srv-2',
        fields: { github_url: 'https://github.com/owner2/repo2' }
      }
    ];
    
    const result = await batchResolveLogos(servers);
    
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(2);
    expect(result.has('srv-1')).toBe(true);
    expect(result.has('srv-2')).toBe(true);
  });

  it('should return Map with all server IDs', async () => {
    const servers = [
      {
        id: 'srv-1',
        fields: { github_url: 'https://github.com/owner1/repo1' }
      },
      {
        id: 'srv-2',
        fields: {}
      }
    ];
    
    const result = await batchResolveLogos(servers);
    
    expect(result.size).toBe(2);
    expect(result.get('srv-1')).toBeDefined();
    expect(result.get('srv-2')).toBeDefined();
  });

  it('should handle empty array', async () => {
    const result = await batchResolveLogos([]);
    
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('should handle non-array input', async () => {
    const result = await batchResolveLogos(null);
    
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('should handle partial failures gracefully', async () => {
    const servers = [
      {
        id: 'srv-1',
        fields: { github_url: 'https://github.com/owner1/repo1' }
      },
      {
        id: 'srv-2',
        fields: {} // Missing GitHub URL
      },
      {
        id: 'srv-3',
        fields: { github_url: 'https://github.com/owner3/repo3' }
      }
    ];
    
    const result = await batchResolveLogos(servers);
    
    expect(result.size).toBe(3);
    expect(result.get('srv-1')).toBeDefined();
    expect(result.get('srv-2')).toBeDefined();
    expect(result.get('srv-3')).toBeDefined();
  });
});

// Simple test runner
function expect(value) {
  return {
    toBeDefined: () => {
      if (value === undefined) throw new Error(`Expected value to be defined, got undefined`);
    },
    toBeNull: () => {
      if (value !== null) throw new Error(`Expected null, got ${value}`);
    },
    toBe: (expected) => {
      if (value !== expected) throw new Error(`Expected ${expected}, got ${value}`);
    },
    toContain: (substring) => {
      if (!value || !value.includes(substring)) {
        throw new Error(`Expected "${value}" to contain "${substring}"`);
      }
    },
    toBeInstanceOf: (constructor) => {
      if (!(value instanceof constructor)) {
        throw new Error(`Expected instance of ${constructor.name}, got ${typeof value}`);
      }
    },
    toHaveProperty: (prop) => {
      if (!(prop in value)) throw new Error(`Expected property "${prop}" to exist`);
    }
  };
}

function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
  }
}

// Run tests
console.log('Running logoResolver tests...');
describe('resolveServerLogo', () => {
  it('should resolve GitHub avatar for valid repo', async () => {
    const server = {
      id: 'test-1',
      fields: {
        github_url: 'https://github.com/modelcontextprotocol/servers'
      }
    };
    
    const result = await resolveServerLogo(server);
    
    expect(result).toBeDefined();
    expect(result.url).toContain('avatars.githubusercontent.com');
    expect(result.source).toBe('github');
    expect(result.cachedAt).toBeDefined();
  });

  it('should return null for missing GitHub URL', async () => {
    const server = {
      id: 'test-2',
      fields: {}
    };
    
    const result = await resolveServerLogo(server);
    
    expect(result.url).toBeNull();
    expect(result.source).toBeNull();
    expect(result.cachedAt).toBeNull();
  });

  it('should return null for invalid GitHub URL format', async () => {
    const server = {
      id: 'test-3',
      fields: {
        github_url: 'https://example.com/not-github'
      }
    };
    
    const result = await resolveServerLogo(server);
    
    expect(result.url).toBeNull();
    expect(result.source).toBeNull();
  });

  it('should handle null server gracefully', async () => {
    const result = await resolveServerLogo(null);
    
    expect(result.url).toBeNull();
    expect(result.source).toBeNull();
    expect(result.cachedAt).toBeNull();
  });

  it('should handle undefined fields gracefully', async () => {
    const server = {
      id: 'test-4'
    };
    
    const result = await resolveServerLogo(server);
    
    expect(result.url).toBeNull();
    expect(result.source).toBeNull();
  });
});

describe('batchResolveLogos', () => {
  it('should resolve logos for multiple servers', async () => {
    const servers = [
      {
        id: 'srv-1',
        fields: { github_url: 'https://github.com/owner1/repo1' }
      },
      {
        id: 'srv-2',
        fields: { github_url: 'https://github.com/owner2/repo2' }
      }
    ];
    
    const result = await batchResolveLogos(servers);
    
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(2);
    expect(result.has('srv-1')).toBe(true);
    expect(result.has('srv-2')).toBe(true);
  });

  it('should return Map with all server IDs', async () => {
    const servers = [
      {
        id: 'srv-1',
        fields: { github_url: 'https://github.com/owner1/repo1' }
      },
      {
        id: 'srv-2',
        fields: {}
      }
    ];
    
    const result = await batchResolveLogos(servers);
    
    expect(result.size).toBe(2);
    expect(result.get('srv-1')).toBeDefined();
    expect(result.get('srv-2')).toBeDefined();
  });

  it('should handle empty array', async () => {
    const result = await batchResolveLogos([]);
    
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('should handle non-array input', async () => {
    const result = await batchResolveLogos(null);
    
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('should handle partial failures gracefully', async () => {
    const servers = [
      {
        id: 'srv-1',
        fields: { github_url: 'https://github.com/owner1/repo1' }
      },
      {
        id: 'srv-2',
        fields: {} // Missing GitHub URL
      },
      {
        id: 'srv-3',
        fields: { github_url: 'https://github.com/owner3/repo3' }
      }
    ];
    
    const result = await batchResolveLogos(servers);
    
    expect(result.size).toBe(3);
    expect(result.get('srv-1')).toBeDefined();
    expect(result.get('srv-2')).toBeDefined();
    expect(result.get('srv-3')).toBeDefined();
  });
});

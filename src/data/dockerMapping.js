/**
 * Docker image mapping for MCP servers
 * Maps server IDs to Docker images, ports, environment variables, and volumes
 */

export const dockerMappings = {
  // Official Servers
  'github-mcp': {
    image: 'modelcontextprotocol/server-github:latest',
    ports: ['3000:3000'],
    environment: {
      GITHUB_TOKEN: '${GITHUB_TOKEN}'
    },
    volumes: [],
    command: null,
    healthcheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
      interval: '30s',
      timeout: '10s',
      retries: 3
    }
  },

  'filesystem-mcp': {
    image: 'calebmwelsh/file-system-mcp-server:latest',
    ports: ['3001:3000'],
    environment: {},
    volumes: [
      '${HOME}/Documents:/data/documents:rw',
      '${HOME}/Projects:/data/projects:rw'
    ],
    command: null
  },

  'puppeteer-mcp': {
    image: 'merajmehrabi/puppeteer-mcp-server:latest',
    ports: ['3002:3000'],
    environment: {
      PUPPETEER_HEADLESS: 'true'
    },
    volumes: [],
    command: null,
    shm_size: '2gb' // Chrome needs shared memory
  },

  'postgres-mcp': {
    image: 'crystaldba/postgres-mcp:latest',
    ports: ['3003:3000'],
    environment: {
      DATABASE_URL: '${DATABASE_URL}'
    },
    volumes: [],
    command: null
  },

  'sqlite-mcp': {
    image: 'jparkerweb/mcp-sqlite:latest',
    ports: ['3004:3000'],
    environment: {},
    volumes: [
      './data/sqlite:/data:rw'
    ],
    command: null
  },

  'gdrive-mcp': {
    image: 'markuspfundstein/mcp-gsuite:latest',
    ports: ['3005:3000'],
    environment: {
      GOOGLE_CLIENT_ID: '${GOOGLE_CLIENT_ID}',
      GOOGLE_CLIENT_SECRET: '${GOOGLE_CLIENT_SECRET}',
      GOOGLE_REDIRECT_URI: '${GOOGLE_REDIRECT_URI}'
    },
    volumes: [
      './data/gdrive:/credentials:rw'
    ],
    command: null
  },

  // Aggregators
  'mindsdb-mcp': {
    image: 'mindsdb/mindsdb:latest',
    ports: ['47382:47382', '3006:3000'],
    environment: {
      MINDSDB_DNS_CONNECT_TO: 'http://0.0.0.0'
    },
    volumes: [
      'mindsdb_data:/var/lib/mindsdb'
    ],
    command: null
  },

  'activepieces-mcp': {
    image: 'activepieces/activepieces:latest',
    ports: ['3007:80'],
    environment: {
      AP_ENGINE_EXECUTABLE_PATH: 'dist/packages/engine/main.js',
      AP_NODE_EXECUTABLE_PATH: '/usr/local/bin/node',
      AP_ENVIRONMENT: 'production'
    },
    volumes: [
      'activepieces_data:/persist'
    ],
    command: null
  },

  'fastmcp': {
    image: 'jlowin/fastmcp:latest',
    ports: ['3008:8000'],
    environment: {},
    volumes: [],
    command: null
  },

  // Databases
  'mongodb-mcp': {
    image: 'mongo:latest',
    ports: ['27017:27017'],
    environment: {
      MONGO_INITDB_ROOT_USERNAME: '${MONGO_USER}',
      MONGO_INITDB_ROOT_PASSWORD: '${MONGO_PASSWORD}'
    },
    volumes: [
      'mongodb_data:/data/db'
    ],
    command: null
  },

  'redis-mcp': {
    image: 'redis:alpine',
    ports: ['6379:6379'],
    environment: {},
    volumes: [
      'redis_data:/data'
    ],
    command: null
  },

  'elasticsearch-mcp': {
    image: 'elasticsearch:8.11.0',
    ports: ['9200:9200', '9300:9300'],
    environment: {
      discovery.type: 'single-node',
      xpack.security.enabled: 'false',
      ES_JAVA_OPTS: '-Xms512m -Xmx512m'
    },
    volumes: [
      'elasticsearch_data:/usr/share/elasticsearch/data'
    ],
    command: null
  },

  // Cloud Services
  'aws-mcp': {
    image: 'aws-samples/mcp-aws:latest',
    ports: ['3009:3000'],
    environment: {
      AWS_ACCESS_KEY_ID: '${AWS_ACCESS_KEY_ID}',
      AWS_SECRET_ACCESS_KEY: '${AWS_SECRET_ACCESS_KEY}',
      AWS_REGION: '${AWS_REGION:-us-east-1}'
    },
    volumes: [
      '${HOME}/.aws:/root/.aws:ro'
    ],
    command: null
  },

  'azure-mcp': {
    image: 'azure/mcp-server:latest',
    ports: ['3010:3000'],
    environment: {
      AZURE_SUBSCRIPTION_ID: '${AZURE_SUBSCRIPTION_ID}',
      AZURE_TENANT_ID: '${AZURE_TENANT_ID}',
      AZURE_CLIENT_ID: '${AZURE_CLIENT_ID}',
      AZURE_CLIENT_SECRET: '${AZURE_CLIENT_SECRET}'
    },
    volumes: [],
    command: null
  },

  'gcp-mcp': {
    image: 'gcp-mcp-server:latest',
    ports: ['3011:3000'],
    environment: {
      GOOGLE_CLOUD_PROJECT: '${GCP_PROJECT}',
      GOOGLE_APPLICATION_CREDENTIALS: '/credentials/gcp-key.json'
    },
    volumes: [
      './credentials/gcp-key.json:/credentials/gcp-key.json:ro'
    ],
    command: null
  },

  // Communication
  'slack-mcp': {
    image: 'slackapi/mcp-slack:latest',
    ports: ['3012:3000'],
    environment: {
      SLACK_BOT_TOKEN: '${SLACK_BOT_TOKEN}',
      SLACK_APP_TOKEN: '${SLACK_APP_TOKEN}'
    },
    volumes: [],
    command: null
  },

  'discord-mcp': {
    image: 'discord-mcp-server:latest',
    ports: ['3013:3000'],
    environment: {
      DISCORD_TOKEN: '${DISCORD_TOKEN}'
    },
    volumes: [],
    command: null
  },

  // AI/ML
  'langchain-mcp': {
    image: 'langchain/langchain:latest',
    ports: ['3014:8000'],
    environment: {
      OPENAI_API_KEY: '${OPENAI_API_KEY}',
      ANTHROPIC_API_KEY: '${ANTHROPIC_API_KEY}'
    },
    volumes: [
      'langchain_data:/app/data'
    ],
    command: null
  },

  'llamaindex-mcp': {
    image: 'llamaindex/llamaindex:latest',
    ports: ['3015:8000'],
    environment: {
      OPENAI_API_KEY: '${OPENAI_API_KEY}'
    },
    volumes: [
      './data/llama:/data:rw'
    ],
    command: null
  },

  // Development Tools
  'kubernetes-mcp': {
    image: 'kubernetes-mcp:latest',
    ports: ['3016:3000'],
    environment: {
      KUBECONFIG: '/root/.kube/config'
    },
    volumes: [
      '${HOME}/.kube:/root/.kube:ro'
    ],
    command: null
  },

  'terraform-mcp': {
    image: 'terraform-mcp:latest',
    ports: ['3017:3000'],
    environment: {},
    volumes: [
      './terraform:/workspace:rw'
    ],
    command: null
  }
};

/**
 * Generate docker-compose.yml content
 */
export function generateDockerCompose(selectedServers, options = {}) {
  const {
    projectName = 'mcp-stack',
    networkName = 'mcp-network',
    includeHealthchecks = true,
    includeEnvFile = true
  } = options;

  const services = {};
  const volumes = new Set();
  const envVars = new Set();

  selectedServers.forEach(serverId => {
    const config = dockerMappings[serverId];
    if (!config) {
      console.warn(`No Docker config found for ${serverId}`);
      return;
    }

    const serviceConfig = {
      image: config.image,
      container_name: `${projectName}-${serverId}`,
      restart: 'unless-stopped',
      ports: config.ports || [],
      environment: config.environment || {},
      networks: [networkName]
    };

    if (config.volumes && config.volumes.length > 0) {
      serviceConfig.volumes = config.volumes;
      config.volumes.forEach(vol => {
        const volName = vol.split(':')[0];
        if (!volName.startsWith('/') && !volName.startsWith('./') && !volName.includes('/')) {
          volumes.add(volName);
        }
      });
    }

    if (config.shm_size) {
      serviceConfig.shm_size = config.shm_size;
    }

    if (config.command) {
      serviceConfig.command = config.command;
    }

    if (includeHealthchecks && config.healthcheck) {
      serviceConfig.healthcheck = config.healthcheck;
    }

    // Collect env vars
    Object.keys(config.environment || {}).forEach(key => {
      const value = config.environment[key];
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        envVars.add(key);
      }
    });

    services[serverId] = serviceConfig;
  });

  // Build docker-compose object
  const compose = {
    version: '3.9',
    services,
    networks: {
      [networkName]: {
        driver: 'bridge'
      }
    }
  };

  if (volumes.size > 0) {
    compose.volumes = {};
    volumes.forEach(vol => {
      compose.volumes[vol] = {};
    });
  }

  return {
    compose,
    envVars: Array.from(envVars)
  };
}

/**
 * Generate .env.example content
 */
export function generateEnvExample(envVars) {
  return envVars.map(varName => `${varName}=your_${varName.toLowerCase()}_here`).join('\n');
}

/**
 * Get all available Docker images
 */
export function getAvailableDockerImages() {
  return Object.entries(dockerMappings).map(([id, config]) => ({
    id,
    image: config.image,
    ports: config.ports,
    hasEnvVars: Object.keys(config.environment || {}).length > 0,
    hasVolumes: (config.volumes || []).length > 0
  }));
}

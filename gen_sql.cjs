const fs = require('fs');
const path = require('path');

const FEATURED_IDS = ['semiotic', 'jetski', 'mcp-operator', 'mindsdb', '1panel', 'context7', 'github'];

const serversPath = path.join(__dirname, 'src/data/servers.json');
const data = JSON.parse(fs.readFileSync(serversPath, 'utf8'));

const sqlLines = [];

FEATURED_IDS.forEach(id => {
  const server = data.servers.find(s => s.id === id);
  if (server) {
    const f = server.fields;
    // Escape single quotes for SQL
    const escape = (val) => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        return val;
    };
    
    // (id, name, description, author, category, language, stars, github_url, npm_package, downloads, logo_url, updated_at)
    const line = `  (${escape(server.id)}, ${escape(f.name)}, ${escape(f.description)}, ${escape(f.author)}, ${escape(f.category)}, ${escape(f.language)}, ${f.stars || 0}, ${escape(f.github_url)}, ${escape(f.npm_package)}, ${f.downloads || 0}, ${escape(f.logoUrl)}, ${escape(f.updated || new Date().toISOString())})`;
    sqlLines.push(line);
  } else {
    console.warn(`Could not find server with id: ${id}`);
  }
});

if (sqlLines.length > 0) {
    console.log('INSERT INTO servers (id, name, description, author, category, language, stars, github_url, npm_package, downloads, logo_url, updated_at) VALUES');
    console.log(sqlLines.join(',\n') + ';');
}

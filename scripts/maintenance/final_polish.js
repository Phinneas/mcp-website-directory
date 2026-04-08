import fs from 'fs';

function finalPolish() {
    const clients = JSON.parse(fs.readFileSync('clients.json', 'utf-8'));
    
    for (let client of clients) {
        // Remove emoji-only or emoji-start titles if possible
        if (client.title.trim().match(/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}🌟🚀📦]+$/u)) {
             const githubMatch = client.url.match(/github\.com\/[^\/]+\/([^\/]+)/);
            if (githubMatch) {
                client.title = githubMatch[1]
                    .replace(/-/g, ' ')
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }
        }
        
        // Remove emojis from the start of titles if they have text after
        client.title = client.title.replace(/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}🌟🚀📦]+\s*/u, '').trim();

        if (!client.title) {
             const githubMatch = client.url.match(/github\.com\/[^\/]+\/([^\/]+)/);
             if (githubMatch) client.title = githubMatch[1];
             else client.title = "MCP Client";
        }
    }

    // Sort again
    clients.sort((a, b) => a.title.localeCompare(b.title));

    fs.writeFileSync('clients.json', JSON.stringify(clients, null, 2));
}

finalPolish();

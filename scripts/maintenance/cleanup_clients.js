import fs from 'fs';

function cleanup() {
    const clients = JSON.parse(fs.readFileSync('clients_validated.json', 'utf-8'));
    const finalClients = [];
    const seenUrls = new Set();

    console.log(`Cleaning up ${clients.length} clients...`);

    for (let client of clients) {
        // 1. Deduplicate by URL
        if (seenUrls.has(client.url)) continue;
        seenUrls.add(client.url);

        // 2. Fix titles
        let title = client.title.trim();
        
        // If title is junk or too short, use repo name from URL
        if (title.length <= 1 || title === 'Mcp-' || title === 'A' || title === 'M' || title === 'P' || title.endsWith('...') || title.includes('项目简介')) {
            const githubMatch = client.url.match(/github\.com\/[^\/]+\/([^\/]+)/);
            if (githubMatch) {
                title = githubMatch[1]
                    .replace(/-/g, ' ')
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }
        }

        // Specific fixes for known truncated titles
        if (title === "Cline – #1 on") title = "Cline";
        if (title === "Continue⏩") title = "Continue";
        if (title === "y-cli 🚀") title = "y-cli";
        if (title === "Repomix📦") title = "Repomix";
        if (title === "Histor") title = "HistorIQ";
        if (title === "Visual") title = "VS Code";
        if (title === "Hyper") title = "HyperChat";

        client.title = title;

        // 3. Clean description
        if (client.description.startsWith('ChatMCP')) {
            // maybe already fine
        }
        // Remove leading junk from description if it repeats title
        if (client.description.toLowerCase().startsWith(title.toLowerCase())) {
            // client.description = client.description.substring(title.length).trim();
            // Actually sometimes the description starts with a prefix like "CP Connect", "RGO", etc.
        }

        // 4. Filter for likely "Servers" misclassified as clients
        const isLikelyServer = (
            (client.title.toLowerCase().includes('server') && !client.title.toLowerCase().includes('client')) ||
            (client.description.toLowerCase().includes('mcp server implementation') && !client.description.toLowerCase().includes('client'))
        );

        if (isLikelyServer && !client.title.toLowerCase().includes('adapter') && !client.title.toLowerCase().includes('connect')) {
            console.log(`  - Marking as server: ${client.title}`);
            client.category = "Server (Misclassified?)";
            // We'll keep them but maybe the user wants them gone.
            // For now, let's keep them if they have "client" mentioned at all.
        }

        finalClients.push(client);
    }

    // 5. Sort by title (or stars if we had them)
    // Actually, let's keep the original order or sort alphabetically
    finalClients.sort((a, b) => a.title.localeCompare(b.title));

    console.log(`Final count: ${finalClients.length}`);

    fs.writeFileSync('clients.json', JSON.stringify(finalClients, null, 2));
    console.log(`Updated clients.json`);
}

cleanup();

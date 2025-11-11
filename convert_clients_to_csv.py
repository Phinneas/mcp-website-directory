import json
import csv

# Load the clients data
with open('clients.json', 'r', encoding='utf-8') as f:
    clients = json.load(f)

# Write to CSV
with open('clients.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Title', 'URL', 'Stars', 'Description', 'Category'])

    for client in clients:
        writer.writerow([
            client.get('title', ''),
            client.get('url', ''),
            client.get('stars', 0),
            client.get('description', '').replace('\n', ' '),
            client.get('category', '')
        ])

print(f"Converted {len(clients)} clients to clients.csv")

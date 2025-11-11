# save as clients_to_csv.py
import json, csv, sys

data = json.load(open(sys.argv[1]))
clients = [r for r in data if r.get("type") == "client"]

with open("clients.csv", "w", newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(["name", "github_url", "stars", "description", "category"])
    for c in clients:
        w.writerow([
            c.get("title",""),
            c.get("url",""),
            c.get("stars",0),
            c.get("description","").replace("\n"," "),
            c.get("category","")
        ])
print(f"Wrote {len(clients)} clients to clients.csv")

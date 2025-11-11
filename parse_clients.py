import glob, bs4, csv, json, re
rows=[]
for f in glob.glob("p*.html"):
    soup=bs4.BeautifulSoup(open(f), "lxml")
    for card in soup.select("a.card"):   # adjust selector if class changes
        rows.append({
            "title": card.find("h3").get_text(strip=True),
            "url": "https://mcp.so" + card["href"],
            "stars": int(re.search(r"(\d+)", card.find(text=re.compile("★")) or "0").group(1)),
            "description": card.find("p").get_text(strip=True),
            "category": card.find(text=re.compile("Client")).strip()
        })
json.dump(rows, open("clients.json","w"), indent=2)
csv.DictWriter(open("clients.csv","w"), fieldnames=rows[0]).writeheader()
csv.DictWriter(open("clients.csv","w"), fieldnames=rows[0]).writerows(rows)
print("scraped", len(rows), "clients")

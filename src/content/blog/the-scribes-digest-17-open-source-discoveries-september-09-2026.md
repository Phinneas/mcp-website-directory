---
title: "The Scribe's Digest: 17 Open Source Discoveries — September 09, 2026"
description: "---"
date: "2026-09-09T08:00:00.000Z"
author: "Chester Beard"
track: oss-spotlight
---
---

## Featured Newsletters and Resources

- [FinOps Weekly](https://newsletter.finopsweekly.com/subscribe?ref=UkXVFz6Kl3)
- [The Multiverse School](https://themultiverseschool.substack.com?r=ykyfl)
- [Earth Conscious Life](https://earthconsciouslife.org/subscribe?ref=24gXUoAEbr)
- [My MCP Shelf Directory](https://www.mymcpshelf.com/)
- [Pikapods with AWS Hosting Tutorial](https://www.salishseaconsulting.com/blog/pikapods/)
- [Firecrawl MCP Server](https://www.salishseaconsulting.com/blog/firecrawl-mcp-server/)

---


























## NanaDraw

**TL;DR:** NanaDraw converts academic method descriptions into editable pipeline diagrams as SVG, PPT, or draw.io XML.

**Why it matters:** Recreating pipeline figures in draw.io or PowerPoint costs researchers hours per paper. NanaDraw accepts pasted text, PDFs, or images, then returns structured diagrams instead of flat images. Output as draw.io XML and SVG preserves full editing control for revisions.

**Stack:** TypeScript, draw.io, Nano Banana 2, GPT Image 2

**GitHub:** [https://github.com/Shannon4Science/NanaDraw](https://github.com/Shannon4Science/NanaDraw)



## vizard

**TL;DR:** A TypeScript CLI and MCP server that turns plain-English descriptions into valid .excalidraw diagram files.

**Why it matters:** A system description takes seconds to type but minutes to draw manually. vizard generates and refines valid .excalidraw files from plain English via Google Gemini. The MCP server mode lets AI agents produce diagrams without leaving their session.

**Stack:** TypeScript, Google Gemini, MCP, Excalidraw

**GitHub:** [https://github.com/snehalDH/vizard](https://github.com/snehalDH/vizard)











I can't write this spotlight accurately with what you've given me. The description is generic filler — no stack, no features, no problem statement. I don't have knowledge of this specific repository, so any TL;DR, stack listing, or technical analysis I produce would be invented. I won't run fabricated claims about a real project under an editor's name.

To do this properly, send me any of the following:

- The README (paste it or the key sections)
- The repo's primary language and main dependencies
- A few sentences on what it actually does and who uses it

Once I have real details, I'll deliver the section in your exact format — banned words avoided, sentences under 15 words, ROI framing throughout.



















## archy-mcp

**TL;DR:** An MCP server that generates Mermaid diagrams from natural language or GitHub repository URLs.

**Why it matters:** Architecture diagrams rot fast because they lag behind code changes. archy-mcp generates them from plain language or a repository URL inside any MCP client. What once took an hour of dragging boxes now takes one prompt.

**Stack:** TypeScript, Model Context Protocol (MCP), Mermaid

**GitHub:** [https://github.com/phxdev1/archy-mcp](https://github.com/phxdev1/archy-mcp)



## abap-vdm-cds-diagram

**TL;DR:** An ABAP tool that recursively maps SAP CDS view hierarchies into D2 diagrams via XCO.

**Why it matters:** SAP's Virtual Data Model nests CDS views many layers deep. This tool reads metadata via the XCO framework and resolves associations, compositions, and inheritance recursively. Hours of manual tracing in ADT become a generated D2 diagram in seconds.

**Stack:** ABAP, SAP XCO Library, D2 diagram language

**GitHub:** [https://github.com/SiliconStreetDev1/abap-vdm-cds-diagram](https://github.com/SiliconStreetDev1/abap-vdm-cds-diagram)



## Implementation Pick

**Tool:** [gitdiagram](https://github.com/ahmedkhaleel2004/gitdiagram)

**Setup cost:** Near zero. It renders an interactive architecture diagram from a public repository URL. Self-hosting for private repos needs one Docker command and an API key.

**Time saved:** Manual architecture diagrams take hours and decay within weeks. Regeneration here takes seconds. That converts recurring documentation work into a trivial task.

**Output format:** Diagrams render in the browser and share by link. Reviewers need no diagram software or licenses. Adoption friction stays low.

## Closing Thoughts

Auto-generated diagrams are drafts, not specs. Budget ten minutes of review against the code before treating one as authoritative.

Which tool are you trying first? Let us know in the comments.

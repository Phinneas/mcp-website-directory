import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { visit } from 'unist-util-visit';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, options, maxRetries = 6) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429 && res.status < 500) return res;
    const headerMs = (parseInt(res.headers.get('retry-after') || '0', 10) || 0) * 1000;
    const backoffMs = Math.max(1500, headerMs, 1000 * Math.pow(2, attempt));
    console.warn(`[Napkin] Rate limited/transient (${res.status}), retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})...`);
    await sleep(backoffMs);
  }
  return fetch(url, options);
}

export function remarkNapkin(options = {}) {
  return async (tree) => {
    const nodesToProcess = [];

    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'napkin') {
        nodesToProcess.push({ node, index, parent });
      }
    });

    if (nodesToProcess.length === 0) return;

    for (const { node, index, parent } of nodesToProcess) {
      const text = node.value;
      const hash = crypto.createHash('md5').update(text).digest('hex').substring(0, 10);
      const filename = `napkin-${hash}.png`;
      const publicDir = path.join(process.cwd(), 'public', 'diagrams');
      const filepath = path.join(publicDir, filename);

      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const keySources = ['NAPKIN_API_TOKEN', 'NAPKIN_API_KEY', 'NAPKIN_KEY', 'VITE_NAPKIN_API_KEY'];
      let apiKey = options.apiKey;
      if (!apiKey) {
        for (const name of keySources) {
          const val = process.env[name];
          if (val && val.trim()) { apiKey = val; break; }
        }
      }

      // If the image exists locally, skip the API (caching)
      if (!fs.existsSync(filepath)) {
        if (!apiKey) {
          console.warn(`[Napkin] Missing Napkin API key. Skipping diagram generation for hash ${hash}.`);
          parent.children[index] = {
            type: 'html',
            value: `<div class="p-6 my-6 text-center"><strong>Napkin Diagram Placeholder</strong><br/><span>API Key not found in build environment.</span></div>`
          };
          continue;
        }

        try {
          // STEP 1: create
          const createResponse = await fetchWithRetry('https://api.napkin.ai/v1/visual', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              content: text,
              style: 'minimal',
              format: 'png',
              language: 'en'
            })
          });

          if (!createResponse.ok) {
            const errText = await createResponse.text().catch(() => '');
            throw new Error(`Napkin create error: ${createResponse.status} - ${errText}`);
          }

          const createData = await createResponse.json();
          const requestId = createData.id;
          if (!requestId) throw new Error("No request ID returned from Napkin API");

          // STEP 2: poll
          let isComplete = false;
          let fileUrl = null;
          let attempts = 0;
          const maxAttempts = 30; // ~60s

          while (!isComplete && attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 2000));
            attempts++;
            const statusResponse = await fetch(`https://api.napkin.ai/v1/visual/${requestId}/status`, {
              headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            if (!statusResponse.ok) {
              const errText = await statusResponse.text().catch(() => '');
              throw new Error(`Napkin status error: ${statusResponse.status} - ${errText}`);
            }
            const statusData = await statusResponse.json();
            if (statusData.status === 'completed') {
              isComplete = true;
              if (statusData.generated_files?.length) {
                fileUrl = statusData.generated_files[0].url;
              } else {
                throw new Error("Napkin completed but returned no files.");
              }
            } else if (statusData.status === 'failed') {
              throw new Error(`Napkin failed: ${statusData.error || 'Unknown error'}`);
            }
          }

          if (!isComplete) throw new Error("Napkin generation timed out after 60 seconds.");

          // STEP 3: download (auth header still required)
          const fileResponse = await fetch(fileUrl, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          if (!fileResponse.ok) throw new Error(`Failed to download image: ${fileResponse.status}`);

          const imageBuffer = await fileResponse.arrayBuffer();
          fs.writeFileSync(filepath, Buffer.from(imageBuffer));
          console.log(`[Napkin] Saved diagram to ${filepath}`);
        } catch (error) {
          console.error(`[Napkin] Failed: ${error.message}`);
          parent.children[index] = {
            type: 'html',
            value: `<div class="p-6 my-6 text-center text-red-800 bg-red-50"><strong>Napkin API Error</strong><br/><span>${error.message}</span></div>`
          };
          continue;
        }
      }

      // Replace the code block with a static <img>
      parent.children[index] = {
        type: 'html',
        value: `<img src="/diagrams/${filename}" alt="${text.replace(/"/g, '&quot;').replace(/\n/g, ' ')}" class="w-full h-auto rounded-3xl my-10" loading="lazy" />`
      };
    }
  };
}

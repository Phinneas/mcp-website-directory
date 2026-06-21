/**
 * GitHub OAuth callback — exchanges code for token
 * GET /api/auth/callback?code=...&state=...
 */
import type { APIRoute } from 'astro';

export const prerender = false;

const GITHUB_CLIENT_ID = 'Ov23liJvX3zJAqXwCIWR';
// GITHUB_CLIENT_SECRET must be set as Cloudflare Worker secret or env var

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  const clientSecret = (locals as any).runtime?.env?.GITHUB_CLIENT_SECRET;
  if (!clientSecret) {
    console.error('GITHUB_CLIENT_SECRET not configured');
    return new Response('OAuth not configured', { status: 500 });
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('GitHub OAuth error:', tokenData);
      return new Response('OAuth exchange failed', { status: 401 });
    }

    // Fetch user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'User-Agent': 'MCP-Directory-Auth',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const userData = await userRes.json();

    // Redirect back to the page with token in fragment (client-side extracts it)
    // Using a redirect to a page that reads the fragment and stores the token
    const redirectUrl = new URL(url.searchParams.get('redirect') || '/', url.origin);
    // We'll render an HTML page that stores the token in localStorage and redirects
    const html = `<!DOCTYPE html>
<html><head><title>Authenticating...</title></head><body>
<script>
  try {
    const user = ${JSON.stringify({
      id: userData.id,
      login: userData.login,
      name: userData.name,
      avatar_url: userData.avatar_url,
    })};
    const auth = { ...user, token: "${accessToken}" };
    localStorage.setItem("mcp_dir_auth", JSON.stringify(auth));
  } catch(e) {}
  window.location.href = "${redirectUrl.toString()}";
</script>
<p>Authenticating with GitHub...</p>
</body></html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (err: any) {
    console.error('OAuth callback error:', err.message);
    return new Response('OAuth callback failed', { status: 500 });
  }
};

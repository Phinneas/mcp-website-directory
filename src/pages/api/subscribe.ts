import type { APIRoute } from 'astro';

// Beehiiv integration has been replaced by Ghost native member signup.
// Signup is now handled via the Ghost portal embed on the frontend.
// This endpoint is no longer in use.

export const prerender = false;

export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      error: 'This endpoint has been retired. Please use the signup form on the site.'
    }),
    { status: 410, headers: { 'Content-Type': 'application/json' } }
  );
};

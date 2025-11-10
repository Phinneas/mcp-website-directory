import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get Plunk API key from environment
    const plunkApiKey = import.meta.env.PLUNK_API_KEY;

    if (!plunkApiKey) {
      console.error('PLUNK_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Subscribe to Plunk
    const response = await fetch('https://api.useplunk.com/v1/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plunkApiKey}`,
      },
      body: JSON.stringify({
        email,
        subscribed: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Plunk API error:', errorData);

      // Handle duplicate email gracefully
      if (response.status === 400 && errorData.error?.includes('already exists')) {
        return new Response(
          JSON.stringify({ error: 'This email is already subscribed' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Failed to subscribe');
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Subscription error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to subscribe. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

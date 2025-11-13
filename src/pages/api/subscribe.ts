import type { APIRoute } from 'astro';

export const prerender = false;

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

    // Get Beehiiv credentials from environment
    const beehiivApiKey = import.meta.env.BEEHIIV_API_KEY;
    const beehiivPublicationId = import.meta.env.BEEHIIV_PUBLICATION_ID;

    if (!beehiivApiKey || !beehiivPublicationId) {
      console.error('BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Subscribe to Beehiiv
    const response = await fetch(`https://api.beehiiv.com/v2/publications/${beehiivPublicationId}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${beehiivApiKey}`,
      },
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        send_welcome_email: true,
        utm_source: 'mymcpshelf.com',
        utm_medium: 'website',
        utm_campaign: 'newsletter_signup'
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Beehiiv API error:', data);

      // Handle duplicate email gracefully
      if (response.status === 400 || response.status === 409) {
        return new Response(
          JSON.stringify({ error: 'This email is already subscribed' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(data.message || 'Failed to subscribe');
    }

    // Check subscription status
    const subscriptionStatus = data.data?.status;
    console.log('Beehiiv subscription created:', { email, status: subscriptionStatus });

    // Beehiiv returns status: "validating", "active", or "invalid"
    if (subscriptionStatus === 'invalid') {
      return new Response(
        JSON.stringify({ error: 'Invalid email address. Please check and try again.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: subscriptionStatus,
        message: subscriptionStatus === 'validating'
          ? 'Please check your email to confirm your subscription'
          : 'Successfully subscribed!'
      }),
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

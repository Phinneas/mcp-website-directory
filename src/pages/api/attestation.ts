import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const serverName = formData.get('server_name') as string;
    const githubUrl = formData.get('github_url') as string;
    const authorEmail = formData.get('author_email') as string;
    const authorName = formData.get('author_name') as string;
    const transport = formData.get('transport') as string;
    const authMethod = formData.get('auth_method') as string;
    const tokenLifecycle = formData.get('token_lifecycle') as string;
    const inputHandling = formData.get('input_handling') as string;
    const dataResidency = formData.get('data_residency') as string;
    const documentationUrl = formData.get('documentation_url') as string;
    const notes = formData.get('notes') as string;
    const attestationTruth = formData.get('attestation_truth') as string;

    // Validate required fields
    if (!serverName || !githubUrl || !authorEmail || !transport || !authMethod || !tokenLifecycle || !inputHandling || !dataResidency || !attestationTruth) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate GitHub URL format
    if (!githubUrl.startsWith('https://github.com/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid GitHub URL' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // For now, store as a GitHub issue or log for manual processing
    // In production, this would write to D1 or a dedicated attestation table
    const attestation = {
      server_name: serverName,
      github_url: githubUrl,
      author_email: authorEmail,
      author_name: authorName || '',
      transport,
      auth_method: authMethod,
      token_lifecycle: tokenLifecycle,
      input_handling: inputHandling,
      data_residency: dataResidency,
      documentation_url: documentationUrl || '',
      notes: notes || '',
      submitted_at: new Date().toISOString(),
      status: 'pending_review',
    };

    console.log('Security attestation received:', JSON.stringify(attestation, null, 2));

    // Return success — in production this would also:
    // 1. Write to a D1 attestation table
    // 2. Send confirmation email
    // 3. Create a review ticket
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Attestation received. It will be reviewed within 5 business days. 10% of attestations are spot-checked quarterly.',
        attestation_id: `ATT-${Date.now()}`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    console.error('Attestation submission error:', err.message);
    return new Response(
      JSON.stringify({ error: 'Submission failed', detail: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

import * as env from '$env/static/private';

export async function GET({ url }) {
    const code = url.searchParams.get('code');
    const installationId = url.searchParams.get('installation_id');

    // If users return from configuring the GitHub App installation...
    if (installationId) {
        return new Response(null, {
            status: 302,
            headers: { 'Location': new URL("/dashboard", url.origin).toString() }
        });
    }

    // Login flow
    try {
        if (!code) throw new Error("Cancelled");
        return new Response(null, {
            status: 302,
            headers: { 'Location': `/login?code=${code}` }
        });

    } catch (error) {
        console.warn('GitHub callback error:', error);
        return new Response(null, {
            status: 302,
            headers: { 'Location': `/login?error=${encodeURIComponent(error.message)}` }
        });
    }
}
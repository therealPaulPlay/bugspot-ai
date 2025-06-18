export async function GET({ url }) {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
        return new Response(null, {
            status: 302,
            headers: { 'Location': '/login?error=missing_oauth_params' }
        });
    }

    try {
        // Parse the state to determine the flow type
        const stateData = JSON.parse(decodeURIComponent(state));

        if (stateData.type === 'repo_access') {
            // This is for GitHub repo access - redirect to the repo access handler
            return new Response(null, {
                status: 302,
                headers: { 'Location': `/api/github/access-callback?code=${code}&state=${encodeURIComponent(state)}` }
            });
        } else {
            // This is for login - redirect to your login page with the OAuth params
            return new Response(null, {
                status: 302,
                headers: { 'Location': `/login?code=${code}&state=${encodeURIComponent(state)}` }
            });
        }

    } catch (error) {
        console.warn('Failed to parse OAuth state, defaulting to login flow:', error);
        // If we can't parse state, assume it's a login flow
        return new Response(null, {
            status: 302,
            headers: { 'Location': `/login?code=${code}&state=${encodeURIComponent(state)}` }
        });
    }
}
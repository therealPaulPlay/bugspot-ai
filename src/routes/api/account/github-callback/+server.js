import { env } from '$env/dynamic/private';

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
        const stateData = JSON.parse(decodeURIComponent(state));

        if (stateData.type === 'repo_access') {
            // Repo access flow
            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: env.GITHUB_APP_CLIENT_ID,
                    client_secret: env.GITHUB_APP_CLIENT_SECRET,
                    code
                })
            });

            const tokenData = await tokenResponse.json();
            if (tokenData.error) throw new Error('Token exchange failed!');

            const returnUrl = stateData.returnUrl || '/dashboard';
            const redirectUrl = new URL(returnUrl);
            redirectUrl.searchParams.set('github_token', tokenData.access_token);

            return new Response(null, { status: 302, headers: { 'Location': redirectUrl.toString() } });
        } else {
            // Login flow
            return new Response(null, {
                status: 302,
                headers: { 'Location': `/login?code=${code}&state=${encodeURIComponent(state)}` }
            });
        }
    } catch (error) {
        console.warn('OAuth callback error:', error);
        const fallbackUrl = error.message === 'Token exchange failed!'
            ? '/dashboard?error=auth_failed'
            : `/login?code=${code}&state=${encodeURIComponent(state)}`;

        return new Response(null, {
            status: 302,
            headers: { 'Location': fallbackUrl }
        });
    }
}
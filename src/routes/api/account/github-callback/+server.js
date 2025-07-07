import * as env from '$env/static/private';

export async function GET({ url }) {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const installationId = url.searchParams.get('installation_id');

    if (installationId && !state) {
        return new Response(null, {
            status: 302,
            headers: { 'Location': url.host + "/dashboard" }
        });
    }


    if (!state) {
        return new Response(null, {
            status: 302,
            headers: { 'Location': `/login?error=${encodeURIComponent("Missing state parameter in callback!")}` }
        });
    }

    try {
        const stateData = JSON.parse(decodeURIComponent(state));

        if (stateData.type === 'repo_access') {
            // Repo access flow
            if (!code) throw new Error("Missing code parameter in repo_access callback!");
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

            const redirectUrl = new URL(url.origin + "/dashboard");
            redirectUrl.searchParams.set('github_token', tokenData.access_token);
            return new Response(null, { status: 302, headers: { 'Location': redirectUrl.toString() } });

        } else {
            // Login flow
            if (!code) throw new Error("Cancelled (Code parameter is missing).");
            return new Response(null, {
                status: 302,
                headers: { 'Location': `/login?code=${code}&state=${encodeURIComponent(state)}` }
            });
        }
    } catch (error) {
        console.warn('GitHub callback error:', error);
        return new Response(null, {
            status: 302,
            headers: { 'Location': `/login?error=${encodeURIComponent(error.message)}` }
        });
    }
}
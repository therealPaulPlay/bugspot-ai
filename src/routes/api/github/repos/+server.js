import { json } from '@sveltejs/kit';
import * as env from '$env/static/private';
import { authenticateTokenWithId } from '$lib/server/auth/authenticateTokenWithId.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { getInstallationToken } from '$lib/utils/gitHubAppAccess.js';

// Get GitHub repositories where the app is installed
export async function GET({ request, url }) {
    try {
        const userId = url.searchParams.get('user-id');
        if (!userId) return json({ error: "User ID is required." }, { status: 400 });
        authenticateTokenWithId(request, userId);

        const userData = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!userData.length) return json({ error: 'User not found.' }, { status: 404 });

        const user = userData[0];
        if (!user.githubInstallationId) return json({ repos: [] }); // If the App is not installed, return empty

        // Use installation token to get accessible repos
        const installationToken = await getInstallationToken(user.githubInstallationId);

        const response = await fetch(`https://api.github.com/installation/repositories?per_page=100`, {
            headers: {
                'Authorization': `Bearer ${installationToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        const data = await response.json();
        const repos = data.repositories.map(repo => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
        }));

        return json({ repos });
    } catch (error) {
        console.error('GitHub repos error:', error);
        return json({ error: 'Failed to fetch repositories: ' + error.message }, { status: 500 });
    }
}
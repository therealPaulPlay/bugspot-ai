import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import { authenticateTokenWithId } from '$lib/server/auth/authenticateTokenWithId.js';
import * as env from '$env/static/private';

export async function POST({ request, locals }) {
  try {
    const { userId, githubToken } = locals.body;
    authenticateTokenWithId(request, userId);

    // Get user's installations with the GitHub token
    const response = await fetch('https://api.github.com/user/installations', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) return json({ error: 'Failed to fetch installations' }, { status: 400 });

    const installations = await response.json();
    const userInstallation = installations.installations?.find(inst => 
      inst.app_id === parseInt(env.GITHUB_APP_ID)
    );

    // Update user's installation ID
    await db.update(users)
      .set({ githubInstallationId: userInstallation?.id?.toString() || null })
      .where(eq(users.id, userId));

    return json({ success: true, hasInstallation: !!userInstallation });

  } catch (error) {
    console.error('Update installation error:', error);
    return json({ error: 'Failed to update installation' }, { status: 500 });
  }
}
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema';
import jwt from 'jsonwebtoken';
import * as env from '$env/static/private';
import { authenticateTokenWithId } from '$lib/server/auth/authenticateTokenWithId';

function createNewJwtToken(user) {
    try {
        const accessToken = jwt.sign(
            {
                sub: user.email || null,
                userId: user.id.toString()
            },
            env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );
        console.info('JWT token generated successfully.');
        return accessToken;
    } catch (error) {
        console.error('Token generation error: ', error.message);
        return null;
    }
}

// Get current user info
export async function GET({ request, url }) {
    const userId = url.searchParams.get('userId');
    if (!userId) return json({ error: 'User ID is required' }, { status: 400 });

    try {
        authenticateTokenWithId(request, userId);

        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user.length) return json({ error: 'User not found' }, { status: 404 });

        const userData = user[0];
        return json({
            user: {
                id: userData.id.toString(),
                username: userData.username,
                email: userData.email,
                avatar: userData.avatar,
                subscriptionTier: userData.subscriptionTier,
                reportAmount: userData.reportAmount || 0
            }
        });

    } catch (error) {
        console.error('Account info error:', error);
        return json({ error: 'Failed to get account info.' }, { status: 500 });
    }
}

// GitHub App OAuth login/signup
export async function POST({ request, locals }) {
    const { code } = locals.body;
    if (!code) return json({ error: 'Missing code parameter.' }, { status: 400 });

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: env.GITHUB_OAUTH_CLIENT_ID,
                client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
                code
            })
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.error) return json({ error: tokenData.error_description || 'GitHub authentication failed' }, { status: 400 });

        const [userResponse, emailResponse] = await Promise.all([
            fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }),
            fetch('https://api.github.com/user/emails', {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            })
        ]);

        const githubUser = await userResponse.json();
        if (!githubUser.id) return json({ error: 'Failed to get user information from GitHub' }, { status: 400 });

        const emails = await emailResponse.json();
        const primaryEmail = emails?.find(email => email.primary)?.email || githubUser.email;
        if (!primaryEmail) return json({ error: 'No email address found. Please make sure your GitHub email is public or primary.' }, { status: 400 });

        // Check if user exists
        let user = await db.select().from(users).where(eq(users.githubId, githubUser.id.toString())).limit(1);

        if (user.length === 0) {
            // Create new user
            const newUser = {
                githubId: githubUser.id.toString(),
                username: githubUser.login,
                email: primaryEmail,
                avatar: githubUser.avatar_url,
                subscriptionTier: 0
            };

            const insertResult = await db.insert(users).values(newUser);
            user = [{ ...newUser, id: insertResult[0].insertId }];
        } else {
            // Update existing user info
            await db.update(users)
                .set({
                    username: githubUser.login,
                    email: primaryEmail,
                    avatar: githubUser.avatar_url
                })
                .where(eq(users.id, user[0].id));

            user = await db.select().from(users).where(eq(users.id, user[0].id)).limit(1);
        }

        // Generate JWT token
        const token = createNewJwtToken(user[0]);
        if (!token) return json({ error: 'Failed to generate access token!' }, { status: 500 });

        return json({
            token,
            userId: user[0].id.toString(),
            user: {
                id: user[0].id.toString(),
                username: user[0].username,
                email: user[0].email,
                avatar: user[0].avatar,
                subscriptionTier: user[0].subscriptionTier,
                reportAmount: user[0].reportAmount || 0
            }
        });

    } catch (error) {
        console.error('GitHub auth error:', error);
        return json({ error: 'Internal server error.' }, { status: 500 });
    }
}

// Delete account
export async function DELETE({ request, locals }) {
    const { userId } = locals.body;

    try {
        authenticateTokenWithId(request, userId);
        await db.delete(users).where(eq(users.id, userId));
        return json({ success: true });
    } catch (error) {
        console.error('Account deletion error:', error);
        return json({ error: 'Failed to delete account: ' + error.message }, { status: 500 });
    }
}
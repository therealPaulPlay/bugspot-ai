import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import { authenticateTokenWithId } from '$lib/server/auth/authenticateTokenWithId';

const GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = env.GITHUB_CLIENT_SECRET;
const JWT_SECRET = env.JWT_SECRET;

// TODO: RATE LIMITING (via request IP! -> check how to do that here)

function createNewJwtToken(user) {
    try {
        const accessToken = jwt.sign(
            {
                sub: user.email || null,
                userId: user.id.toString()
            },
            JWT_SECRET,
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

// GitHub OAuth login/signup
export async function POST({ request, locals }) {
    const { code, state } = locals.body;
    if (!code || !state) return json({ error: 'Missing code or state parameter' }, { status: 400 });

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code
            })
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.error) return json({ error: tokenData.error_description || 'GitHub authentication failed' }, { status: 400 });

        // Get user info from GitHub
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        const githubUser = await userResponse.json();
        if (!githubUser.id) return json({ error: 'Failed to get user information from GitHub' }, { status: 400 });

        // Get user email
        const emailResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        const emails = await emailResponse.json();
        const primaryEmail = emails.find(email => email.primary)?.email || githubUser.email;
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
                subscriptionTier: user[0].subscriptionTier
            }
        });

    } catch (error) {
        console.error('GitHub auth error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Delete account
export async function DELETE({ request, locals }) {
    const { userId } = locals.body;

    // Authenticate user
    authenticateTokenWithId(request, userId);

    try {
        // Delete user and all related data (cascade will handle related records)
        await db.delete(users).where(eq(users.id, userId));

        return json({ success: true });

    } catch (error) {
        console.error('Account deletion error:', error);
        return json({ error: 'Failed to delete account: ' + error.message }, { status: 500 });
    }
}
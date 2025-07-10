import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { fileUploadLimiter, aiLimiter, standardLimiter } from '$lib/utils/rateLimiters';
import { json } from '@sveltejs/kit';
import cron from 'node-cron';

// Monthly reset job - runs on the 1st of every month at midnight UTC
cron.schedule('0 0 1 * *', async () => {
    try {
        console.log('Running monthly report amount reset...');
        await db.update(users).set({ reportAmount: 0 });
        console.log('Successfully reset all user report amounts.');
    } catch (error) {
        console.error('Monthly reset error:', error);
    }
});

// Hook into handleError to skip logging 404s since there are so many due to bots
export async function handleError({ error, event, status, message }) {
    if (status !== 404) console.error(error.message);
    return { message };
}

export async function handle({ event, resolve }) {
    // API rate limits
    if (event.url.pathname.startsWith('/api')) {
        switch (true) {
            case event.url.pathname.startsWith('/api/report/ai'):
                if (await aiLimiter.isLimited(event)) return json({ error: 'Too many ai processing requests!' }, { status: 429 });
                break;

            case event.url.pathname.startsWith('/api/report/file-upload'):
                if (await fileUploadLimiter.isLimited(event)) return json({ error: 'Too many file upload requests!' }, { status: 429 });
                break;

            default:
                if (await standardLimiter.isLimited(event)) return json({ error: 'Too many requests!' }, { status: 429 });
        }
    }

    // Parse JSON for API routes with body (not GET or OPTIONS)
    if (event.url.pathname.startsWith('/api') && !event.url.pathname.startsWith('/api/report/file-upload') && !event.url.pathname.startsWith('/api/account/billing/webhook') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.request.method)) {
        try {
            event.locals.body = await event.request.json();
        } catch {
            return json({ error: 'Invalid JSON in request body!' }, { status: 400 });
        }
    }

    const response = await resolve(event);
    return response;
}
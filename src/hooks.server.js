import { fileUploadLimiter, llmLimiter, standardLimiter } from '$lib/utils/rateLimiters';
import { json } from '@sveltejs/kit';

export async function handle({ event, resolve }) {
    // API rate limits
    if (event.url.pathname.startsWith('/api')) {
        switch (true) {
            case event.url.pathname.startsWith('/api/public/ai'):
                if (await llmLimiter.isLimited(event)) return json({ error: 'Too many llm requests' }, { status: 429 });
                break;

            case event.url.pathname.startsWith('/api/public/file-upload'):
                if (await fileUploadLimiter.isLimited(event)) return json({ error: 'Too many file upload requests' }, { status: 429 });
                break;

            default:
                if (await standardLimiter.isLimited(event)) return json({ error: 'Too many requests' }, { status: 429 });
        }
    }

    // Parse JSON for API routes with body (not GET or OPTIONS)
    if (event.url.pathname.startsWith('/api') && !event.url.pathname.startsWith('/api/public/file-upload') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.request.method)) {
        try {
            event.locals.body = await event.request.json();
        } catch {
            return json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }
    }

    const response = await resolve(event);

    // CORS for public route
    if (event.url.pathname.startsWith('/api/public')) response.headers.set('Access-Control-Allow-Origin', "*");

    return response;
}
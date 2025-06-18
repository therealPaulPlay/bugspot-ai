import { json } from '@sveltejs/kit';

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://bugspot.dev'
];

export async function handle({ event, resolve }) {
    // Parse JSON for API routes with body
    if (event.url.pathname.startsWith('/api') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.request.method)) {
        try {
            event.locals.body = await event.request.json();
        } catch {
            return json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }
    }

    const origin = event.request.headers.get('origin');
    const response = await resolve(event);
    if (origin && allowedOrigins.includes(origin)) response.headers.set('Access-Control-Allow-Origin', origin);
    return response;
}
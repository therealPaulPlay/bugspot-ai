const allowedOrigins = [
	'http://localhost:5173',
	'http://localhost:3000',
	'https://bugspot.dev'
];

export async function handle({ event, resolve }) {
	const origin = event.request.headers.get('origin');
	const response = await resolve(event);

	if (origin && allowedOrigins.includes(origin)) response.headers.set('Access-Control-Allow-Origin', origin);

	return response;
}
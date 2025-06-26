import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

export async function validateCaptcha(token, clientIp) {
    if (!token) throw error(400, 'Turnstile token missing.');

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: env.CAPTCHA_SECRET_KEY,
                response: token,
                remoteip: clientIp
            })
        });

        const data = await response.json();
        if (!data.success) throw error(403, 'Captcha validation failed.');

        return true;
    } catch (err) {
        if (err.status) throw err;
        throw error(500, 'Error validating captcha token.');
    }
}
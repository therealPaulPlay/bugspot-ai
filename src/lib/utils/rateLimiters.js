import { RateLimiter } from 'sveltekit-rate-limiter/server';

export const standardLimiter = new RateLimiter({
    IP: [10, 's'], // 10 requests per second per IP
});

export const llmLimiter = new RateLimiter({
    IP: [3, '30s'], // Slower rate for LLM requests (AI)
});

export const fileUploadLimiter = new RateLimiter({
    IP: [3, '10s'], // Slower rate for file uploads
});
import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

export function authenticateTokenWithId(request, requestedId) {
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) throw error(401, 'No authentication header in request.');

    const token = authorizationHeader.substring('Bearer '.length);

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        if (!decoded || !decoded.userId) throw error(403, 'Access token lacks user id.');

        const tokenUserId = decoded.userId;
        if (tokenUserId != requestedId) throw error(403, 'User ID from access token does not match requested user id.');

    } catch (err) {
        throw error(403, 'Your authentication token is no longer valid. Please log in again.');
    }
}

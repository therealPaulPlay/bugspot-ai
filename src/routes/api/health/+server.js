import { json } from '@sveltejs/kit';
import * as env from '$env/static/private';

export async function GET({ request, getClientAddress }) {
    const allHeaders = Object.fromEntries(request.headers.entries());
    const safeHeaders = Object.fromEntries(
        Object.entries(allHeaders).filter(([key]) =>
            !key.toLowerCase().includes('auth') &&
            !key.toLowerCase().includes('cookie') &&
            !key.toLowerCase().includes('token')
        )
    );

    return json({
        status: 'ok',
        clientAddress: getClientAddress(),
        addressHeaderEnv: env.ADDRESS_HEADER,
        headers: safeHeaders
    });
}
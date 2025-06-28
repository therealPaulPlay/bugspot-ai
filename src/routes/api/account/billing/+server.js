import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import { authenticateTokenWithId } from '$lib/server/auth/authenticateTokenWithId.js';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// Create checkout session
export async function POST({ request, locals, url }) {
    try {
        const { userId, lookupKey } = locals.body;

        authenticateTokenWithId(request, userId);

        const userData = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!userData.length) return json({ error: 'User not found' }, { status: 404 });

        const user = userData[0];

        const prices = await stripe.prices.list({
            lookup_keys: [lookupKey],
            expand: ['data.product'],
        });

        if (!prices.data.length) return json({ error: 'Invalid subscription plan!' }, { status: 400 });

        // Create or retrieve Stripe customer
        let customer;
        if (user.stripeCustomerId) {
            customer = await stripe.customers.retrieve(user.stripeCustomerId);
        } else {
            customer = await stripe.customers.create({
                email: user.email,
                metadata: { user_id: userId },
            });

            await db.update(users)
                .set({ stripeCustomerId: customer.id })
                .where(eq(users.id, userId));
        }

        // Check for existing active subscriptions
        const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active',
        });

        if (subscriptions.data.length > 0) {
            return json({ error: 'Please cancel your existing subscription first.' }, { status: 409 });
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            billing_address_collection: 'auto',
            automatic_tax: { enabled: true },
            payment_method_types: ['card'],
            line_items: [{
                price: prices.data[0].id,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${url.origin}/dashboard?success=true`,
            cancel_url: `${url.origin}/pricing?cancelled=true`,
            customer_update: { address: 'auto' },
        });

        return json({ url: session.url });
    } catch (error) {
        console.error('Checkout session error:', error);
        return json({ error: 'Failed to create checkout session.' }, { status: 500 });
    }
}

// Create portal session for managing subscriptions
export async function PUT({ request, locals, url }) {
    try {
        const { userId } = locals.body;

        authenticateTokenWithId(request, userId);

        const userData = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!userData.length) return json({ error: 'User not found' }, { status: 404 });

        const user = userData[0];

        if (!user.stripeCustomerId) {
            return json({ error: 'No subscription found.' }, { status: 400 });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${url.origin}/pricing`,
        });

        return json({ url: portalSession.url });
    } catch (error) {
        console.error('Portal session error:', error);
        return json({ error: 'Failed to create portal session.' }, { status: 500 });
    }
}
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import { sendMail } from '$lib/utils/sendMail.js';
import Stripe from 'stripe';
import * as env from '$env/static/private';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

async function getUserByStripeCustomerId(stripeCustomerId) {
    const userData = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId)).limit(1);
    return userData.length ? userData[0] : null;
}

async function updateUserSubscription(userId, subscriptionTier) {
    await db.update(users)
        .set({ subscriptionTier })
        .where(eq(users.id, userId));
}

async function sendSubscriptionEmail(email, sessionId, amountTotal, productName) {
    const mailOptions = {
        from: env.EMAIL_USER,
        to: email,
        subject: 'Bugspot subscription',
        text: `Hi,

Thank you for subscribing to Bugspot!

Tier: ${productName}
Checkout session ID: ${sessionId}
Amount: ${((amountTotal || 0) / 100).toFixed(2)}

If you have any questions, please reach out to us via the contact form on https://paulplay.studio. 
For business details, please refer to https://paulplay.studio/imprint. 

Best regards,
The Bugspot Team`
    };

    try {
        await sendMail(mailOptions);
    } catch (error) {
        console.error('Failed to send subscription email:', error);
    }
}

export async function POST({ request }) {
    try {
        const signature = request.headers.get('stripe-signature');
        const body = await request.text();

        const event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            if (session.mode === 'subscription') {
                const subscription = await stripe.subscriptions.retrieve(session.subscription);
                const price = subscription.items.data[0].price;
                if (!price.lookup_key?.startsWith('bugspot_')) return new Response(); // Only process Bugspot-related events (but still return 200)

                const product = await stripe.products.retrieve(price.product);
                const user = await getUserByStripeCustomerId(session.customer);
                if (user) {
                    const subscriptionTier = parseInt(product.metadata?.subscription_tier || '0');
                    await updateUserSubscription(user.id, subscriptionTier);
                    await sendSubscriptionEmail(user.email, session.id, session.amount_total, product.name);
                }
            }
        } else if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
            const subscription = event.data.object;
            const price = subscription.items.data[0].price;
            if (!price.lookup_key?.startsWith('bugspot_')) return new Response(); // Only process Bugspot-related events (but still return 200)

            const user = await getUserByStripeCustomerId(subscription.customer);

            if (user) {
                if (subscription.status === 'active' && event.type !== 'customer.subscription.deleted') {
                    const product = await stripe.products.retrieve(price.product);
                    const subscriptionTier = parseInt(product.metadata?.subscription_tier || '0');
                    await updateUserSubscription(user.id, subscriptionTier);
                } else {
                    await updateUserSubscription(user.id, 0); // Downgrade to free
                }
            }
        }

        return new Response();
    } catch (error) {
        console.error('Webhook error:', error);
        return json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
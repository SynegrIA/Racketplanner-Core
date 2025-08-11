import Stripe from 'stripe';
import { DOMINIO_FRONTEND, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '../../config/config.js';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export async function createCheckoutSession({ amount, currency = 'EUR', customer_email, metadata, description }) {
    // amount en céntimos
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email,
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency,
                    unit_amount: amount,
                    product_data: {
                        name: 'Reserva de pista',
                        description: description || `Pago de reserva ${metadata?.idPartida || ''}`
                    }
                }
            }
        ],
        success_url: `${DOMINIO_FRONTEND}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${DOMINIO_FRONTEND}/pago-cancelado`,
        metadata
    });
    return session;
}

export function constructWebhookEvent(rawBody, signature) {
    return stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
}
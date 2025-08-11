import Stripe from 'stripe';
import { STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET, DOMINIO_FRONTEND } from '../../config/config.js';

export const stripe = new Stripe(STRIPE_API_KEY, { apiVersion: '2024-06-20' });

// amount en céntimos
export async function createCheckoutSession({ amount, currency = 'EUR', customer_email, metadata, description }) {
    return await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email,
        line_items: [{
            quantity: 1,
            price_data: {
                currency,
                unit_amount: amount,
                product_data: {
                    name: 'Reserva de pista',
                    description: description || `Pago de reserva ${metadata?.idPartida || ''}`
                }
            }
        }],
        // clave: autorización sin captura
        payment_intent_data: {
            capture_method: 'manual',
            metadata
        },
        success_url: `${DOMINIO_FRONTEND}`,
        cancel_url: `${DOMINIO_FRONTEND}`,
        metadata
    });
}

export async function capturePaymentIntent(paymentIntentId) {
    return await stripe.paymentIntents.capture(paymentIntentId);
}

export async function cancelPaymentIntent(paymentIntentId) {
    return await stripe.paymentIntents.cancel(paymentIntentId);
}

export function constructWebhookEvent(rawBody, signature) {
    return stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
}
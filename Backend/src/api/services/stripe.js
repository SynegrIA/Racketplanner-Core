import Stripe from 'stripe';
import { STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET, DOMINIO_FRONTEND } from '../../config/config.js';

export const stripe = new Stripe(STRIPE_API_KEY, { apiVersion: '2024-06-20' });

// amount en céntimos
export async function createCheckoutSession({
    amount,
    currency = 'EUR',
    customer_email,
    metadata,
    description,
    idempotencyKey,
    paymentMethodTypes,          // opcional: lista extra si quitas captura manual
    manualCapture = true         // flag para alternar estrategia
}) {
    const basePaymentMethodTypes = paymentMethodTypes || ['card']; // 'card' incluye Apple/Google Pay
    const params = {
        mode: 'payment',
        customer_email,
        payment_method_types: basePaymentMethodTypes,
        line_items: [{
            quantity: 1,
            price_data: {
                currency,
                unit_amount: amount,
                product_data: {
                    name: 'Reserva de pista',
                    description: description || `Pago reserva ${metadata?.idPartida || ''}`
                }
            }
        }],
        success_url: `${DOMINIO_FRONTEND}`,
        cancel_url: `${DOMINIO_FRONTEND}`,
        payment_intent_data: {
            capture_method: manualCapture ? 'manual' : 'automatic',
            metadata
        },
        metadata
    };
    const opts = idempotencyKey ? { idempotencyKey } : undefined;
    return await stripe.checkout.sessions.create(params, opts);
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
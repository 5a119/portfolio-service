import {
    accessRemainingSeconds,
    errorReply,
    rawBody,
    reply,
    successfulPaymentTimestamp,
    validatePaidSession,
    verifyStripeSignature
} from '../../server/_lib/http.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(res, 405, { error: 'method_not_allowed', message: 'Use POST for this request.' }); }
    if (!process.env.STRIPE_WEBHOOK_SECRET) return reply(res, 503, { error: 'not_configured', message: 'Payment webhook is not configured.' });
    const raw = await rawBody(req);
    if (raw.length > 1_000_000) return reply(res, 413, { error: 'too_large', message: 'Webhook request is too large.' });
    if (!verifyStripeSignature(raw.toString('utf8'), req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)) return reply(res, 400, { error: 'invalid_signature', message: 'Stripe signature could not be verified.' });
    const event = JSON.parse(raw.toString('utf8'));
    if (event.type !== 'checkout.session.completed') return reply(res, 200, { received: true });
    const session = event.data?.object;
    if (!session?.id || !await validatePaidSession(session, session.metadata?.flow_hash)) return reply(res, 400, { error: 'invalid_payment', message: 'Checkout does not match the résumé purchase.' });
    if (process.env.STRIPE_LIVE_MODE && String(session.livemode) !== process.env.STRIPE_LIVE_MODE) return reply(res, 400, { error: 'wrong_mode', message: 'Payment mode does not match this deployment.' });
    const paidAt = await successfulPaymentTimestamp(session);
    if (!paidAt) return reply(res, 400, { error: 'invalid_payment', message: 'Checkout does not include a verified successful payment.' });
    const accessSeconds = accessRemainingSeconds(paidAt);
    if (!accessSeconds) return reply(res, 200, { received: true, fulfillment: 'access_period_ended' });
    // No fulfillment write is needed: downloads verify payment directly with Stripe.
    // Retried webhook deliveries therefore have no duplicate side effects.
    return reply(res, 200, {received: true, fulfillment: 'verified'});
  } catch (error) { return errorReply(res, error); }
}

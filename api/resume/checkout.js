import {
    accessRemainingSeconds,
    ApiError,
    cookieHeader,
    cookies,
    errorReply,
    FLOW_SECONDS,
    randomId,
    redis,
    reply,
    requireMethod,
    requireOrigin,
    sha,
    stripeForm,
    stripeRequest,
    successfulPaymentTimestamp,
    throttle,
    validatePaidSession
} from '../../server/_lib/http.js';

export default async function handler(req, res) {
  try {
    requireMethod(req, res, 'POST');
    requireOrigin(req);
    await throttle(req, 'checkout', 5, 3600);
    const origin = process.env.APP_ORIGIN || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    if (!/^https?:\/\//.test(origin)) throw new ApiError(503, 'not_configured', 'Checkout needs a valid APP_ORIGIN setting.');
    const privatePdf = await redis(['GET', 'resume:private:pdf:v1']);
    if (!privatePdf || Buffer.from(privatePdf, 'base64').subarray(0, 5).toString() !== '%PDF-') throw new ApiError(503, 'resume_unavailable', 'Résumé access is not available yet. Please contact the site owner.');
    const existingFlow = cookies(req).resume_flow;
    if (existingFlow) {
      const existingHash = sha(existingFlow);
      const existingData = await redis(['GET', `resume:flow:${existingHash}`]);
      if (existingData) {
        const existing = JSON.parse(existingData);
        if (existing.sessionId) {
          const session = await stripeRequest(`checkout/sessions/${encodeURIComponent(existing.sessionId)}`);
          if (session.status === 'open' && session.url) return reply(res, 200, { url: session.url });
          if (await validatePaidSession(session, existingHash) && (!process.env.STRIPE_LIVE_MODE || String(session.livemode) === process.env.STRIPE_LIVE_MODE)) {
            const paidAt = await successfulPaymentTimestamp(session);
            if (paidAt && accessRemainingSeconds(paidAt) > 0) return reply(res, 200, { url: `${origin}/?resume=success&session_id=${encodeURIComponent(session.id)}` });
          }
        }
      }
    }
    const flow = randomId(32);
    const flowHash = sha(flow);
    await redis(['SET', `resume:flow:${flowHash}`, JSON.stringify({ status: 'creating', createdAt: Date.now() }), 'EX', String(FLOW_SECONDS), 'NX']);
    const params = stripeForm({
      mode: 'payment',
      'payment_method_types[0]': 'card',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': '500',
      'line_items[0][price_data][product_data][name]': 'Résumé instant access',
      'line_items[0][quantity]': '1',
      success_url: `${origin}/?resume=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?resume=cancelled`,
      client_reference_id: flowHash,
      'metadata[product]': 'resume-v1',
      'metadata[flow_hash]': flowHash,
    });
    const session = await stripeRequest('checkout/sessions', params);
    if (!session.url || !session.id) throw new ApiError(502, 'payment_provider_failed', 'Checkout could not be started. Please try again.');
    await redis(['SET', `resume:flow:${flowHash}`, JSON.stringify({ status: 'checkout', sessionId: session.id, createdAt: Date.now() }), 'EX', String(FLOW_SECONDS)]);
    return reply(res, 200, { url: session.url }, { 'Set-Cookie': [cookieHeader('resume_flow', flow, FLOW_SECONDS), cookieHeader(`resume_session_${session.id}`, flow, FLOW_SECONDS)] });
  } catch (error) { return errorReply(res, error); }
}

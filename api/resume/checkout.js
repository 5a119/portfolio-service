import {
    accessRemainingSeconds,
    ApiError,
    cookieHeader,
    cookies,
    errorReply,
    FLOW_SECONDS,
    randomId,
    reply,
    requireMethod,
    requireOrigin,
    sha,
    stripeForm,
    stripeRequest,
    successfulPaymentTimestamp,
    validatePaidSession
} from '../../server/_lib/http.js';

import {limitResumeRequests, readPrivateResume} from '../../server/_lib/private-resume.js';

export function createCheckoutHandler({loadPdf = readPrivateResume, rateLimit = limitResumeRequests} = {}) {
  return async function handler(req, res) {
    try {
      requireMethod(req, res, 'POST');
      requireOrigin(req);
      await rateLimit(req, 'checkout', 5, 3600);
      const origin = process.env.APP_ORIGIN || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
      if (!/^https?:\/\//.test(origin)) throw new ApiError(503, 'not_configured', 'Checkout needs a valid APP_ORIGIN setting.');
      await loadPdf();
      const browserCookies = cookies(req);
      const existingFlow = browserCookies.resume_flow;
      const existingSession = browserCookies.resume_checkout;
      if (existingFlow && /^cs_(test|live)_[A-Za-z0-9]+$/.test(existingSession || '')) {
        const existingHash = sha(existingFlow);
        const session = await stripeRequest(`checkout/sessions/${encodeURIComponent(existingSession)}`);
        if (session.metadata?.flow_hash === existingHash) {
          if (session.status === 'open' && session.url) return reply(res, 200, {url: session.url});
          if (await validatePaidSession(session, existingHash) && (!process.env.STRIPE_LIVE_MODE || String(session.livemode) === process.env.STRIPE_LIVE_MODE)) {
            const paidAt = await successfulPaymentTimestamp(session);
            if (paidAt && accessRemainingSeconds(paidAt) > 0) return reply(res, 200, {url: `${origin}/?resume=success&session_id=${session.id}`});
          }
        }
      }
      const flow = randomId(32);
      const flowHash = sha(flow);
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
      return reply(res, 200, { url: session.url }, { 'Set-Cookie': [cookieHeader('resume_flow', flow, FLOW_SECONDS), cookieHeader('resume_checkout', session.id, FLOW_SECONDS), cookieHeader(`resume_session_${session.id}`, flow, FLOW_SECONDS)] });
    } catch (error) { return errorReply(res, error); }
  };
}

export default createCheckoutHandler();

import {
    accessRemainingSeconds,
    cookieHeader,
    cookies,
    errorReply,
    requireMethod,
    sha,
    stripeRequest,
    successfulPaymentTimestamp,
    validatePaidSession
} from '../../server/_lib/http.js';

import {readPrivateResume} from '../../server/_lib/private-resume.js';

function fail(res, status, message) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.end(message);
}

export default async function handler(req, res) {
  try {
    requireMethod(req, res, 'GET');
    const sessionId = typeof req.query?.session_id === 'string' ? req.query.session_id : '';
    const browserCookies = cookies(req);
    const flow = browserCookies[`resume_session_${sessionId}`] || browserCookies.resume_flow;
    if (!flow || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return fail(res, 401, 'Open the résumé link in the same browser used to pay.');
    const flowHash = sha(flow);
    const session = await stripeRequest(`checkout/sessions/${encodeURIComponent(sessionId)}`);
    if (process.env.STRIPE_LIVE_MODE && String(session.livemode) !== process.env.STRIPE_LIVE_MODE) return fail(res, 403, 'This payment could not be verified.');
    if (!await validatePaidSession(session, flowHash)) return fail(res, 403, 'Payment is not complete or could not be verified.');
    const paidAt = await successfulPaymentTimestamp(session);
    if (!paidAt) return fail(res, 403, 'Payment is not complete or could not be verified.');
    const remaining = accessRemainingSeconds(paidAt);
    if (!remaining) return fail(res, 403, 'The 30-day résumé access period has ended. Email the site owner with your Stripe receipt for help.');
    const pdf = await readPrivateResume();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Content-Disposition', 'inline; filename="Sang-Nguyen-Resume.pdf"');
    res.setHeader('Cache-Control', 'no-store, private');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Set-Cookie', [cookieHeader('resume_flow', flow, remaining), cookieHeader(`resume_session_${sessionId}`, flow, remaining)]);
    return res.end(pdf);
  } catch (error) {
    if (error.status) return fail(res, error.status, error.message);
    return errorReply(res, error);
  }
}

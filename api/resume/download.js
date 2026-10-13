import {
    ACCESS_SECONDS,
    accessRemainingSeconds,
    cookieHeader,
    cookies,
    errorReply,
    redis,
    requireMethod,
    sha,
    stripeRequest,
    successfulPaymentTimestamp,
    validatePaidSession
} from '../../server/_lib/http.js';

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
    const flowRecord = await redis(['GET', `resume:flow:${flowHash}`]);
    if (!flowRecord || JSON.parse(flowRecord).sessionId !== sessionId) return fail(res, 403, 'This purchase is not linked to this browser.');
    const session = await stripeRequest(`checkout/sessions/${encodeURIComponent(sessionId)}`);
    if (process.env.STRIPE_LIVE_MODE && String(session.livemode) !== process.env.STRIPE_LIVE_MODE) return fail(res, 403, 'This payment could not be verified.');
    if (!await validatePaidSession(session, flowHash)) return fail(res, 403, 'Payment is not complete or could not be verified.');
    const paidAt = await successfulPaymentTimestamp(session);
    if (!paidAt) return fail(res, 403, 'Payment is not complete or could not be verified.');
    const remaining = accessRemainingSeconds(paidAt);
    if (!remaining) return fail(res, 403, 'The 30-day résumé access period has ended. Email the site owner with your Stripe receipt for help.');
    const paid = await redis(['GET', `resume:paid:${sessionId}`]);
    if (paid && JSON.parse(paid).flowHash !== flowHash) return fail(res, 403, 'This purchase is not linked to this browser.');
    await redis(['SET', `resume:flow:${flowHash}`, JSON.stringify({status: 'checkout', sessionId}), 'EX', String(remaining)]);
    await redis(['SET', `resume:paid:${sessionId}`, JSON.stringify({ flowHash, paidAt, expiresAt: paidAt + ACCESS_SECONDS * 1000 }), 'EX', String(remaining)]);
    const asset = await redis(['GET', 'resume:private:pdf:v1']);
    if (!asset) return fail(res, 503, 'The résumé file has not been uploaded yet. Please contact the site owner.');
    const pdf = Buffer.from(asset, 'base64');
    if (pdf.length < 100 || pdf.subarray(0, 5).toString() !== '%PDF-') return fail(res, 503, 'The private résumé file is unavailable.');
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

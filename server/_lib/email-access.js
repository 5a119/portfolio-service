import {
  ApiError,
  cookieHeader,
  cookies,
  errorReply,
  randomId,
  redis,
  reply,
  requireOrigin,
  sha,
  throttle
} from './http.js';

const ACCESS_SECONDS = 30 * 24 * 60 * 60;
const WAIT_SECONDS = 10;

export function createEmailAccessHandler({store = redis, checkOrigin = requireOrigin, rateLimit = throttle} = {}) {
  return async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      checkOrigin(req);
      await rateLimit(req, 'email-access', 20, 3600);
      const token = randomId(24);
      const readyAt = Date.now() + WAIT_SECONDS * 1000;
      await store(['SET', `resume:email-access:${sha(token)}`, JSON.stringify({readyAt}), 'EX', String(ACCESS_SECONDS)]);
      return reply(res, 200, {waitSeconds: WAIT_SECONDS}, {'Set-Cookie': cookieHeader('resume_email_access', token, ACCESS_SECONDS)});
    }
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET, POST');
      throw new ApiError(405, 'method_not_allowed', 'Use GET or POST for this request.');
    }
    const token = cookies(req).resume_email_access;
    const record = token && await store(['GET', `resume:email-access:${sha(token)}`]);
    if (!record) throw new ApiError(401, 'email_access_required', 'Return to the portfolio and use Send Message to access the résumé.');
    const {readyAt} = JSON.parse(record);
    if (!Number.isFinite(readyAt) || Date.now() < readyAt) throw new ApiError(403, 'countdown_pending', 'Wait for the 10-second countdown to finish, then try again.');
    const asset = await store(['GET', 'resume:private:pdf:v1']);
    const pdf = asset && Buffer.from(asset, 'base64');
    if (!pdf || pdf.length < 100 || pdf.subarray(0, 5).toString() !== '%PDF-') throw new ApiError(503, 'resume_unavailable', 'The résumé file is unavailable. Please contact the site owner.');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Content-Disposition', 'inline; filename="Sang-Nguyen-Resume.pdf"');
    res.setHeader('Cache-Control', 'no-store, private');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    return res.end(pdf);
  } catch (error) { return errorReply(res, error); }
  };
}

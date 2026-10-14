import {ApiError, cookieHeader, cookies, errorReply, reply, requireOrigin} from './http.js';
import {limitResumeRequests, readPrivateResume, signResumeAccess, verifyResumeAccess} from './private-resume.js';

const ACCESS_SECONDS = 30 * 24 * 60 * 60;
const WAIT_SECONDS = 10;

export function createEmailAccessHandler({loadPdf = readPrivateResume, checkOrigin = requireOrigin, rateLimit = limitResumeRequests} = {}) {
  return async function handler(req, res) {
    try {
      if (req.method === 'POST') {
        checkOrigin(req);
        await rateLimit(req, 'email-access', 20, 3600);
        await loadPdf();
        const readyAt = Date.now() + WAIT_SECONDS * 1000;
        const token = await signResumeAccess({purpose: 'email-resume', readyAt, expiresAt: Date.now() + ACCESS_SECONDS * 1000});
        return reply(res, 200, {waitSeconds: WAIT_SECONDS}, {'Set-Cookie': cookieHeader('resume_email_access', token, ACCESS_SECONDS)});
      }
      if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET, POST');
        throw new ApiError(405, 'method_not_allowed', 'Use GET or POST for this request.');
      }
      const access = await verifyResumeAccess(cookies(req).resume_email_access);
      if (!access) throw new ApiError(401, 'email_access_required', 'Return to the portfolio and use Send Message to access the r?sum?.');
      if (Date.now() < access.readyAt) throw new ApiError(403, 'countdown_pending', 'Wait for the 10-second countdown to finish, then try again.');
      const pdf = await loadPdf();
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

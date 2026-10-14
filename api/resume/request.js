import {
    ApiError,
    CODE_SECONDS,
    codeHash,
    errorReply,
    parseBody,
    randomCode,
    randomId,
    redis,
    reply,
    requireMethod,
    requireOrigin,
    sendEmail,
    throttle,
    throttleIdentity,
    validateEmail
} from '../../server/_lib/http.js';

export default async function handler(req, res) {
  try {
    requireMethod(req, res, 'POST');
    requireOrigin(req);
    await throttle(req, 'request', 4, 3600);
    const body = parseBody(req);
    if (typeof body.website === 'string' && body.website.trim()) return reply(res, 200, { requestId: randomId(), status: 'pending' });
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!name || name.length > 100 || !validateEmail(email) || !subject || subject.length > 160 || !message || message.length > 2000) {
      throw new ApiError(400, 'invalid_request', 'Enter a name, valid email, subject, and message. Keep the message under 2,000 characters.');
    }
    await throttleIdentity(email, 'verification-email', 3, 86400);
    if (!process.env.VERIFY_CODE_SECRET) throw new ApiError(503, 'not_configured', 'Email verification is not ready yet (VERIFY_CODE_SECRET).');
    const requestId = randomId(18);
    const code = randomCode();
    const record = { status: 'pending', name, email, subject, message, codeHash: codeHash(email, code), codeExpiresAt: Date.now() + CODE_SECONDS * 1000, codeAttempts: 0, lastCodeSentAt: Date.now(), createdAt: Date.now() };
    await redis(['SET', `resume:request:${requestId}`, JSON.stringify(record), 'EX', '2592000', 'NX']);
    try {
      await sendEmail({ to: email, subject: 'Your résumé request verification code', text: `Hi ${name},\n\nYour verification code is ${code}. Enter it on the portfolio page within 15 minutes.\n\nIf you did not request this, you can ignore this message.`, idempotencyKey: `resume-verify-${requestId}-0` });
      return reply(res, 200, { requestId, status: 'code_sent', codeExpiresIn: CODE_SECONDS });
    } catch {
      return reply(res, 200, { requestId, status: 'code_send_failed', codeExpiresIn: CODE_SECONDS, retryAfter: 60 });
    }
  } catch (error) { return errorReply(res, error); }
}

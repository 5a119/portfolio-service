import {
    ApiError,
    CODE_SECONDS,
    codeHash,
    errorReply,
    parseBody,
    randomCode,
    redis,
    reply,
    requireMethod,
    requireOrigin,
    sendEmail,
    throttle,
    throttleIdentity
} from '../../server/_lib/http.js';

const RESEND_SCRIPT = `local v=redis.call('GET',KEYS[1]); if not v then return -1 end; local r=cjson.decode(v); if r.status~='pending' then return -2 end; local now=tonumber(ARGV[1]); if now-tonumber(r.lastCodeSentAt or 0)<60000 then return -3 end; r.codeHash=ARGV[2]; r.codeExpiresAt=now+tonumber(ARGV[3])*1000; r.codeAttempts=0; r.lastCodeSentAt=now; redis.call('SET',KEYS[1],cjson.encode(r),'KEEPTTL'); return tonumber(r.lastCodeSentAt)`;

export default async function handler(req, res) {
  try {
    requireMethod(req, res, 'POST');
    requireOrigin(req);
    await throttle(req, 'resend-code', 5, 3600);
    const { requestId } = parseBody(req);
    if (typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{20,40}$/.test(requestId)) throw new ApiError(400, 'invalid_request', 'This request has expired. Start a new résumé request.');
    const key = `resume:request:${requestId}`;
    const raw = await redis(['GET', key]);
    if (!raw) throw new ApiError(404, 'request_expired', 'This request has expired. Start a new résumé request.');
    const record = JSON.parse(raw);
    if (record.status !== 'pending') throw new ApiError(409, 'request_already_verified', 'This email has already been verified.');
    if (!process.env.VERIFY_CODE_SECRET) throw new ApiError(503, 'not_configured', 'Email verification is not ready yet.');
    if (Date.now() - Number(record.lastCodeSentAt || 0) < 60_000) throw new ApiError(429, 'resend_cooldown', 'Wait 60 seconds between verification code emails.');
    await throttleIdentity(record.email, 'verification-email', 3, 86400);
    const code = randomCode();
    const result = Number(await redis(['EVAL', RESEND_SCRIPT, '1', key, String(Date.now()), codeHash(record.email, code), String(CODE_SECONDS)]));
    if (result === -3) throw new ApiError(429, 'resend_cooldown', 'Wait 60 seconds between verification code emails.');
    if (result < 0) throw new ApiError(409, 'request_expired', 'This request can no longer be verified. Start a new résumé request.');
    await sendEmail({ to: record.email, subject: 'Your résumé request verification code', text: `Hi ${record.name},\n\nYour new verification code is ${code}. Enter it on the portfolio page within 15 minutes.\n\nIf you did not request this, you can ignore this message.`, idempotencyKey: `resume-verify-${requestId}-${result}` });
    return reply(res, 200, { status: 'code_sent', codeExpiresIn: CODE_SECONDS });
  } catch (error) { return errorReply(res, error); }
}

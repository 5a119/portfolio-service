import {
    ApiError,
    codeHash,
    errorReply,
    parseBody,
    redis,
    reply,
    requireMethod,
    requireOrigin,
    throttle
} from '../../server/_lib/http.js';
import {retryOwnerNotification} from '../../server/_lib/notifications.js';

const VERIFY_SCRIPT = `local v=redis.call('GET',KEYS[1]); if not v then return -1 end; local r=cjson.decode(v); if r.status~='pending' then return -2 end; if tonumber(r.codeExpiresAt or 0)<tonumber(ARGV[2]) then return -3 end; if tonumber(r.codeAttempts or 0)>=5 then return -4 end; if r.codeHash~=ARGV[1] then r.codeAttempts=tonumber(r.codeAttempts or 0)+1; if r.codeAttempts>=5 then r.codeHash=nil end; redis.call('SET',KEYS[1],cjson.encode(r),'KEEPTTL'); return -5 end; r.status='verified_pending_delivery'; r.codeHash=nil; r.codeAttempts=0; r.verifiedAt=tonumber(ARGV[2]); redis.call('SET',KEYS[1],cjson.encode(r),'KEEPTTL'); return 1`;

export default async function handler(req, res) {
  try {
    requireMethod(req, res, 'POST');
    requireOrigin(req);
    await throttle(req, 'verify', 12, 3600);
    const { requestId, code } = parseBody(req);
    if (typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{20,40}$/.test(requestId) || typeof code !== 'string' || !/^\d{6}$/.test(code)) throw new ApiError(400, 'invalid_code', 'Enter the six-digit code from your email.');
    if (!process.env.VERIFY_CODE_SECRET) throw new ApiError(503, 'not_configured', 'Email verification is not ready yet.');
    const key = `resume:request:${requestId}`;
    const raw = await redis(['GET', key]);
    if (!raw) throw new ApiError(400, 'code_expired', 'This code has expired. Request a new code.');
    const record = JSON.parse(raw);
    if (record.status !== 'pending') throw new ApiError(409, 'already_verified', 'This email was already verified. Use the retry button if request delivery needs attention.');
    const result = Number(await redis(['EVAL', VERIFY_SCRIPT, '1', key, codeHash(record.email, code), String(Date.now())]));
    if (result === -3) throw new ApiError(400, 'code_expired', 'This code has expired. Request a new code.');
    if (result === -4 || result === -5) throw new ApiError(400, 'invalid_code', 'That code is incorrect or has been used too many times. Request a new code.');
    if (result < 0 && result !== -2) throw new ApiError(400, 'request_expired', 'This request has expired. Start a new résumé request.');
    const notification = await retryOwnerNotification(requestId);
    return reply(res, 200, { status: 'verified', notification });
  } catch (error) { return errorReply(res, error); }
}

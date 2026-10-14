import {ApiError, OWNER_EMAIL, redis, sendEmail} from './http.js';

const CLAIM = `local v=redis.call('GET',KEYS[1]); if not v then return -1 end; local r=cjson.decode(v); if r.status=='notified' then return 2 end; local now=tonumber(ARGV[1]); if r.status=='notifying' and now-tonumber(r.notifyingAt or 0)<120000 then return 0 end; if r.status~='verified_pending_delivery' and r.status~='notify_failed' and r.status~='notifying' then return -2 end; r.status='notifying'; r.notifyingAt=now; redis.call('SET',KEYS[1],cjson.encode(r),'KEEPTTL'); return 1`;
const FINISH = `local v=redis.call('GET',KEYS[1]); if not v then return 0 end; local r=cjson.decode(v); if r.status~='notifying' then return 0 end; r.status=ARGV[1]; r.notifyingAt=nil; r.notificationAcceptedAt=ARGV[2]; r.providerMessageId=ARGV[3]; redis.call('SET',KEYS[1],cjson.encode(r),'KEEPTTL'); return 1`;

export async function retryOwnerNotification(requestId) {
  const key = `resume:request:${requestId}`;
  const claim = Number(await redis(['EVAL', CLAIM, '1', key, String(Date.now())]));
  if (claim === 2) return 'accepted';
  if (claim === 0) return 'processing';
  if (claim < 0) throw new ApiError(409, 'request_not_verified', 'Verify your email before submitting this request.');
  const record = JSON.parse(await redis(['GET', key]));
  try {
    const messageId = await sendEmail({
      to: OWNER_EMAIL,
      subject: `Résumé access request: ${record.subject}`,
      text: `Verified email: ${record.email}\nName: ${record.name}\nSubject: ${record.subject}\n\n${record.message}\n\nThis address completed the site's email verification code. This confirms control of the mailbox, not an independent email sent from Gmail.`,
      idempotencyKey: `resume-owner-request-${requestId}`,
    });
    await redis(['EVAL', FINISH, '1', key, 'notified', String(Date.now()), messageId]);
    return 'accepted';
  } catch (error) {
    await redis(['EVAL', FINISH, '1', key, 'notify_failed', '', '']);
    if (error?.code === 'email_provider_failed' || error?.status === 502) return 'failed';
    throw error;
  }
}

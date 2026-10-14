import {
    ApiError,
    errorReply,
    parseBody,
    redis,
    reply,
    requireMethod,
    requireOrigin,
    throttle
} from '../../server/_lib/http.js';
import {retryOwnerNotification} from '../../server/_lib/notifications.js';

export default async function handler(req, res) {
  try {
    requireMethod(req, res, 'POST');
    requireOrigin(req);
    await throttle(req, 'notify', 5, 3600);
    const { requestId } = parseBody(req);
    if (typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{20,40}$/.test(requestId)) throw new ApiError(400, 'invalid_request', 'This request has expired.');
    const raw = await redis(['GET', `resume:request:${requestId}`]);
    if (!raw) throw new ApiError(404, 'request_expired', 'This request has expired. Start a new one.');
    const record = JSON.parse(raw);
    if (record.status === 'notified') return reply(res, 200, { status: 'accepted' });
    if (!['verified_pending_delivery', 'notify_failed', 'notifying'].includes(record.status)) throw new ApiError(409, 'request_not_ready', 'Verify your email before asking for access.');
    return reply(res, 200, { status: await retryOwnerNotification(requestId) });
  } catch (error) { return errorReply(res, error); }
}

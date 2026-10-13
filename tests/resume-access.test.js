import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import checkoutWebhook from '../api/stripe/webhook.js';
import startCheckout from '../api/resume/checkout.js';
import downloadResume from '../api/resume/download.js';
import resendCode from '../api/resume/resend-code.js';
import createRequest from '../api/resume/request.js';
import notifyRequest from '../api/resume/notify.js';
import verifyCode from '../api/resume/verify.js';
import {ACCESS_SECONDS, accessRemainingSeconds, codeHash, sha} from '../server/_lib/http.js';
import {
  makeApiError,
  notificationFeedback,
  verificationRecovery
} from '../src/components/resume-notification-status.js';

const savedFetch = globalThis.fetch;
const savedEnv = {...process.env};
const redisData = new Map();
const stripeSessions = new Map();
const stripePaymentIntents = new Map();
const stripeCharges = new Map();
const stripeLineItems = [];
const emailOutbox = [];
let stripeCreateCalls = 0;
let stripeSecret = 'stripe_test_secret';

function set(key, value) { redisData.set(key, String(value)); }
function get(key) { return redisData.get(key) ?? null; }

function fakeRedisCommand(command) {
  const [operation, ...args] = command;
  if (operation === 'GET') return get(args[0]);
  if (operation === 'DEL') return redisData.delete(args[0]) ? 1 : 0;
  if (operation === 'SET') {
    const [key, value, ...options] = args;
    if (options.includes('NX') && redisData.has(key)) return null;
    redisData.set(key, value);
    return 'OK';
  }
  if (operation !== 'EVAL') throw new Error(`Unexpected Redis command: ${operation}`);
  const [script, , key, ...argv] = args;
  const recordRaw = get(key);
  if (!recordRaw && !script.includes("redis.call('INCR'")) return -1;
  const record = recordRaw ? JSON.parse(recordRaw) : null;
  if (script.includes("redis.call('INCR'")) {
    const count = Number(get(key) || 0) + 1;
    set(key, count);
    return count;
  }
  if (script.includes('r.lastCodeSentAt')) {
    const [nowArg, digest, duration] = argv;
    const now = Number(nowArg);
    if (record.status !== 'pending') return -2;
    if (now - Number(record.lastCodeSentAt || 0) < 60_000) return -3;
    record.codeHash = digest;
    record.codeExpiresAt = now + Number(duration) * 1000;
    record.codeAttempts = 0;
    record.lastCodeSentAt = now;
    set(key, JSON.stringify(record));
    return record.lastCodeSentAt;
  }
  if (script.includes('codeAttempts')) {
    const [digest, now] = argv;
    if (record.status !== 'pending') return -2;
    if (Number(record.codeExpiresAt) < Number(now)) return -3;
    if (Number(record.codeAttempts || 0) >= 5) return -4;
    if (record.codeHash !== digest) {
      record.codeAttempts = Number(record.codeAttempts || 0) + 1;
      if (record.codeAttempts >= 5) delete record.codeHash;
      set(key, JSON.stringify(record));
      return -5;
    }
    record.status = 'verified_pending_delivery';
    delete record.codeHash;
    record.codeAttempts = 0;
    record.verifiedAt = Number(now);
    set(key, JSON.stringify(record));
    return 1;
  }
  if (script.includes("r.status=='notified'")) {
    if (record.status === 'notified') return 2;
    const now = Number(argv[0]);
    if (record.status === 'notifying' && now - Number(record.notifyingAt || 0) < 120_000) return 0;
    if (!['verified_pending_delivery', 'notify_failed', 'notifying'].includes(record.status)) return -2;
    record.status = 'notifying';
    record.notifyingAt = now;
    set(key, JSON.stringify(record));
    return 1;
  }
  if (script.includes('providerMessageId')) {
    if (record.status !== 'notifying') return 0;
    record.status = argv[0];
    delete record.notifyingAt;
    record.notificationAcceptedAt = argv[1];
    record.providerMessageId = argv[2];
    set(key, JSON.stringify(record));
    return 1;
  }
  throw new Error('Unrecognized Redis Lua script in test harness');
}

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), {status, headers: {'Content-Type': 'application/json'}});
}

function installMocks() {
  globalThis.fetch = async (input, options = {}) => {
    const url = String(input);
    if (url === process.env.UPSTASH_REDIS_REST_URL) return response({result: fakeRedisCommand(JSON.parse(options.body))});
    if (url.startsWith('https://api.resend.com/emails')) {
      const payload = JSON.parse(options.body);
      emailOutbox.push({payload, key: options.headers['Idempotency-Key']});
      return response({id: `email-${emailOutbox.length}`});
    }
    if (url === 'https://api.stripe.com/v1/checkout/sessions' && options.method === 'POST') {
      stripeCreateCalls += 1;
      const form = new URLSearchParams(options.body);
      const id = `cs_test_created${stripeCreateCalls}`;
      const flowHash = form.get('metadata[flow_hash]');
      const session = {id, status: 'open', url: `https://checkout.stripe.test/${id}`, mode: 'payment', payment_status: 'unpaid', currency: 'usd', amount_total: 500, metadata: {product: 'resume-v1', flow_hash: flowHash}, livemode: false};
      stripeSessions.set(id, session);
      return response(session);
    }
    if (url.includes('api.stripe.com/v1/checkout/sessions/')) {
      const suffix = url.split('/v1/checkout/sessions/')[1];
      const id = decodeURIComponent(suffix.split('/')[0]);
      if (suffix.includes('/line_items')) return response({data: stripeLineItems});
      return response(stripeSessions.get(id) || {}, stripeSessions.has(id) ? 200 : 404);
    }
    if (url.includes('api.stripe.com/v1/payment_intents/')) {
      const id = url.split('/v1/payment_intents/')[1].split('?')[0];
      return response(stripePaymentIntents.get(id) || {}, stripePaymentIntents.has(id) ? 200 : 404);
    }
    if (url.includes('api.stripe.com/v1/charges/')) {
      const id = url.split('/v1/charges/')[1].split('?')[0];
      return response(stripeCharges.get(id) || {}, stripeCharges.has(id) ? 200 : 404);
    }
    throw new Error(`Unexpected provider call: ${url}`);
  };
}

function mockRes() {
  return {
    headers: {}, statusCode: 0, body: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(value = '') { this.body = value; },
    json() { return JSON.parse(this.body); },
  };
}

function signedEvent(event) {
  const raw = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${raw}`).digest('hex');
  return {raw, header: `t=${timestamp},v1=${signature}`};
}

test.beforeEach(() => {
  redisData.clear(); stripeSessions.clear(); stripePaymentIntents.clear(); stripeCharges.clear(); stripeLineItems.length = 0; emailOutbox.length = 0;
  stripeCreateCalls = 0;
  Object.assign(process.env, {
    UPSTASH_REDIS_REST_URL: 'https://redis.example.test', UPSTASH_REDIS_REST_TOKEN: 'test-token',
    VERIFY_CODE_SECRET: 'test-verification-secret', RESEND_API_KEY: 'test-email-key', EMAIL_FROM: 'Portfolio <test@example.test>',
    STRIPE_SECRET_KEY: stripeSecret, STRIPE_WEBHOOK_SECRET: 'test-webhook-secret', APP_ORIGIN: 'https://portfolio.example.test',
    STRIPE_LIVE_MODE: 'false', NODE_ENV: 'test',
  });
  installMocks();
});

function addSuccessfulPayment(session, paidAt = Math.floor(Date.now() / 1000)) {
  const paymentIntentId = 'pi_resume123';
  const chargeId = 'ch_resume123';
  session.payment_intent = paymentIntentId;
  stripePaymentIntents.set(paymentIntentId, {id: paymentIntentId, status: 'succeeded', amount: 500, currency: 'usd', latest_charge: chargeId});
  stripeCharges.set(chargeId, {id: chargeId, payment_intent: paymentIntentId, paid: true, captured: true, amount: 500, amount_captured: 500, currency: 'usd', created: paidAt});
}

test.after(() => {
  globalThis.fetch = savedFetch;
  for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
  Object.assign(process.env, savedEnv);
});

test('rejects unsigned callbacks and records signed paid fulfillment idempotently', async () => {
  const flow = 'bound-browser-secret';
  const flowHash = sha(flow);
  const session = {id: 'cs_test_example123', mode: 'payment', payment_status: 'paid', currency: 'usd', amount_total: 500, metadata: {product: 'resume-v1', flow_hash: flowHash}, created: 1_800_000_000, livemode: false};
  addSuccessfulPayment(session);
  stripeSessions.set(session.id, session);
  stripeLineItems.push({quantity: 1, price: {unit_amount: 500, currency: 'usd'}});
  set(`resume:flow:${flowHash}`, JSON.stringify({status: 'checkout', sessionId: session.id}));
  const event = {id: 'evt_once', type: 'checkout.session.completed', data: {object: session}};
  const invalid = mockRes();
  await checkoutWebhook({method: 'POST', body: Buffer.from(JSON.stringify(event)), headers: {'stripe-signature': 't=1,v1=forged'}}, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.equal(get(`resume:paid:${session.id}`), null);
  const signed = signedEvent(event);
  const invoke = async () => {
    const result = mockRes();
    await checkoutWebhook({method: 'POST', body: Buffer.from(signed.raw), headers: {'stripe-signature': signed.header}}, result);
    return result;
  };
  assert.equal((await invoke()).statusCode, 200);
  assert.equal((await invoke()).json().fulfillment, 'duplicate');
  assert.equal(JSON.parse(get(`resume:paid:${session.id}`)).flowHash, flowHash);
});

test('does not charge without the private PDF and reuses a paid browser flow', async () => {
  const request = {method: 'POST', headers: {origin: process.env.APP_ORIGIN, host: 'portfolio.example.test'}, body: {}};
  let result = mockRes();
  await startCheckout(request, result);
  assert.equal(result.statusCode, 503);
  assert.equal(stripeCreateCalls, 0);

  set('resume:private:pdf:v1', Buffer.from('%PDF-1.7').toString('base64'));
  const flow = 'already-paid-browser-secret';
  const flowHash = sha(flow);
  const session = {id: 'cs_test_paidflow', status: 'complete', url: null, mode: 'payment', payment_status: 'paid', currency: 'usd', amount_total: 500, metadata: {product: 'resume-v1', flow_hash: flowHash}, created: Math.floor(Date.now() / 1000) - 86_400, livemode: false};
  addSuccessfulPayment(session);
  stripeSessions.set(session.id, session);
  stripeLineItems.push({quantity: 1, price: {unit_amount: 500, currency: 'usd'}});
  set(`resume:flow:${flowHash}`, JSON.stringify({status: 'checkout', sessionId: session.id}));
  result = mockRes();
  await startCheckout({...request, headers: {...request.headers, cookie: `resume_flow=${flow}`}}, result);
  assert.equal(result.statusCode, 200);
  assert.equal(result.json().url, `${process.env.APP_ORIGIN}/?resume=success&session_id=${session.id}`);
  assert.equal(stripeCreateCalls, 0);
  assert.equal(result.headers['set-cookie'], undefined);
});

test('per-session browser bindings preserve access to two initial checkouts', async () => {
  set('resume:private:pdf:v1', Buffer.from(`%PDF-1.7 ${'x'.repeat(120)}`).toString('base64'));
  const request = {method: 'POST', headers: {origin: process.env.APP_ORIGIN, host: 'portfolio.example.test'}, body: {}};
  const invokeCheckout = async () => {
    const result = mockRes();
    await startCheckout(request, result);
    return result;
  };
  const first = await invokeCheckout();
  const second = await invokeCheckout();
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
  assert.equal(stripeCreateCalls, 2);

  const jar = new Map();
  for (const result of [first, second]) {
    for (const cookie of result.headers['set-cookie']) {
      const [pair] = cookie.split(';');
      const index = pair.indexOf('=');
      jar.set(pair.slice(0, index), decodeURIComponent(pair.slice(index + 1)));
    }
  }
  const sessionIds = ['cs_test_created1', 'cs_test_created2'];
  for (const [index, sessionId] of sessionIds.entries()) {
    const session = stripeSessions.get(sessionId);
    session.status = 'complete';
    session.payment_status = 'paid';
    addSuccessfulPayment(session, Math.floor(Date.now() / 1000) - index);
  }
  stripeLineItems.push({quantity: 1, price: {unit_amount: 500, currency: 'usd'}});
  const cookie = [...jar].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join('; ');
  for (const sessionId of sessionIds) {
    const result = mockRes();
    await downloadResume({method: 'GET', query: {session_id: sessionId}, headers: {cookie}}, result);
    assert.equal(result.statusCode, 200, `download failed for ${sessionId}`);
    assert.match(Buffer.from(result.body).toString(), /^%PDF-/);
  }
});

test('download requires the original browser cookie and a fully paid fixed-price session', async () => {
  const flow = 'bound-browser-secret';
  const flowHash = sha(flow);
  const session = {id: 'cs_test_paid123', mode: 'payment', payment_status: 'paid', currency: 'usd', amount_total: 500, metadata: {product: 'resume-v1', flow_hash: flowHash}, created: Math.floor(Date.now() / 1000) - 86_400, livemode: false};
  addSuccessfulPayment(session);
  stripeSessions.set(session.id, session);
  stripeLineItems.push({quantity: 1, price: {unit_amount: 500, currency: 'usd'}});
  set(`resume:flow:${flowHash}`, JSON.stringify({status: 'checkout', sessionId: session.id}));
  set('resume:private:pdf:v1', Buffer.from(`%PDF-1.7 ${'x'.repeat(120)}`).toString('base64'));

  const call = async (cookie, id = session.id) => {
    const result = mockRes();
    await downloadResume({method: 'GET', query: {session_id: id}, headers: cookie ? {cookie: `resume_flow=${cookie}`} : {}}, result);
    return result;
  };
  assert.equal((await call('')).statusCode, 401);
  assert.equal((await call('different-browser', session.id)).statusCode, 403);
  session.payment_status = 'unpaid';
  assert.equal((await call(flow)).statusCode, 403);
  session.payment_status = 'paid';
  const allowed = await call(flow);
  assert.equal(allowed.statusCode, 200);
  assert.equal(allowed.headers['cache-control'], 'no-store, private');
  assert.match(Buffer.from(allowed.body).toString(), /^%PDF-/);
  const entitlement = JSON.parse(get(`resume:paid:${session.id}`));
  const paidAt = stripeCharges.get('ch_resume123').created * 1000;
  assert.equal(entitlement.paidAt, paidAt);
  assert.equal(entitlement.expiresAt, paidAt + ACCESS_SECONDS * 1000);
  assert.ok(accessRemainingSeconds(paidAt) > ACCESS_SECONDS - 5);
});

test('expired verification codes cannot notify the owner', async () => {
  const requestId = 'request_id_123456789012345';
  set(`resume:request:${requestId}`, JSON.stringify({status: 'pending', email: 'reader@example.test', name: 'Reader', subject: 'Role', message: 'Please review', codeHash: codeHash('reader@example.test', '123456'), codeExpiresAt: Date.now() - 1, codeAttempts: 0}));
  const result = mockRes();
  await verifyCode({method: 'POST', headers: {origin: process.env.APP_ORIGIN}, body: {requestId, code: '123456'}}, result);
  assert.equal(result.statusCode, 400);
  assert.equal(emailOutbox.length, 0);
  assert.equal(JSON.parse(get(`resume:request:${requestId}`)).status, 'pending');
});

test('verification is one-use, bounded, and only then sends one idempotent owner request', async () => {
  const requestId = 'request_id_123456789012345';
  const request = {status: 'pending', email: 'reader@example.test', name: 'Reader', subject: 'Role', message: 'Please review', codeHash: codeHash('reader@example.test', '123456'), codeExpiresAt: Date.now() + 900_000, codeAttempts: 0};
  const key = `resume:request:${requestId}`;
  set(key, JSON.stringify(request));
  const invoke = async (code) => {
    const result = mockRes();
    await verifyCode({method: 'POST', headers: {origin: process.env.APP_ORIGIN}, body: {requestId, code}}, result);
    return result;
  };
  assert.equal((await invoke('000000')).statusCode, 400);
  assert.equal(emailOutbox.length, 0);
  assert.equal((await invoke('123456')).statusCode, 200);
  assert.equal(JSON.parse(get(key)).status, 'notified');
  assert.equal(emailOutbox.length, 1);
  assert.equal(emailOutbox[0].payload.to, 'snguyen4work@gmail.com');
  assert.match(emailOutbox[0].payload.text, /mailbox/);
  assert.equal((await invoke('123456')).statusCode, 409);
  assert.equal(emailOutbox.length, 1);
});

test('five wrong codes invalidate the current code', async () => {
  const requestId = 'request_id_123456789012345';
  const key = `resume:request:${requestId}`;
  set(key, JSON.stringify({status: 'pending', email: 'reader@example.test', codeHash: codeHash('reader@example.test', '123456'), codeExpiresAt: Date.now() + 900_000, codeAttempts: 0}));
  for (let attempt = 0; attempt < 5; attempt++) {
    const result = mockRes();
    await verifyCode({method: 'POST', headers: {origin: process.env.APP_ORIGIN}, body: {requestId, code: '000000'}}, result);
    assert.equal(result.statusCode, 400);
  }
  assert.equal(JSON.parse(get(key)).codeHash, undefined);
  assert.equal(emailOutbox.length, 0);
});

test('verification code resend enforces a full 60-second cooldown', async () => {
  const requestId = 'request_id_123456789012345';
  const key = `resume:request:${requestId}`;
  const now = Date.now();
  set(key, JSON.stringify({status: 'pending', email: 'reader@example.test', name: 'Reader', codeHash: 'old-hash', codeExpiresAt: now + 900_000, codeAttempts: 0, lastCodeSentAt: now}));
  const originalNow = Date.now;
  const invoke = async () => {
    const result = mockRes();
    await resendCode({method: 'POST', headers: {origin: process.env.APP_ORIGIN}, body: {requestId}}, result);
    return result;
  };
  try {
    Date.now = () => now + 59_999;
    assert.equal((await invoke()).statusCode, 429);
    assert.equal(emailOutbox.length, 0);
    Date.now = () => now + 60_000;
    assert.equal((await invoke()).statusCode, 200);
    assert.equal(emailOutbox.length, 1);
    assert.equal(emailOutbox[0].payload.to, 'reader@example.test');
  } finally { Date.now = originalNow; }
});

test('resending a verification code shares the daily per-email send budget', async () => {
  const requestIds = [];
  for (let index = 0; index < 3; index++) {
    const result = mockRes();
    await createRequest({
      method: 'POST',
      headers: {origin: process.env.APP_ORIGIN},
      body: {name: 'Reader', email: 'reader@example.test', subject: 'Role', message: `Please review ${index}`},
    }, result);
    assert.equal(result.statusCode, 200);
    requestIds.push(result.json().requestId);
  }
  assert.equal(emailOutbox.length, 3);
  const key = `resume:request:${requestIds[0]}`;
  const record = JSON.parse(get(key));
  record.lastCodeSentAt = Date.now() - 60_001;
  set(key, JSON.stringify(record));

  const resend = mockRes();
  await resendCode({method: 'POST', headers: {origin: process.env.APP_ORIGIN}, body: {requestId: requestIds[0]}}, resend);
  assert.equal(resend.statusCode, 429);
  assert.equal(resend.json().error, 'rate_limited');
  assert.equal(emailOutbox.length, 3);
});

test('a stale owner-notification claim can be retried while an active claim stays locked', async () => {
  const requestId = 'request_id_123456789012345';
  const key = `resume:request:${requestId}`;
  const request = {status: 'notifying', notifyingAt: Date.now() - 120_001, email: 'reader@example.test', name: 'Reader', subject: 'Role', message: 'Please review'};
  set(key, JSON.stringify(request));
  const invoke = async () => {
    const result = mockRes();
    await notifyRequest({method: 'POST', headers: {origin: process.env.APP_ORIGIN}, body: {requestId}}, result);
    return result;
  };
  const recovered = await invoke();
  assert.equal(recovered.statusCode, 200);
  assert.equal(recovered.json().status, 'accepted');
  assert.equal(JSON.parse(get(key)).status, 'notified');
  assert.equal(emailOutbox.length, 1);

  const activeId = 'request_id_123456789012346';
  const activeKey = `resume:request:${activeId}`;
  set(activeKey, JSON.stringify({...request, notifyingAt: Date.now()}));
  const stillActive = mockRes();
  await notifyRequest({method: 'POST', headers: {origin: process.env.APP_ORIGIN}, body: {requestId: activeId}}, stillActive);
  assert.equal(stillActive.statusCode, 200);
  assert.equal(stillActive.json().status, 'processing');
  assert.equal(emailOutbox.length, 1);
});

test('notification retry feedback distinguishes accepted, processing, and failed delivery', () => {
  assert.equal(notificationFeedback('accepted').view, 'submitted');
  assert.match(notificationFeedback('accepted').notice, /accepted by the email service/);
  assert.equal(notificationFeedback('processing').view, 'delivery');
  assert.match(notificationFeedback('processing').notice, /still being processed/);
  assert.equal(notificationFeedback('failed').view, 'delivery');
  assert.match(notificationFeedback('failed').notice, /did not accept.*retry/i);
});

test('already-verified API errors route into notification recovery', () => {
  const error = makeApiError({error: 'already_verified', message: 'This email was already verified.'});
  assert.equal(error.code, 'already_verified');
  const recovery = verificationRecovery(error.code);
  assert.equal(recovery.view, 'delivery');
  assert.match(recovery.notice, /already verified/i);
  assert.equal(verificationRecovery(makeApiError({error: 'invalid_code'}).code), null);
});

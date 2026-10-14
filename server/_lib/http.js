import {createHash, createHmac, randomBytes, randomInt, timingSafeEqual} from 'node:crypto';

export const OWNER_EMAIL = 'snguyen4work@gmail.com';
export const PRICE_CENTS = 500;
export const ACCESS_SECONDS = 30 * 24 * 60 * 60;
export const FLOW_SECONDS = 90 * 24 * 60 * 60;
export const CODE_SECONDS = 15 * 60;

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function reply(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.end(JSON.stringify(body));
}

export function errorReply(res, error) {
  if (error instanceof ApiError) return reply(res, error.status, { error: error.code, message: error.message });
  console.error('Resume API request failed', error?.message || 'unknown error');
  return reply(res, 500, { error: 'server_error', message: 'Something went wrong. Please try again shortly.' });
}

export function requireMethod(req, res, method) {
  if (req.method !== method) {
    res.setHeader('Allow', method);
    throw new ApiError(405, 'method_not_allowed', `Use ${method} for this request.`);
  }
}

export function requireOrigin(req) {
  const origin = req.headers.origin;
  const expected = process.env.APP_ORIGIN || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
  if (!origin || origin !== expected) throw new ApiError(403, 'origin_rejected', 'This request could not be verified. Reload the page and try again.');
}

export function parseBody(req, maximum = 12_000) {
  if (req.body && typeof req.body === 'object') return req.body;
  const raw = req.body;
  if (typeof raw === 'string') {
    if (Buffer.byteLength(raw) > maximum) throw new ApiError(413, 'too_large', 'This request is too large.');
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch { /* Convert malformed input to the same actionable response. */ }
    throw new ApiError(400, 'invalid_json', 'Enter the requested information and try again.');
  }
  if (raw === null) throw new ApiError(400, 'invalid_json', 'Enter the requested information and try again.');
  return {};
}

export function requireKeys(...keys) {
  for (const key of keys) if (!process.env[key]) throw new ApiError(503, 'not_configured', `This feature is not ready yet (${key}).`);
}

export function sha(value) { return createHash('sha256').update(String(value)).digest('hex'); }
export function codeHash(email, code) {
  return createHmac('sha256', process.env.VERIFY_CODE_SECRET).update(`${email.toLowerCase()}|${code}`).digest('hex');
}
export function randomCode() { return String(randomInt(0, 1_000_000)).padStart(6, '0'); }
export function randomId(bytes = 18) { return randomBytes(bytes).toString('base64url'); }

export function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function cookies(req) {
  const result = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index < 1) continue;
    result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return result;
}

export function cookieHeader(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim().slice(0, 80);
}

export async function redis(command) {
  requireKeys('UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN');
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok || result.error) throw new Error('Redis request failed');
  return result.result;
}

const THROTTLE_SCRIPT = `local count=redis.call('INCR',KEYS[1]); if count==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; return count`;
export async function throttle(req, scope, maximum, seconds) {
  return throttleIdentity(clientIp(req), scope, maximum, seconds);
}

export async function throttleIdentity(identity, scope, maximum, seconds) {
  const count = Number(await redis(['EVAL', THROTTLE_SCRIPT, '1', `resume:rate:${scope}:${sha(identity)}`, String(seconds)]));
  if (count > maximum) throw new ApiError(429, 'rate_limited', 'Too many attempts. Wait a little and try again.');
}

export function validateEmail(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendEmail({ to, subject, text, idempotencyKey }) {
  requireKeys('RESEND_API_KEY', 'EMAIL_FROM');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(502, 'email_provider_failed', 'Email could not be accepted for delivery. You can retry shortly.');
  return result.id || 'accepted';
}

export async function stripeRequest(path, body) {
  requireKeys('STRIPE_SECRET_KEY');
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body,
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(502, 'payment_provider_failed', 'Checkout is temporarily unavailable. Please try again.');
  return result;
}

export function stripeForm(entries) {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) form.set(key, String(value));
  return form.toString();
}

export function verifyStripeSignature(rawBody, header, secret, now = Math.floor(Date.now() / 1000)) {
  if (!header || !secret) return false;
  const parts = header.split(',').map((item) => item.trim().split('='));
  const timestamp = Number(parts.find(([key]) => key === 't')?.[1]);
  const signatures = parts.filter(([key, value]) => key === 'v1' && /^[a-f0-9]{64}$/i.test(value)).map(([, value]) => value);
  if (!timestamp || Math.abs(now - timestamp) > 300 || signatures.length === 0) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  return signatures.some((candidate) => safeEqual(candidate, expected));
}

export async function validatePaidSession(session, flowHash) {
  if (!session || session.mode !== 'payment' || session.payment_status !== 'paid' || session.currency !== 'usd' || session.amount_total !== PRICE_CENTS || session.metadata?.product !== 'resume-v1' || session.metadata?.flow_hash !== flowHash) return false;
  const lines = await stripeRequest(`checkout/sessions/${encodeURIComponent(session.id)}/line_items?limit=2`);
  return lines.data?.length === 1 && lines.data[0].quantity === 1 && lines.data[0].price?.unit_amount === PRICE_CENTS && lines.data[0].price?.currency === 'usd';
}

export async function successfulPaymentTimestamp(session) {
  const paymentIntentId = typeof session?.payment_intent === 'string'
    ? session.payment_intent
    : session?.payment_intent?.id;
  if (!paymentIntentId || !/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) return null;
  const intent = await stripeRequest(`payment_intents/${encodeURIComponent(paymentIntentId)}`);
  if (intent.id !== paymentIntentId || intent.status !== 'succeeded' || intent.amount !== PRICE_CENTS || intent.currency !== 'usd') return null;
  const chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id;
  if (!chargeId || !/^ch_[A-Za-z0-9]+$/.test(chargeId)) return null;
  const charge = await stripeRequest(`charges/${encodeURIComponent(chargeId)}`);
  if (charge.id !== chargeId || charge.payment_intent !== paymentIntentId || charge.paid !== true || charge.captured !== true || charge.amount !== PRICE_CENTS || charge.amount_captured !== PRICE_CENTS || charge.currency !== 'usd' || !Number.isInteger(charge.created)) return null;
  return charge.created * 1000;
}

export function accessRemainingSeconds(paidAt, now = Date.now()) {
  return Math.max(0, Math.floor((Number(paidAt || 0) + ACCESS_SECONDS * 1000 - now) / 1000));
}

export async function rawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

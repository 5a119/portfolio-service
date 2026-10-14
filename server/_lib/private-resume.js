import {createHmac, randomBytes} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ApiError, clientIp, safeEqual} from './http.js';

export async function readPrivateResume() {
  let pdf;
  try { pdf = await readFile(join(process.cwd(), 'private', 'resume.pdf')); }
  catch { throw new ApiError(503, 'resume_unavailable', 'The résumé file is missing from this deployment. Please contact the site owner.'); }
  if (pdf.length < 100 || pdf.length > 2_000_000 || pdf.subarray(0, 5).toString() !== '%PDF-') {
    throw new ApiError(503, 'resume_unavailable', 'The résumé file is unavailable. Please contact the site owner.');
  }
  return pdf;
}

export async function prepareResumeFiles() {
  await readPrivateResume();
  const path = join(process.cwd(), 'private', 'access-secret.key');
  try { await writeFile(path, randomBytes(32).toString('hex'), {flag: 'wx', mode: 0o600}); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  await signingKey();
}

async function signingKey() {
  const key = process.env.RESUME_ACCESS_SECRET || await readFile(join(process.cwd(), 'private', 'access-secret.key'), 'utf8');
  if (key.trim().length < 32) throw new ApiError(503, 'not_configured', 'Résumé access is unavailable. Rebuild the deployment and try again.');
  return key.trim();
}

export async function signResumeAccess(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', await signingKey()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export async function verifyResumeAccess(token) {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const [body, signature, extra] = token.split('.');
  if (!body || !signature || extra !== undefined) return null;
  const expected = createHmac('sha256', await signingKey()).update(body).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.purpose !== 'email-resume' || !Number.isFinite(payload.readyAt) || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch { return null; }
}

const limits = new Map();
// Best-effort per-instance limiting; authorization never depends on memory.
export async function limitResumeRequests(req, scope, maximum, seconds) {
  const now = Date.now();
  for (const [id, limit] of limits) if (limit.expiresAt <= now) limits.delete(id);
  const key = `${scope}:${clientIp(req)}`;
  const limit = limits.get(key) || {count: 0, expiresAt: now + seconds * 1000};
  limit.count += 1;
  limits.set(key, limit);
  if (limit.count > maximum) throw new ApiError(429, 'rate_limited', 'Too many attempts. Wait a little and try again.');
}

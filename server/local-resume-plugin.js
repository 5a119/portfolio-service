import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createEmailAccessHandler} from './_lib/email-access.js';
import {ApiError, clientIp} from './_lib/http.js';

// Only the development server reads the ignored local PDF.
export function localResumePlugin() {
  const records = new Map();
  const limits = new Map();
  const pdfPath = fileURLToPath(new URL('../private/resume.pdf', import.meta.url));
  const handler = createEmailAccessHandler({
    async store([operation, key, value, , ttl]) {
      if (operation === 'SET') {
        const now = Date.now();
        for (const [id, record] of records) if (record.expiresAt <= now) records.delete(id);
        records.set(key, {value, expiresAt: now + Number(ttl) * 1000});
        return 'OK';
      }
      if (key === 'resume:private:pdf:v1') {
        try { return (await readFile(pdfPath)).toString('base64'); }
        catch { return null; }
      }
      const record = records.get(key);
      return record && record.expiresAt > Date.now() ? record.value : null;
    },
    checkOrigin(req) {
      if (req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`) {
        throw new ApiError(403, 'origin_rejected', 'Reload the portfolio and try again.');
      }
    },
    async rateLimit(req, scope, maximum, seconds) {
      const now = Date.now();
      for (const [id, limit] of limits) if (limit.expiresAt <= now) limits.delete(id);
      const key = `${scope}:${clientIp(req)}`;
      const limit = limits.get(key) || {count: 0, expiresAt: now + seconds * 1000};
      limit.count += 1;
      limits.set(key, limit);
      if (limit.count > maximum) throw new ApiError(429, 'rate_limited', 'Too many attempts. Wait a little and try again.');
    },
  });
  return {
    name: 'local-private-resume',
    apply: 'serve',
    config(config) {
      return {server: {fs: {deny: [...(config.server?.fs?.deny || ['.env', '.env.*', '*.{crt,pem}', '**/.git/**']), '**/private/**']}}};
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url, 'http://localhost').pathname;
        if (pathname !== '/api/resume/email-access') return next();
        void handler(req, res);
      });
    },
  };
}

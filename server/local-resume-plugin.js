import {createEmailAccessHandler} from './_lib/email-access.js';
import {ApiError} from './_lib/http.js';
import {prepareResumeFiles} from './_lib/private-resume.js';

export function localResumePlugin() {
  const handler = createEmailAccessHandler({
    checkOrigin(req) {
      if (req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`) {
        throw new ApiError(403, 'origin_rejected', 'Reload the portfolio and try again.');
      }
    },
  });
  return {
    name: 'local-private-resume',
    apply: 'serve',
    config(config) {
      return {server: {fs: {deny: [...(config.server?.fs?.deny || ['.env', '.env.*', '*.{crt,pem}', '**/.git/**']), '**/private/**']}}};
    },
    async configureServer(server) {
      await prepareResumeFiles();
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url, 'http://localhost').pathname;
        if (pathname !== '/api/resume/email-access') return next();
        void handler(req, res);
      });
    },
  };
}

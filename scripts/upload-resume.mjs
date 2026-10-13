import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const file = resolve('private/resume.pdf');
try {
  const localEnv = await readFile('.env', 'utf8');
  for (const line of localEnv.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
  }
} catch { /* Environment may be provided by the shell instead. */ }
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
  console.error('Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN before uploading.');
  process.exit(1);
}
const pdf = await readFile(file);
if (pdf.subarray(0, 5).toString() !== '%PDF-') {
  console.error('private/resume.pdf is missing or is not a PDF.');
  process.exit(1);
}
if (pdf.length > 2_000_000) {
  console.error('The private PDF must be 2 MB or smaller for this Redis upload flow.');
  process.exit(1);
}
const response = await fetch(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(['SET', 'resume:private:pdf:v1', pdf.toString('base64')]),
});
const result = await response.json().catch(() => ({}));
if (!response.ok || result.error || result.result !== 'OK') {
  console.error('Redis did not accept the private résumé upload. Check the Upstash URL and token.');
  process.exit(1);
}
console.log(`Private résumé uploaded (${pdf.length} bytes).`);

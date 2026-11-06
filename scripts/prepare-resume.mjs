import {readFile} from 'node:fs/promises';

const path = new URL('../public/resume.pdf', import.meta.url);
const pdf = await readFile(path).catch(() => {
  throw new Error('Add your résumé PDF at public/resume.pdf before starting or building the portfolio.');
});

if (pdf.length < 100 || pdf.length > 2_000_000 || pdf.subarray(0, 5).toString() !== '%PDF-') {
  throw new Error('public/resume.pdf must be a valid PDF under 2 MB.');
}

console.log('Public résumé PDF is ready.');

import test from 'node:test';
import assert from 'node:assert/strict';
import {emailDraft} from '../src/components/resume-demo.js';

test('email draft preserves user details and safely encodes reserved characters', () => {
  const draft = emailDraft({name: 'Sang & Team', email: 'reader+jobs@example.com', subject: 'Role? Java & AWS #1', message: 'Hello Sang,\nLet’s discuss 100% remote work & APIs.'}, 'snguyen4work@gmail.com');
  const url = new URL(draft);
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, 'snguyen4work@gmail.com');
  assert.equal(url.searchParams.get('subject'), 'Role? Java & AWS #1');
  assert.equal(url.searchParams.get('body'), 'Hello Sang,\nLet’s discuss 100% remote work & APIs.\n\nName: Sang & Team\nEmail: reader+jobs@example.com');
  assert.equal([...url.searchParams].length, 2);
});

/* Dev-only: check SMTP credentials against the relay without sending mail.
   Run:  bun run scripts/test-smtp.ts   (bun auto-loads .env) */
import { verifyTransport } from '../src/lib/email';
import { env } from '../src/lib/env';

const pass = (env.SMTP_PASS ?? '').replace(/\s+/g, '');
console.log('host:', env.SMTP_HOST, '| port:', env.SMTP_PORT, '| secure:', env.SMTP_SECURE ?? '(auto)');
console.log('user:', env.SMTP_USER);
console.log('app-password length (spaces stripped):', pass.length, pass.length === 16 ? '✓ 16' : '⚠ expected 16');

try {
  await verifyTransport();
  console.log('\n✅ SMTP auth OK — credentials accepted. Emails will send.');
} catch (e) {
  console.error('\n❌ SMTP auth failed:', (e as Error).message);
}

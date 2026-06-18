/* Dev-only: render the contact emails to /tmp HTML for visual inspection.
   Run:  bun run scripts/preview-emails.ts   (safe to delete this file) */
import { writeFileSync } from 'node:fs';
import { notificationEmail, autoReplyEmail, type EmailData } from '../src/lib/emails';

const data: EmailData = {
  id: 42,
  name: 'Aisha Khan',
  email: 'aisha@northstar-ai.com',
  company: 'NorthStar AI',
  need: 'GPU superclusters',
  message:
    "We're scaling to ~2,000 H100s across Q3–Q4 and need liquid-cooling-ready capacity in Mumbai or Chennai.\n\nCan we set up a call next week?",
  source: 'website-contact-modal',
  submittedAt: '18 Jun 2026, 16:30 IST',
};

// XSS / escaping check
const evil: EmailData = {
  ...data,
  name: '<script>alert(1)</script> O\'Brien',
  company: 'A & B "Corp"',
  message: 'Line1 <img src=x onerror=alert(1)> & <b>bold</b>\nLine2',
};

writeFileSync('/tmp/email-notification.html', notificationEmail(data).html);
writeFileSync('/tmp/email-autoreply.html', autoReplyEmail(data).html);
writeFileSync('/tmp/email-notification-xss.html', notificationEmail(evil).html);

console.log('NOTIFY subject:', notificationEmail(data).subject);
console.log('REPLY  subject:', autoReplyEmail(data).subject);
console.log('XSS escaped in html?', !notificationEmail(evil).html.includes('<script>alert(1)'));
console.log('XSS img escaped?', !notificationEmail(evil).html.includes('<img src=x'));
console.log('\n----- NOTIFICATION (plain text) -----\n' + notificationEmail(data).text);
console.log('\n----- AUTO-REPLY (plain text) -----\n' + autoReplyEmail(data).text);

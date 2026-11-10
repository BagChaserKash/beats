// SERVER ONLY. Sends email through Resend's API.
export type EmailAttachment = { filename: string; content: string }; // content = base64

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set.');
  const from = (process.env.EMAIL_FROM ?? 'BAGCHASERKASH Beats <onboarding@resend.dev>').trim();
  // Replies go to a real inbox you read.
  const replyTo = (process.env.EMAIL_REPLY_TO ?? process.env.ADMIN_NOTIFY_EMAIL ?? '').trim();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key.trim()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(input.attachments?.length ? { attachments: input.attachments } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Email failed (${res.status}): ${await res.text()}`);
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

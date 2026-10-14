// Sends one email through Resend (resend.com). Settings live in Vercel, never in the code:
//   RESEND_API_KEY  the Resend key ("Sending access" for clearmark.bz)
//   EMAIL_FROM      who it's from, e.g. "Andrew Kreick <andrew@clearmark.bz>" (a verified domain)
//   EMAIL_REPLY_TO  optional: where replies go (defaults to the From address)
// Emails are plain text, like a personal note.

export const emailReady = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export class EmailError extends Error {}

export async function sendEmail(to: string, subject: string, text: string) {
  if (!emailReady()) throw new EmailError("Email sending isn't connected yet");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text, reply_to: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM }),
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok || !body.id) throw new EmailError(body.message || `Resend error ${res.status}`);
  return body.id;
}

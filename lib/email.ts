import nodemailer from "nodemailer";

interface SellerEmail {
  subject: string;
  html: string;
  replyTo?: string;
}

function requireEmailEnv() {
  const user = process.env.PONCHOS_EMAIL_USER;
  const pass = process.env.PONCHOS_EMAIL_PASSWORD;
  const sellerEmail = process.env.PONCHOS_SELLER_EMAIL;

  if (!user || !pass || !sellerEmail) {
    throw new Error("Missing email environment variables");
  }

  return { user, pass, sellerEmail };
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendSellerEmail({ subject, html, replyTo }: SellerEmail) {
  const { user, pass, sellerEmail } = requireEmailEnv();
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: user,
    to: sellerEmail,
    replyTo,
    subject,
    html,
  });
}


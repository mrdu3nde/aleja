import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL || "Aluh Studio <noreply@aluhstudio.com>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ingeniero.apinzon@gmail.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// ─── Brand styles ───
const brand = {
  bg: "#FEFCFA",
  card: "#ffffff",
  cafe: "#6B4E3D",
  champagne: "#F5E6D3",
  text: "#3A2E26",
  muted: "#8A7B6E",
  border: "#e5ddd4",
};

function layout(title: string, body: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${brand.bg};font-family:'Helvetica Neue',Arial,sans-serif;color:${brand.text};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${brand.bg};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="padding:24px 32px;text-align:center;background:${brand.cafe};border-radius:16px 16px 0 0;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:1px;">Aluh</h1>
          <p style="margin:4px 0 0;color:${brand.champagne};font-size:12px;letter-spacing:2px;text-transform:uppercase;">Beauty Studio</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;background:${brand.card};border:1px solid ${brand.border};border-top:none;">
          <h2 style="margin:0 0 16px;font-size:20px;color:${brand.cafe};">${title}</h2>
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;text-align:center;background:${brand.champagne};border-radius:0 0 16px 16px;">
          <p style="margin:0;font-size:12px;color:${brand.muted};">Aluh Beauty Studio &middot; <a href="${SITE_URL}" style="color:${brand.cafe};text-decoration:none;">aluhstudio.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;color:${brand.muted};font-size:13px;width:120px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:${brand.text};">${value}</td>
  </tr>`;
}

function dataTable(rows: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${rows}</table>`;
}

function button(text: string, href: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td>
    <a href="${href}" style="display:inline-block;padding:12px 28px;background:${brand.cafe};color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">${text}</a>
  </td></tr></table>`;
}

// ─── Email functions ───

export async function sendBookingConfirmation(data: {
  clientName: string;
  clientEmail: string;
  service: string;
  preferredDate?: string | null;
}) {
  const date = data.preferredDate
    ? new Date(data.preferredDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "To be confirmed";

  await resend.emails.send({
    from: FROM,
    to: data.clientEmail,
    subject: "Booking Received — Aluh Studio",
    html: layout("We received your booking!", `
      <p style="color:${brand.muted};line-height:1.6;">Hi <strong>${data.clientName}</strong>, thank you for choosing Aluh! We've received your booking request and will confirm it shortly.</p>
      ${dataTable(
        row("Service", data.service) +
        row("Preferred Date", date)
      )}
      <p style="color:${brand.muted};font-size:13px;line-height:1.6;">We'll reach out to confirm your appointment. If you have any questions, feel free to reply to this email.</p>
    `),
  });
}

export async function sendBookingAdminNotification(data: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: string;
  preferredDate?: string | null;
  message?: string | null;
}) {
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Booking — ${data.clientName}`,
    html: layout("New Booking Request", `
      <p style="color:${brand.muted};line-height:1.6;">A new booking has been submitted from the website.</p>
      ${dataTable(
        row("Name", data.clientName) +
        row("Email", data.clientEmail) +
        row("Phone", data.clientPhone) +
        row("Service", data.service) +
        row("Date", data.preferredDate || "Not specified") +
        row("Message", data.message || "—")
      )}
      ${button("View in Dashboard", `${SITE_URL}/admin/appointments`)}
    `),
  });
}

export async function sendLeadWelcome(data: {
  name: string;
  email: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: "Thanks for reaching out — Aluh Studio",
    html: layout("Thanks for contacting us!", `
      <p style="color:${brand.muted};line-height:1.6;">Hi <strong>${data.name}</strong>, we appreciate you reaching out to Aluh Beauty Studio!</p>
      <p style="color:${brand.muted};line-height:1.6;">We've received your message and will get back to you as soon as possible. In the meantime, feel free to browse our services.</p>
      ${button("View Our Services", `${SITE_URL}/en/services`)}
    `),
  });
}

export async function sendLeadAdminNotification(data: {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Lead — ${data.name}`,
    html: layout("New Contact Lead", `
      <p style="color:${brand.muted};line-height:1.6;">Someone contacted you through the website.</p>
      ${dataTable(
        row("Name", data.name) +
        row("Email", data.email) +
        row("Phone", data.phone || "—") +
        row("Message", data.message)
      )}
      ${button("View in Dashboard", `${SITE_URL}/admin/leads`)}
    `),
  });
}

export async function sendAppointmentStatusUpdate(data: {
  clientName: string;
  clientEmail: string;
  service: string;
  preferredDate?: string | null;
  status: string;
}) {
  const subjects: Record<string, string> = {
    confirmed: "Your appointment is confirmed!",
    cancelled: "Appointment cancelled",
    completed: "Thanks for visiting us!",
  };

  const messages: Record<string, string> = {
    confirmed: `Great news, <strong>${data.clientName}</strong>! Your appointment at Aluh has been confirmed. We look forward to seeing you!`,
    cancelled: `Hi <strong>${data.clientName}</strong>, unfortunately your appointment has been cancelled. Please feel free to book a new one at your convenience.`,
    completed: `Hi <strong>${data.clientName}</strong>, thank you for visiting Aluh Beauty Studio! We hope you loved your experience. We'd love to see you again soon!`,
  };

  const subject = subjects[data.status];
  const message = messages[data.status];
  if (!subject || !message) return;

  const date = data.preferredDate
    ? new Date(data.preferredDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "—";

  const cta = data.status === "completed"
    ? button("Book Again", `${SITE_URL}/en/book`)
    : data.status === "cancelled"
      ? button("Book a New Appointment", `${SITE_URL}/en/book`)
      : "";

  await resend.emails.send({
    from: FROM,
    to: data.clientEmail,
    subject: `${subject} — Aluh Studio`,
    html: layout(subject, `
      <p style="color:${brand.muted};line-height:1.6;">${message}</p>
      ${dataTable(
        row("Service", data.service) +
        row("Date", date) +
        row("Status", `<strong style="color:${brand.cafe};text-transform:capitalize;">${data.status}</strong>`)
      )}
      ${cta}
    `),
  });
}

export async function sendClientWelcome(data: {
  name: string;
  email: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: "Welcome to Aluh Studio!",
    html: layout("Welcome to the Aluh family!", `
      <p style="color:${brand.muted};line-height:1.6;">Hi <strong>${data.name}</strong>, you're now part of the Aluh Beauty Studio family! We're excited to have you with us.</p>
      <p style="color:${brand.muted};line-height:1.6;">You can book your next appointment anytime through our website.</p>
      ${button("Book an Appointment", `${SITE_URL}/en/book`)}
    `),
  });
}

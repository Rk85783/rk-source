import fs from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import { config } from "../config/index.js";

const OUTBOX = path.join(process.cwd(), ".devlogs", "outbox");

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const layout = (title, bodyHtml) => `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#0f172a">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:32px">
      <h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>
      ${bodyHtml}
      <p style="margin:32px 0 0;font-size:12px;color:#64748b">
        Rk-source. If you were not expecting this email you can ignore it.
      </p>
    </div>
  </body>
</html>`;

const row = (label, value) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;width:110px">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-family:ui-monospace,monospace;font-size:14px">${escapeHtml(value)}</td>
  </tr>`;

const button = (href, text) => `
  <p style="margin:28px 0">
    <a href="${escapeHtml(href)}"
       style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600">
      ${escapeHtml(text)}
    </a>
  </p>`;

const paragraph = (text) =>
  `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155">${text}</p>`;

export const buildDriverInvitation = (data) => {
  const { carrierName, email, password, activateUrl } = data;

  const subject = `You have been invited to Rk-source by ${carrierName}`;

  const text = [
    `${carrierName} invited you to join Rk-source as a driver.`,
    "",
    `Email: ${email}`,
    `Password: ${password}`,
    "",
    "You can sign in with those details, or set your own password here:",
    activateUrl,
  ].join("\n");

  const body = [
    paragraph(
      `<strong>${escapeHtml(carrierName)}</strong> invited you to join Rk-source as a driver.`,
    ),
    `<table style="width:100%;border-collapse:collapse;margin-top:20px">${row("Email", email)}${row("Password", password)}</table>`,
    button(activateUrl, "Set my own password"),
    paragraph(
      "Prefer the password above? Just sign in with your email and password.",
    ),
  ].join("");

  return {
    subject,
    text,
    html: layout("You have been invited to Rk-source", body),
  };
};

/**
 * Sends through SMTP when it is configured, and otherwise writes the message to
 * .devlogs/outbox. The fallback exists so the flow is testable without
 * credentials; it is not a substitute for real delivery in production.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  if (config.smtpHost) {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: config.smtpUser
        ? { user: config.smtpUser, pass: config.smtpPass }
        : undefined,
    });

    const info = await transporter.sendMail({
      from: config.mailFrom,
      to,
      subject,
      text,
      html,
    });

    console.info(`mail sent to ${to}: ${info.messageId}`);
    return { delivered: true, transport: "smtp" };
  }

  await fs.mkdir(OUTBOX, { recursive: true });
  const stamp = `${Date.now()}-${to.replace(/[^a-z0-9]/gi, "_")}`;
  const file = path.join(OUTBOX, `${stamp}.html`);
  await fs.writeFile(
    file,
    `<pre style="white-space:pre-wrap">To: ${to}\nSubject: ${subject}\n</pre>\n${html}`,
    "utf8",
  );

  console.warn(
    `SMTP is not configured, so the email to ${to} was written to ${file} instead of sent.`,
  );
  return { delivered: false, transport: "outbox", file };
};

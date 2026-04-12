import nodemailer from "nodemailer";

import { env, requireEnv } from "@/lib/env";

type AdminEmailPayload = {
  requestId: string;
  steamProfileUrl: string;
  steamId64: string | null;
  applicantEmail: string;
  reason: string;
  adminUrl: string;
};

type ApplicantDecisionEmailPayload = {
  requestId: string;
  applicantEmail: string | null;
  outcome: "approved" | "rejected";
  applicantMessage?: string | null;
};

function stripCrLf(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeAddress(value: string) {
  return stripCrLf(value);
}

function sanitizeTextBlock(value: string) {
  return value.replace(/\r/g, "");
}

function buildEhloName() {
  const source = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "localhost";

  try {
    return stripCrLf(new URL(source).hostname || "localhost");
  } catch {
    return "localhost";
  }
}

function createTransport() {
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    name: buildEhloName(),
    disableFileAccess: true,
    disableUrlAccess: true,
    auth: env.smtp.user
      ? {
          user: stripCrLf(env.smtp.user),
          pass: requireEnv("SMTP_PASS", env.smtp.pass),
        }
      : undefined,
  });
}

export async function sendNewWhitelistRequestEmail(payload: AdminEmailPayload) {
  if (!env.smtp.host || !env.smtp.from || env.smtp.recipients.length === 0) {
    return {
      state: "SKIPPED" as const,
      error: "SMTP is not fully configured.",
    };
  }

  const transport = createTransport();

  try {
    const applicantEmail = sanitizeAddress(payload.applicantEmail);
    const steamProfileUrl = stripCrLf(payload.steamProfileUrl);
    const subject = stripCrLf(`New Rust whitelist request: ${payload.requestId}`);
    const reasonText = sanitizeTextBlock(payload.reason);
    const adminUrl = stripCrLf(payload.adminUrl);

    await transport.sendMail({
      from: sanitizeAddress(env.smtp.from),
      to: env.smtp.recipients.map(sanitizeAddress),
      subject,
      text: [
        "A new whitelist request has been submitted.",
        "",
        `Request ID: ${payload.requestId}`,
        `Applicant email: ${applicantEmail}`,
        `Steam profile: ${steamProfileUrl}`,
        `Steam ID64: ${payload.steamId64 ?? "Not resolved yet"}`,
        "",
        "Reason:",
        reasonText,
        "",
        `Open in admin panel: ${adminUrl}`,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; background: #13110e; color: #f5eee5; padding: 24px;">
          <h1 style="margin: 0 0 16px; font-size: 24px;">New Rust whitelist request</h1>
          <p style="margin: 0 0 8px;"><strong>Request ID:</strong> ${escapeHtml(payload.requestId)}</p>
          <p style="margin: 0 0 8px;"><strong>Applicant email:</strong> ${escapeHtml(applicantEmail)}</p>
          <p style="margin: 0 0 8px;"><strong>Steam profile:</strong> <a href="${escapeHtml(steamProfileUrl)}" style="color: #ff8a3d;">${escapeHtml(steamProfileUrl)}</a></p>
          <p style="margin: 0 0 16px;"><strong>Steam ID64:</strong> ${escapeHtml(payload.steamId64 ?? "Not resolved yet")}</p>
          <p style="margin: 0 0 8px;"><strong>Reason:</strong></p>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; white-space: pre-wrap;">${escapeHtml(reasonText)}</div>
          <p style="margin: 16px 0 0;"><a href="${escapeHtml(adminUrl)}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #ff8a3d; color: #13110e; text-decoration: none; font-weight: 700;">Open request</a></p>
        </div>
      `,
    });

    return {
      state: "SENT" as const,
      error: null,
    };
  } catch (error) {
    return {
      state: "FAILED" as const,
      error: error instanceof Error ? error.message : "Failed to send email notification.",
    };
  }
}

export async function sendWhitelistDecisionEmail(payload: ApplicantDecisionEmailPayload) {
  if (!payload.applicantEmail) {
    return {
      state: "SKIPPED" as const,
      error: "Applicant email is not available for this request.",
    };
  }

  if (!env.smtp.host || !env.smtp.from) {
    return {
      state: "SKIPPED" as const,
      error: "SMTP is not fully configured.",
    };
  }

  const transport = createTransport();
  const outcomeLabel = payload.outcome === "approved" ? "Approved" : "Rejected";
  const introLine =
    payload.outcome === "approved"
      ? "Your Rust whitelist request has been approved."
      : "Your Rust whitelist request has been rejected.";

  try {
    const applicantEmail = sanitizeAddress(payload.applicantEmail);
    const subject = stripCrLf(`Rust whitelist request ${outcomeLabel}`);
    const applicantMessage = payload.applicantMessage
      ? sanitizeTextBlock(payload.applicantMessage)
      : null;

    await transport.sendMail({
      from: sanitizeAddress(env.smtp.from),
      to: applicantEmail,
      subject,
      text: [
        introLine,
        "",
        `Request ID: ${payload.requestId}`,
        applicantMessage ? "" : null,
        applicantMessage ? "Message from the admin team:" : null,
        applicantMessage,
      ]
        .filter(Boolean)
        .join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; background: #13110e; color: #f5eee5; padding: 24px;">
          <h1 style="margin: 0 0 16px; font-size: 24px;">Rust whitelist request ${escapeHtml(outcomeLabel)}</h1>
          <p style="margin: 0 0 8px;">${escapeHtml(introLine)}</p>
          <p style="margin: 0 0 16px;"><strong>Request ID:</strong> ${escapeHtml(payload.requestId)}</p>
          ${
            applicantMessage
              ? `<p style="margin: 0 0 8px;"><strong>Message from the admin team:</strong></p>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; white-space: pre-wrap;">${escapeHtml(applicantMessage)}</div>`
              : ""
          }
        </div>
      `,
    });

    return {
      state: "SENT" as const,
      error: null,
    };
  } catch (error) {
    return {
      state: "FAILED" as const,
      error: error instanceof Error ? error.message : "Failed to send applicant decision email.",
    };
  }
}

const splitList = (value: string | undefined) =>
  value
    ?.split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean) ?? [];

export const env = {
  appUrl: process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  adminEmails: splitList(process.env.ADMIN_ALLOWLIST),
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
    recipients: splitList(process.env.ADMIN_NOTIFICATION_EMAILS ?? process.env.ADMIN_ALLOWLIST),
  },
  steamApiKey: process.env.STEAM_API_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "missing-google-client-id",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "missing-google-client-secret",
  rcon: {
    host: process.env.RCON_HOST,
    port: Number(process.env.RCON_PORT ?? 28016),
    password: process.env.RCON_PASSWORD,
    timeout: Number(process.env.RCON_TIMEOUT_MS ?? 10000),
    whitelistCommandTemplate:
      process.env.RCON_WHITELIST_COMMAND_TEMPLATE ?? "adduser {steamId} whitelist",
  },
};

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return env.adminEmails.includes(email.trim().toLowerCase());
}

export function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

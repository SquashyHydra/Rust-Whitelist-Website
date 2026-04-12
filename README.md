## Rust Wasteland Whitelist

Next.js 16 + TypeScript + Turbopack implementation for a Rust game server whitelist website. The app includes a public whitelist request flow, applicant decision emails, an admin-only moderation panel behind Google OAuth, PostgreSQL persistence via Prisma, SMTP notifications, Steam profile resolution, and a secure RCON approval path.

## Stack

- Next.js App Router with TypeScript
- Turbopack for local development
- Prisma with PostgreSQL
- NextAuth with Google OAuth and admin email allowlist
- Nodemailer for SMTP delivery
- Steam Web API integration for vanity URL and profile resolution
- RCON dispatch for server-side whitelist approval

## Required environment

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL`
- `APP_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET`
- `ADMIN_ALLOWLIST`
- `ADMIN_NOTIFICATION_EMAILS`
- `STEAM_API_KEY`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `RCON_HOST`, `RCON_PORT`, `RCON_PASSWORD`, `RCON_TIMEOUT_MS`, `RCON_WHITELIST_COMMAND_TEMPLATE`

## Create the database

Create a PostgreSQL database that matches the name in `DATABASE_URL`.

Example with a dedicated local PostgreSQL user:

```bash
psql -U postgres -h localhost
```

Then run:

```sql
CREATE USER rust_user WITH PASSWORD 'replace-with-a-strong-password';
CREATE DATABASE rust_whitelist;
GRANT ALL PRIVILEGES ON DATABASE rust_whitelist TO rust_user;
```

To make sure that user can use the `public` schema inside the database, connect to the new database and grant schema access:

```bash
psql -U postgres -h localhost -d rust_whitelist
```

```sql
GRANT ALL ON SCHEMA public TO rust_user;
ALTER SCHEMA public OWNER TO rust_user;
```

After that, set `DATABASE_URL` in `.env` to match the new user:

```text
DATABASE_URL="postgresql://rust_user:replace-with-a-strong-password@localhost:5432/rust_whitelist"
```

If your PostgreSQL host, port, username, password, or database name is different, change the connection string accordingly.

After the database exists, apply the schema:

```bash
npm run prisma:generate
npm run db:push
```

## Clear the database

To wipe the database and recreate it from the current Prisma schema, run:

```bash
npx prisma db push --force-reset
```

This deletes all existing data.

If you want the usual follow-up steps afterward:

```bash
npm run prisma:generate
npx prisma db push --force-reset
npm run build
```

## Create the OAuth 2.0 Client ID

This project uses Google OAuth for admin sign-in.

1. Open the Google Cloud Console.
2. Create or select a project.
3. Go to `APIs & Services` -> `OAuth consent screen` and configure the app.
4. Go to `APIs & Services` -> `Credentials`.
5. Click `Create Credentials` -> `OAuth client ID`.
6. Choose `Web application`.
7. Add your authorized origins.
Local development example:

```text
http://localhost:3000
```

8. Add your authorized redirect URIs.
Local development example:

```text
http://localhost:3000/api/auth/callback/google
```

9. Copy the generated values into `.env`:

```text
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

For production, also add your live domain and live callback URL.

## Local setup

```bash
npm install
npm run prisma:generate
npm run db:push
npm run dev
```

Open `http://localhost:3000`.

## Build and run in production

Make sure your production `.env` is configured first, especially:

- `APP_URL` set to your live domain
- `DATABASE_URL` pointing to your production PostgreSQL database
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET`
- SMTP settings
- RCON settings

Before starting the app, make sure the production database schema is applied:

```bash
npm install
npm run prisma:generate
npm run db:push
```

Then build and start the production server:

```bash
npm run build
npm run start
```

By default, Next.js will serve the app on port `3000`.

If you are running behind a reverse proxy or Cloudflare Tunnel, point that service at your running Next.js server.

For Google OAuth in production, remember to add your live site values in Google Cloud:

```text
Authorized origin: https://your-domain.example
Authorized redirect URI: https://your-domain.example/api/auth/callback/google
```

## Routes

- `/` landing page
- `/request` public whitelist request form
- `/sign-in` admin login page
- `/admin` admin dashboard
- `/admin/requests/[id]` admin-only request detail route for internal sharing

## Approval flow

1. A player submits an email address, a Steam profile URL, and a reason for joining.
2. The server normalizes the profile URL, resolves SteamID64, stores the request, and emails the admins.
3. Admins review the request from the dashboard or direct request route.
4. Approval sends the configured RCON whitelist command using the resolved SteamID64.
5. Applicants receive an approval or rejection email, with an optional admin-written message.

## Notes

- The public form accepts Steam community profile URLs only.
- Applicant emails cannot be reused while another request is pending or approved.
- Rejected applicant emails have a 24-hour cooldown before they can be used again.
- Admin access is limited to Google accounts present in `ADMIN_ALLOWLIST`.
- Approval is blocked until a valid SteamID64 is available.
- RCON credentials remain server-side and are never exposed to the client.

## Useful scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run prisma:generate`
- `npm run db:push`
- `npm run db:studio`

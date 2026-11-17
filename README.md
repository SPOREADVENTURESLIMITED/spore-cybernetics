# Spore Cybernetics — Full-stack platform

A dynamic Next.js-compatible application built with React, TypeScript, PostgreSQL and Prisma. It includes customer authentication, a central administrator, a service catalogue, service enquiries, product catalogue, order workflow and customer portal.

## Architecture
- **Frontend:** React 19, TypeScript, Next-compatible App Router through Vinext.
- **Application/API:** Server-rendered pages and route handlers.
- **Database:** PostgreSQL with Prisma ORM and Neon adapter.
- **Authentication:** Signed HTTP-only session cookie; bcrypt password hashes; CUSTOMER / ADMIN roles.
- **Commerce:** Product catalogue, stock validation, order records and payment-ready order workflow.
- **Administration:** Central administrator dashboard and management workflows.
- **Deployment:** Cloudflare Workers/Pages via Vinext Cloudflare adapter; PostgreSQL database connection required.

## Run locally
1. Install Node.js 20.9+ and PostgreSQL/Neon.
2. Configure `DATABASE_URL`, `AUTH_SECRET` (32+ random characters), `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in the local environment.
3. Install and prepare:
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run db:seed
   npm run dev
   ```
4. Open the local app and sign in at `/login`.

## Included modules
- Corporate homepage and ICT service divisions.
- Dynamic service catalogue and contact/service request workflow.
- Customer registration, login and protected customer portal.
- Product catalogue, cart and order request checkout flow.
- Central admin dashboard, service and product management.
- Admin-protected APIs and payment configuration placeholders.
- Document authentication registry, QR verification and revocation.

## Payment and launch readiness
The order endpoint creates pending orders; it does not collect money. Complete merchant onboarding, webhook verification, reconciliation, refunds and receipts before enabling live payments. Never mark an order paid based only on a browser redirect.

## Security / production checklist
- Set a unique `AUTH_SECRET` and strong admin password.
- Keep secrets out of source control.
- Use HTTPS, managed PostgreSQL backups, database migrations, rate limiting, CSRF/origin checks and centralised logs.
- Add email/SMS delivery, password reset and email verification before public launch.
- Verify business contact details, legal terms, privacy policy and service commitments.
- Run Prisma generation, database schema update, seed (where appropriate), build and end-to-end tests in the target environment.

## Document authentication and verification
- Administrator registry: `/admin/documents`.
- Public verification: `/verify`.
- Official seal asset: `/spore-authentication-seal.svg`.
- Each issued document gets a unique reference and opaque verification code.
- QR codes point to the public verification page and contain only the public reference.
- Administrators can revoke active records with a reason; expiry is checked during verification.

After adding the document model, apply it to the configured PostgreSQL database and regenerate the Prisma client before deploying:

```bash
npx prisma db push
npx prisma generate
npm run build
```

The current QR image is rendered by an external QR service using only the public verification URL. A seal and QR code alone do not cryptographically prove that PDF contents have not been changed. Before treating this as a legal-grade e-signature system, add controlled PDF storage, SHA-256 hash capture and verification, signed issuance events, and immutable audit logging.


## Automated Cloudflare deployment
The GitHub Actions workflow `.github/workflows/deploy.yml` runs on relevant pushes to `main` and can also be started manually. Configure these GitHub Actions production environment secrets before the workflow can complete:
- `DATABASE_URL`: PostgreSQL connection string for the production database migration.
- `CLOUDFLARE_API_TOKEN`: token with the permissions required by the configured Cloudflare Worker deployment.
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account identifier.

The deployed Worker must also already have its runtime `DATABASE_URL` and `AUTH_SECRET` secrets configured in Cloudflare. The workflow does not print or expose secret values. A failed workflow must be checked in GitHub Actions before claiming the service is live.

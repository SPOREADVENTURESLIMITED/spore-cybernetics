# Spore Cybernetics — Full-stack platform

A dynamic Next.js 15 + React + TypeScript application with PostgreSQL/Prisma, secure customer authentication, a single central administrator, a service catalogue, service enquiry workflow, product catalogue, order creation, customer portal and admin management.

## Architecture
- **Frontend:** Next.js App Router, React 19, responsive custom design system.
- **Application/API:** Next.js server components and route handlers.
- **Database:** PostgreSQL with Prisma ORM.
- **Authentication:** Signed, HTTP-only session cookie; bcrypt password hashes; CUSTOMER / ADMIN roles.
- **Commerce:** Product catalogue, stock validation, order records and payment-ready order workflow.
- **Administration:** One central ADMIN role; staff/departments are deliberately not enabled in this first release.
- **Deployment:** Any Node.js hosting platform that supports Next.js plus a managed PostgreSQL database.

## Run locally
1. Install Node.js 20.9+ and PostgreSQL.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD`.
3. Install and prepare:
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run db:seed
   npm run dev
   ```
4. Open http://localhost:3000 and sign in to `/login` using the admin credentials configured before seeding.

## Included modules
- Corporate homepage and 14 seeded ICT service divisions.
- Dynamic service catalogue from PostgreSQL.
- Contact / service request submissions with reference numbers.
- Customer registration, login and protected customer portal.
- Product catalogue, browser cart and order-request checkout flow.
- Order creation API with stock and currency validation.
- Central admin dashboard, service and product creation, and service-request status/notes workflow.
- Admin-protected APIs for catalogue writes and request status updates.
- Payment model and provider configuration placeholders for card and Mobile Money integrations.

## Payment and launch readiness
The order endpoint currently creates a **pending order**; it does not collect money. Before enabling live checkout, complete and test the relevant merchant integrations (MTN MoMo Collections, Airtel Money where available, and/or Stripe), webhook signature verification, reconciliation, refunds and customer receipts. Never mark an order paid based only on a browser redirect. Use verified provider callbacks/webhooks.

## Security / production checklist
- Set a unique `AUTH_SECRET` (32+ random characters) and strong admin password.
- Keep `.env` out of source control. Rotate credentials if exposed.
- Use HTTPS, managed PostgreSQL backups, database migrations, rate limiting, CSRF/origin checks, bot protection and centralised logs.
- Add email/SMS delivery, password reset, email verification and privacy/terms pages before public launch.
- Add product images from approved sources and verify all stock/prices.
- Confirm business contact email, phone, physical address, service commitments and legal details.
- Run `npm install`, `npx prisma generate`, `npx prisma db push`, `npm run db:seed`, and `npm run build` in the target environment.

## Important
This is a deployable full-stack starter implementation, not a live deployment. The database and payment credentials must be configured, and live payment provider onboarding/testing is required before accepting customer payments.

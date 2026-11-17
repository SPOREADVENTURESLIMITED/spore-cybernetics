import { test, expect } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { readFile } from 'node:fs/promises';

const publicRoutes = ['/', '/services', '/shop', '/booking', '/quote', '/login', '/register', '/admin/login'];

for (const route of publicRoutes) {
  test(`public page ${route} responds successfully`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `No HTTP response for ${route}`).not.toBeNull();
    expect(response!.status(), `Unexpected HTTP status for ${route}`).toBeLessThan(400);
    await expect(page.locator('body')).not.toBeEmpty();
  });
}

test('registration and login forms render', async ({ page }) => {
  await page.goto('/register');
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await page.goto('/login');
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});

test('admin pages and document issue/revoke APIs deny unauthenticated visitors', async ({ page }) => {
  const api = await page.request.get('/api/admin/dashboard');
  expect(api.status()).toBe(403);
  await page.goto('/admin/login');
  const protectedActions = await page.evaluate(async () => {
    const issue = await fetch('/api/admin/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Test certificate', documentType: 'Certificate', recipientName: 'Test recipient', issuerName: 'Spore Cybernetics' }) });
    const revoke = await fetch('/api/admin/documents/not-a-real-document', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Unauthorised test request' }) });
    return { issue: issue.status, revoke: revoke.status };
  });
  expect(protectedActions.issue).toBe(403);
  expect(protectedActions.revoke).toBe(403);
  await page.goto('/admin');
  await expect(page).toHaveURL(/login/);
});

test('PWA manifest and service worker are available', async ({ page, request }) => {
  const manifestResponse = await request.get('/manifest.webmanifest');
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.name).toContain('Spore Cybernetics');
  expect(manifest.start_url).toBe('/');
  expect(manifest.icons.length).toBeGreaterThan(0);
  const workerResponse = await request.get('/sw.js');
  expect(workerResponse.ok()).toBeTruthy();
});

test('parallel server renders do not leak request context', async ({ request }) => {
  const routes = ['/', '/services', '/shop', '/booking', '/quote', '/admin/login', '/verify?code=SC-INVALID-PARALLEL-TEST'];
  const responses = await Promise.all(routes.map(route => request.get(route)));
  for (const [index, response] of responses.entries()) {
    expect(response.status(), `Unexpected HTTP status for ${routes[index]}`).toBeLessThan(400);
  }
});

for (const viewport of [{ width: 390, height: 844 }, { width: 1365, height: 900 }]) {
  test(`homepage and navigation fit viewport ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page.locator('body')).not.toBeEmpty();
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
    }));
    expect(widths.page).toBeLessThanOrEqual(widths.viewport + 1);
  });
}

test('homepage has no uncaught browser errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).not.toBeEmpty();
  expect(pageErrors).toEqual([]);
});

test('document verification portal rejects an unknown reference', async ({ page }) => {
  await page.goto('/verify');
  await expect(page.getByRole('heading', { name: /Document verification/i })).toBeVisible();
  await page.goto('/verify?code=SC-INVALID-PLAYWRIGHT-TEST');
  await expect(page.getByRole('heading', { name: 'Document not found' })).toBeVisible();
});

test('document registry is restricted to authenticated administrators', async ({ page }) => {
  await page.goto('/admin/documents');
  await expect(page.getByRole('heading', { name: /Administrator sign in required/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to administrator sign in' })).toHaveAttribute('href', '/admin/login');
});

test('official document authentication seal is served', async ({ request }) => {
  const response = await request.get('/spore-authentication-seal.svg');
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toContain('SPORE CYBERNETICS');
});

test('homepage displays the configured business phone and hides unset social prompts', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.contact-details').getByText('+256 392 903 604')).toBeVisible();
  await expect(page.locator('.contact-details').getByRole('link', { name: 'WhatsApp us' })).toHaveAttribute('href', 'https://wa.me/256392903604');
  await expect(page.getByText(/add link in admin/i)).toHaveCount(0);
});

test('PDF integrity endpoint rejects a non-PDF upload', async ({ request }) => {
  const response = await request.post('/api/verify-document', {
    multipart: { reference: 'SC-INVALID-PDF-TEST', file: { name: 'not-a-pdf.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a PDF') } },
  });
  expect(response.status()).toBe(415);
});

test('authorised administrator issues a sealed PDF, verifies its fingerprint and revokes the record', async ({ page }) => {
  test.setTimeout(90000);
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  test.skip(!email || !password, 'Temporary authorised administrator fixture is not configured.');

  await page.goto('/admin/login');
  await page.locator('input[name="email"]').fill(email!);
  await page.locator('input[name="password"]').fill(password!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(url => url.pathname === '/admin');
  await page.goto('/admin/documents');
  await expect(page.getByRole('heading', { name: /Document registry/i })).toBeVisible();
  await expect(page.locator('input[type="file"][accept="application/pdf,.pdf"]')).toBeAttached();

  const sourcePdf = await PDFDocument.create();
  const sourcePage = sourcePdf.addPage([595, 842]);
  const font = await sourcePdf.embedFont(StandardFonts.Helvetica);
  sourcePage.drawText('Controlled Spore Cybernetics QA document - not for customer use.', { x: 60, y: 760, size: 12, font });
  const pdfBytes = Buffer.from(await sourcePdf.save());
  await page.locator('input[type="file"][accept="application/pdf,.pdf"]').setInputFiles({
    name: 'controlled-admin-test.pdf', mimeType: 'application/pdf', buffer: pdfBytes,
  });
  await page.locator('input[name="title"]').fill('Controlled administrator QA certificate');
  await page.locator('input[name="recipientName"]').fill('Automated QA Recipient');
  await page.locator('input[name="recipientEmail"]').fill('qa@example.invalid');
  await page.locator('input[name="issuerName"]').fill('Spore Cybernetics QA');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Issue document & generate QR' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^SC-\d{4}-[A-F0-9]{24}-authenticated\.pdf$/);
  const reference = download.suggestedFilename().replace('-authenticated.pdf', '');
  const sealedPdf = await readFile(await download.path());
  expect(sealedPdf.subarray(0, 5).toString()).toBe('%PDF-');

  const integrity = await page.request.post('/api/verify-document', {
    multipart: { reference, file: { name: download.suggestedFilename(), mimeType: 'application/pdf', buffer: sealedPdf } },
  });
  expect(integrity.ok()).toBeTruthy();
  expect((await integrity.json()).match).toBe(true);

  const recordRow = page.getByRole('row').filter({ hasText: reference });
  await expect(recordRow).toBeVisible();
  page.once('dialog', dialog => dialog.accept('Controlled automated QA revocation test.'));
  await recordRow.getByRole('button', { name: 'Revoke' }).click();
  await expect(recordRow).toContainText('REVOKED');

  await page.goto('/verify?code=' + encodeURIComponent(reference));
  await expect(page.getByRole('heading', { name: 'REVOKED' })).toBeVisible();
});

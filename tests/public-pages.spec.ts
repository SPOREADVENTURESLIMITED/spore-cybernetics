import { test, expect } from '@playwright/test';

const publicRoutes = ['/', '/services', '/shop', '/booking', '/login', '/register'];

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
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await page.goto('/login');
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});

test('admin pages and dashboard API deny unauthenticated visitors', async ({ page }) => {
  const api = await page.request.get('/api/admin/dashboard');
  expect(api.status()).toBe(403);
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

import { test, expect } from '@playwright/test';

const publicRoutes = [
  '/',
  '/services',
  '/shop',
  '/booking',
  '/login',
  '/register',
];

for (const route of publicRoutes) {
  test(`public page ${route} responds successfully`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

    expect(response, `No HTTP response for ${route}`).not.toBeNull();
    expect(
      response!.status(),
      `Unexpected HTTP status for ${route}`,
    ).toBeLessThan(400);

    await expect(page.locator('body')).not.toBeEmpty();
  });
}

test('homepage has no uncaught browser errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).not.toBeEmpty();

  expect(pageErrors).toEqual([]);
});

test('homepage renders on a mobile viewport', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(400);
  await expect(page.locator('body')).not.toBeEmpty();

  await context.close();
});

import { test, expect } from '@playwright/test';
import {
  DEMO_LEARNER,
  DEMO_MENTOR,
  loginAsLearner,
  loginAsMentor,
} from './helpers/auth.helper';

test.describe('Authentication and Access Control (Role Security)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies & local storage before each test
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
  });

  test('Unauthenticated users are redirected to /login from protected routes', async ({
    page,
  }) => {
    // Attempt to access learner dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);

    // Attempt to access goal details
    await page.goto('/goals/1');
    await expect(page).toHaveURL(/\/login/);

    // Attempt to access mentor supervisor dashboard
    await page.goto('/mentor');
    await expect(page).toHaveURL(/\/login/);

    // Attempt to access mentor system configuration
    await page.goto('/mentor/config');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Login fails with invalid credentials and displays error message', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.fill('#email', 'invalid.user@example.com');
    await page.fill('#password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Assert error message banner is visible
    const errorBanner = page.locator('.error-message');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/invalid/i);
    // User remains on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('Learner logs in successfully and lands on /dashboard', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.fill('#email', DEMO_LEARNER.email);
    await page.fill('#password', DEMO_LEARNER.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify user role badge and header
    await expect(page.locator('.user-role-badge')).toHaveText('LEARNER');
    await expect(page.locator('.eyebrow')).toHaveText('YOUR LEARNING DASHBOARD');
  });

  test('Learners cannot access mentor-only pages and are redirected to /dashboard', async ({
    page,
  }) => {
    await loginAsLearner(page);

    // Attempt to navigate directly to /mentor
    await page.goto('/mentor');
    // Role guard redirects unauthorized learner back to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Attempt to navigate directly to /mentor/config
    await page.goto('/mentor/config');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Mentor logs in successfully and lands on /mentor', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', DEMO_MENTOR.email);
    await page.fill('#password', DEMO_MENTOR.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/mentor');
    await expect(page).toHaveURL(/\/mentor/);

    // Verify mentor console elements
    await expect(page.locator('.mentor-tag')).toHaveText('MENTOR');
    await expect(page.locator('.eyebrow')).toHaveText('MENTOR SUPERVISION');
  });

  test('Sign out terminates the session and redirects to /login', async ({
    page,
  }) => {
    await loginAsLearner(page);

    // Click Sign out button in topbar
    await page.locator('.logout-btn').click();
    await expect(page).toHaveURL(/\/login/);

    // Attempt to return to /dashboard without logging back in
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});


import { Page, expect } from '@playwright/test';

export const DEMO_LEARNER = {
  email: 'learner@example.com',
  password: 'Password123!',
};

export const DEMO_MENTOR = {
  email: 'mentor@example.com',
  password: 'Password123!',
};

/**
 * Helper to log in as demo Learner
 */
export async function loginAsLearner(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  await page.fill('#email', DEMO_LEARNER.email);
  await page.fill('#password', DEMO_LEARNER.password);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await expect(page).toHaveURL(/\/dashboard/);
  // Wait for goals or empty state to appear
  await expect(page.locator('.main-content')).toBeVisible();
}

/**
 * Helper to log in as demo Mentor
 */
export async function loginAsMentor(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  await page.fill('#email', DEMO_MENTOR.email);
  await page.fill('#password', DEMO_MENTOR.password);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/mentor', { timeout: 10000 });
  await expect(page).toHaveURL(/\/mentor/);
  await expect(page.locator('.main-content')).toBeVisible();
}


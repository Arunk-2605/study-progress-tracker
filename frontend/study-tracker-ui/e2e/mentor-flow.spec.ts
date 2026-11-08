import { test, expect } from '@playwright/test';
import { loginAsMentor } from './helpers/auth.helper';

test.describe('Mentor Supervision & Configuration Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsMentor(page);
  });

  test('Mentor views supervisor metrics and filters learner goals', async ({
    page,
  }) => {
    // ----------------------------------------------------
    // STEP 1: Verify Supervisor Dashboard Metrics
    // ----------------------------------------------------
    await expect(page.locator('.summary-cards')).toBeVisible();
    await expect(page.locator('.summary-lbl:has-text("Active Learners")')).toBeVisible();
    await expect(page.locator('.summary-lbl:has-text("Total Goals")')).toBeVisible();
    await expect(page.locator('.summary-lbl:has-text("Topics Completed")')).toBeVisible();
    await expect(page.locator('.summary-lbl:has-text("Total Study Time")')).toBeVisible();

    // ----------------------------------------------------
    // STEP 2: Filter and Search Goals
    // ----------------------------------------------------
    const searchInput = page.locator('.search-box input');
    await expect(searchInput).toBeVisible();

    // Type a non-existent search query to test empty state
    await searchInput.fill('NonExistentGoalTitleXYZ_999');
    await expect(
      page.locator('.empty-state:has-text("No goals match the current search")'),
    ).toBeVisible();

    // Clear search query to restore goal list
    await searchInput.fill('');
    await expect(page.locator('.mentor-goal-card').first()).toBeVisible();
  });

  test('Mentor inspects learner goal in Read-Only mode without modification controls', async ({
    page,
  }) => {
    // Click "Inspect Topics & Sessions →" on the first available learner goal
    const firstGoalCard = page.locator('.mentor-goal-card').first();
    await expect(firstGoalCard).toBeVisible();
    await firstGoalCard.locator('button.inspect-btn').click();

    // Verify navigation to /goals/:id
    await page.waitForURL(/\/goals\/\d+/);

    // Verify Read-Only Mentor Mode indicator
    await expect(page.locator('.read-only-badge')).toHaveText(
      '👁️ Read-Only Mentor Mode',
    );
    await expect(page.locator('.back-link')).toHaveText('← Back to Learners Overview');

    // Verify all learner modification controls are NOT present
    await expect(page.locator('.add-topic-card')).toBeHidden();
    await expect(page.locator('.log-session-card')).toBeHidden();
    await expect(page.locator('.link-action-btn')).toBeHidden();
    await expect(page.locator('.status-toggle-btn')).toBeHidden();
  });

  test('Mentor tests configuration validation, updates settings, and restores defaults', async ({
    page,
  }) => {
    // Navigate to System Configuration
    await page.click('a[routerLink="/mentor/config"]');
    await page.waitForURL(/\/mentor\/config/);

    await expect(page.locator('h1')).toHaveText('Global Study System Configuration');
    await expect(page.locator('.active-limits-bar')).toBeVisible();

    // ----------------------------------------------------
    // STEP 1: Test Boundary Validation Error
    // ----------------------------------------------------
    // Set minSession greater than maxSession (e.g. 500 min, 100 max)
    await page.fill('#minSession', '500');
    await page.fill('#maxSession', '100');
    await page.click('button[type="submit"]:has-text("Save Configuration")');

    // Assert validation error banner
    const errorBanner = page.locator('.error-banner');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(
      'Minimum session minutes cannot exceed maximum session minutes.',
    );

    // ----------------------------------------------------
    // STEP 2: Save Valid Updated Configuration
    // ----------------------------------------------------
    await page.fill('#minSession', '15');
    await page.fill('#maxSession', '360');
    await page.fill('#maxPrereqs', '8');
    await page.click('button[type="submit"]:has-text("Save Configuration")');

    // Assert success banner appears
    const successBanner = page.locator('.success-banner');
    await expect(successBanner).toBeVisible();
    await expect(successBanner).toContainText('Configuration updated successfully');

    // Verify active limits bar reflects updated values
    await expect(page.locator('.limit-box:has-text("Active Min Session")')).toContainText(
      '15 mins',
    );
    await expect(page.locator('.limit-box:has-text("Active Max Session")')).toContainText(
      '360 mins',
    );
    await expect(page.locator('.limit-box:has-text("Active Max Prerequisites")')).toContainText(
      '8 per topic',
    );

    // ----------------------------------------------------
    // STEP 3: Reset and Restore Recommended Defaults
    // ----------------------------------------------------
    // Click "Reset to Recommended Defaults"
    await page.click('button:has-text("Reset to Recommended Defaults")');

    // Verify input fields are reset to defaults
    await expect(page.locator('#minSession')).toHaveValue('5');
    await expect(page.locator('#maxSession')).toHaveValue('480');
    await expect(page.locator('#maxPrereqs')).toHaveValue('5');

    // Save defaults back to backend database
    await page.click('button[type="submit"]:has-text("Save Configuration")');
    await expect(successBanner).toBeVisible();

    // Verify active limits bar shows restored values
    await expect(page.locator('.limit-box:has-text("Active Min Session")')).toContainText(
      '5 mins',
    );
    await expect(page.locator('.limit-box:has-text("Active Max Session")')).toContainText(
      '480 mins',
    );
  });
});

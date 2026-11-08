import { test, expect } from '@playwright/test';
import { loginAsLearner } from './helpers/auth.helper';

test.describe('Learner Complete End-to-End Workflow', () => {
  const timestamp = Date.now();
  const goalTitle = `E2E Track ${timestamp}`;
  const goalDescription = `Automated E2E testing learning goal created at ${timestamp}`;
  const topic1Title = `Foundational Topic ${timestamp}`;
  const topic2Title = `Advanced Topic ${timestamp}`;

  test.beforeEach(async ({ page }) => {
    await loginAsLearner(page);
  });

  test('Learner can view dashboard metrics, create a goal, manage topics, prerequisites, cascades, and sessions', async ({
    page,
  }) => {
    // ----------------------------------------------------
    // STEP 1: Verify Dashboard Metrics & Stats Grid
    // ----------------------------------------------------
    await expect(page.locator('.stats-grid')).toBeVisible();
    await expect(page.locator('text=Total Goals')).toBeVisible();
    await expect(page.locator('text=Topics Completed')).toBeVisible();
    await expect(page.locator('text=Study Time')).toBeVisible();
    await expect(page.locator('text=Overall Progress')).toBeVisible();

    // ----------------------------------------------------
    // STEP 2: Create a New Learning Goal
    // ----------------------------------------------------
    await page.click('button:has-text("+ New Goal")');
    await expect(page.locator('.modal-card')).toBeVisible();

    await page.fill('#goalTitle', goalTitle);
    await page.fill('#goalDesc', goalDescription);
    await page.click('.modal-actions button[type="submit"]');

    // Wait for modal to disappear and the goal card to appear
    await expect(page.locator('.modal-backdrop')).toBeHidden();
    const createdGoalCard = page.locator('.goal-card', { hasText: goalTitle });
    await expect(createdGoalCard).toBeVisible();
    await expect(createdGoalCard).toContainText(goalDescription);

    // ----------------------------------------------------
    // STEP 3: Navigate to Goal Details Page
    // ----------------------------------------------------
    await createdGoalCard.locator('button.view-goal-btn').click();
    await page.waitForURL(/\/goals\/\d+/);

    // Verify Goal Overview Header
    await expect(page.locator('h1')).toHaveText(goalTitle);
    await expect(page.locator('.progress-hero')).toBeVisible();

    // ----------------------------------------------------
    // STEP 4: Create Topics under the Goal
    // ----------------------------------------------------
    // Add Topic 1 (Prerequisite)
    const topicInput = page.locator('input[name="topicTitle"]');
    const addTopicBtn = page.locator('button:has-text("+ Add Topic")');

    await topicInput.fill(topic1Title);
    await addTopicBtn.click();
    const topic1Item = page.locator('.topic-item', {
      has: page.locator('h4', { hasText: topic1Title }),
    });
    await expect(topic1Item).toBeVisible();

    // Add Topic 2 (Dependent)
    await topicInput.fill(topic2Title);
    await addTopicBtn.click();
    const topic2Item = page.locator('.topic-item', {
      has: page.locator('h4', { hasText: topic2Title }),
    });
    await expect(topic2Item).toBeVisible();

    // Both topics start as "Ready to Study"
    await expect(topic1Item.locator('.badge-ready')).toBeVisible();
    await expect(topic2Item.locator('.badge-ready')).toBeVisible();

    // ----------------------------------------------------
    // STEP 5: Prerequisite Management (Topic 1 -> Topic 2)
    // ----------------------------------------------------
    // On Topic 2, click "+ Link Prerequisite"
    await topic2Item.locator('button:has-text("+ Link Prerequisite")').click();
    await expect(page.locator('.modal-card h3:has-text("Link Prerequisite")')).toBeVisible();

    // Select Topic 1 from dropdown
    await page.locator('#prereqSelect').selectOption({ index: 1 });
    await page.locator('.modal-actions button[type="submit"]').click();

    // Modal closes and Topic 2 becomes LOCKED
    await expect(page.locator('.modal-backdrop')).toBeHidden();
    await expect(topic2Item.locator('.badge-locked')).toHaveText('🔒 Locked');
    await expect(topic2Item.locator('.missing-prereqs-notice')).toContainText(topic1Title);

    // The status toggle button on Topic 2 is disabled while locked
    const topic2Toggle = topic2Item.locator('.status-toggle-btn');
    await expect(topic2Toggle).toBeDisabled();

    // ----------------------------------------------------
    // STEP 6: Topic Completion & Dynamic Unlocking
    // ----------------------------------------------------
    // Complete Topic 1
    const topic1Toggle = topic1Item.locator('.status-toggle-btn');
    await topic1Toggle.click();

    // Topic 1 is now marked completed
    await expect(topic1Item.locator('.badge-success')).toHaveText('Completed');
    await expect(topic1Toggle).toHaveClass(/checked/);

    // Topic 2 automatically transitions from LOCKED to Ready to Study
    await expect(topic2Item.locator('.badge-ready')).toBeVisible();
    await expect(topic2Item.locator('.badge-locked')).toBeHidden();
    await expect(topic2Toggle).toBeEnabled();

    // Complete Topic 2
    await topic2Toggle.click();
    await expect(topic2Item.locator('.badge-success')).toHaveText('Completed');

    // Goal Progress reaches 100%
    await expect(page.locator('.hero-stat-item:has-text("Progress") .hero-value')).toHaveText(
      '100%',
    );
    await expect(
      page.locator('.hero-stat-item:has-text("Topics Completed") .hero-value'),
    ).toHaveText('2 / 2');

    // ----------------------------------------------------
    // STEP 7: Cascading Reopen of Dependent Topics
    // ----------------------------------------------------
    // When Topic 1 is reopened, Topic 2 (which depends on it) must also be reopened & locked
    await topic1Toggle.click();

    // Verify Topic 1 is no longer completed
    await expect(topic1Item.locator('.badge-ready')).toBeVisible();
    await expect(topic1Toggle).not.toHaveClass(/checked/);

    // Verify Topic 2 was automatically reopened and is now locked again!
    await expect(topic2Item.locator('.badge-locked')).toHaveText('🔒 Locked');
    await expect(topic2Toggle).toBeDisabled();
    await expect(topic2Toggle).not.toHaveClass(/checked/);

    // Verify progress dropped back to 0%
    await expect(page.locator('.hero-stat-item:has-text("Progress") .hero-value')).toHaveText(
      '0%',
    );

    // ----------------------------------------------------
    // STEP 8: Log a Study Session
    // ----------------------------------------------------
    // Select Topic 1 for session logging
    await page.locator('#sessionTopic').selectOption({ index: 1 });
    await page.fill('#sessionMinutes', '45');
    await page.fill('#sessionNote', 'E2E automated study session note');
    await page.click('button.submit-session-btn');

    // Verify success banner appears
    const sessionSuccess = page.locator('.field-success');
    await expect(sessionSuccess).toBeVisible();
    await expect(sessionSuccess).toContainText('Logged 45 minutes of study!');

    // Verify entry in Session History
    const historySection = page.locator('.session-history-card');
    await expect(historySection).toContainText(topic1Title);
    await expect(historySection).toContainText('45 mins');
    await expect(historySection).toContainText('E2E automated study session note');

    // ----------------------------------------------------
    // STEP 9: Return to Dashboard and Verify Updated Progress
    // ----------------------------------------------------
    await page.click('a.back-link');
    await page.waitForURL(/\/dashboard/);

    // Find our goal card and assert updated metrics
    const updatedCard = page.locator('.goal-card', { hasText: goalTitle });
    await expect(updatedCard).toBeVisible();
    await expect(updatedCard).toContainText('2 topics');
  });
});

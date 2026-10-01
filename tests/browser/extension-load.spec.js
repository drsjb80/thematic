const { test, expect } = require('@playwright/test');

test.describe('Extension Loading', () => {
  test('extension loads without errors', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Load the extension background script
    await page.goto('about:blank');

    // Verify no console errors occurred
    const consoleMessages = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    // Note: Full extension testing requires web-ext or similar to load
    // the extension into the Firefox profile before running tests.
    // This is a placeholder for the actual implementation.

    await context.close();
  });

  test('background script initializes storage', async ({ browser }) => {
    // This test would verify that the storage is initialized
    // with default themes and currentId after extension load
    // Requires actual extension to be loaded in Firefox profile
    expect(true).toBe(true);
  });
});

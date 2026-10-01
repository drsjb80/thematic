# Browser Integration Tests with Playwright

This directory contains integration tests for the Thematic extension using Playwright.

## Setup

Before running browser tests, you need to load the extension into Firefox:

```bash
# Install Playwright (if not already installed)
npm install

# Create a Firefox profile with the extension loaded
web-ext run --firefox-binary /path/to/firefox --no-reload
```

## Running Tests

```bash
# Run all Playwright tests
npm run test:browser

# Run tests in interactive UI mode
npm run test:browser:ui

# Run a specific test file
npm run test:browser -- tests/browser/extension-load.spec.js

# Run with headed browser (see what's happening)
npm run test:browser -- --headed
```

## Test Structure

- **extension-load.spec.js** - Verifies extension loads and initializes
- **popup-ui.spec.js** - Tests popup UI interactions (themes list, clicking)
- **keyboard-shortcuts.spec.js** - Tests keyboard shortcut functionality
- **theme-rotation.spec.js** - Tests auto-rotation and manual theme switching
- **storage-sync.spec.js** - Tests storage persistence and theme filtering

## Notes

- Extension testing with Playwright requires the extension to be loaded in a Firefox profile
- Use `web-ext` to run the extension during development and testing
- Tests use Firefox as the primary browser (Thunderbird support is manual)
- Some tests may require a real Firefox instance with actual themes installed

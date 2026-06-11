# Manifest V3 Migration Notes

**Status**: Not urgent. Does not currently affect Thematic (as of June 2026).

**Knowledge Base**: Information as of February 2025. Verify current details with [Mozilla's official MV3 migration guide](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/manifest_version).

## Why Consider MV3?

Firefox has been moving toward Manifest V3 (following Chrome's lead), but has been more lenient than Chrome about MV2 deprecation. No hard deadline has been set as of the knowledge cutoff. Only pursue this if:
- Mozilla announces a specific MV2 sunset date
- MV2 support becomes actively problematic
- User base demands it

## Major Changes Required

### 1. Background Script Architecture
**Current (MV2):**
```json
"background": { "page": "src/background-page.html" }
```

**New (MV3):**
```json
"background": { "service_worker": "src/background.js" }
```

**Impact**: Service workers are ephemeral—they can be unloaded by the browser. All state must be persisted via `browser.storage` API, not in-memory objects.

### 2. State Management
**Current approach** (works in MV2):
- Uses module-level `locals` and `syncs` objects
- Assumes background script stays in memory

**Required for MV3**:
- All state must be stored in `browser.storage.sync` and `browser.storage.local`
- Every function that reads state must retrieve it from storage
- No in-memory caching of theme lists

**Files affected**:
- `src/thematic.js` - Refactor to eliminate `locals`/`syncs` in-memory objects

### 3. HTML-Based Background Page
**Current**: `src/background-page.html` loads `thematic.js` via `<script>` tag

**New**: Service worker model - just `src/background.js`

**Changes**:
- Remove `background-page.html`
- Inline any necessary setup code into `background.js`
- Convert any HTML-based initialization to JavaScript

### 4. Content Security Policy (CSP)
**Impact**: Low for Thematic
- No inline scripts (already compliant)
- No `eval()` (not used)
- No external CDN scripts (none used)

### 5. Permissions
**Impact**: Low for Thematic
- Thematic doesn't request host permissions
- Current permissions (`storage`, `alarms`, `menus`, `management`, `commands`) should remain valid

## APIs Compatibility

**Should continue working unchanged:**
- ✅ `browser.storage.sync` / `browser.storage.local`
- ✅ `browser.alarms`
- ✅ `browser.management`
- ✅ `browser.menus`
- ✅ `browser.commands`
- ✅ `browser.runtime`

**May need review:**
- Event listeners (service workers handle lifecycle differently)
- Alarm creation/clearing (should work but verify timing)

## Implementation Plan

### Phase 1: Preparation
1. Audit all state storage (identify what's in memory vs storage)
2. Plan migration of `locals` and `syncs` object usage
3. Review all event listeners for MV3 compatibility

### Phase 2: Core Changes
1. Update `manifest.json` to version 3
2. Delete `src/background-page.html`
3. Create `src/background.js` as service worker entry point
4. Refactor state access to use `browser.storage` API consistently
5. Move all initialization logic to JavaScript

### Phase 3: Testing
1. Run existing test suite (may need updates for storage timing)
2. Manual testing: theme switching, auto-rotation, menu items
3. Test on both Firefox and Thunderbird

### Phase 4: Verification
1. Run extension through Mozilla's validation tools
2. Test on real Firefox installation
3. Verify alarms and menus work as expected

## Effort Estimate

**Time**: 4-6 hours
**Risk**: Moderate (state persistence model changes)
**Complexity**: Medium (mostly mechanical refactoring, some timing considerations)

**Main complexity areas**:
- Ensuring state persists correctly across service worker unloads
- Handling timing of async storage operations
- Testing state synchronization between storage APIs

## Decision Criteria

**Migrate to MV3 if:**
- ✅ Mozilla announces hard deadline for MV2 deprecation
- ✅ MV2 support becomes actively broken in new Firefox versions
- ✅ User base explicitly requests it

**Defer if:**
- ❌ No deadline set (current status)
- ❌ Extension works fine in MV2
- ❌ User base doesn't require it

## Current Blockers

None. Thematic works fine in MV2. No action required until a deadline is announced or urgent compatibility issues arise.

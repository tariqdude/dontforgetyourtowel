# Technical Debt: Utility Function Consolidation

## Overview

This document tracks known technical debt related to duplicate utility functions across the codebase. These are areas that work correctly but could be improved for maintainability.

## Duplicate Utilities

### 1. Date Formatting Functions (RESOLVED)

**Files Affected:**

- `src/utils/helpers.ts` - `formatDate`, `getRelativeTime`
- `src/utils/index.ts` - `formatDate`, `formatRelativeTime`

**Description:**
Both files contain similar date formatting implementations.

**Status:** Resolved. Consolidated into `src/utils/date.ts`. `getRelativeTime` is now an alias for `formatRelativeTime`.

### 2. Array Utilities (RESOLVED)

**Files Affected:**

- `src/utils/helpers.ts` - `groupBy`, `sortBy`, `unique`, `chunk`
- `src/utils/index.ts` - `groupBy`, `unique`, `chunk`, `shuffle`

**Description:**
Duplicate implementations of common array utilities.

**Status:** Resolved. Consolidated into `src/utils/array.ts`. `groupBy` now supports both key string and key function.

### 3. String Utilities (RESOLVED)

**Files Affected:**

- `src/utils/helpers.ts` - `truncateText`, `capitalizeFirst`, `capitalizeWords`
- `src/utils/index.ts` - `truncate`, `titleCase`, `getInitials`

**Description:**
Similar string manipulation utilities with slightly different behaviors.

**Status:** Resolved. Consolidated into `src/utils/string.ts`. `truncate` now respects word boundaries and `truncateText` is an alias. `slugify` was improved.

### 4. Debounce/Throttle (RESOLVED)

**Files Affected:**

- `src/utils/helpers.ts` - `debounce`, `throttle`
- `src/utils/index.ts` - `debounce`, `throttle`

**Description:**
Identical implementations in both files.

**Status:** Resolved. Moved to `src/utils/function.ts` and re-exported.

### 5. URL Utilities (RESOLVED)

**Files Affected:**

- `src/utils/helpers.ts` - `buildUrl`, `withBasePath`, `resolveHref`
- `src/utils/index.ts` - `buildUrl`, `parseQuery`

**Description:**
`buildUrl` exists in both files with slightly different signatures.

**Status:** Resolved. Consolidated into `src/utils/url.ts`. `buildUrl` now supports both signatures.

### 6. Validation Functions (RESOLVED)

**Files Affected:**

- `src/utils/helpers.ts` - `validateEmail`, `validatePhone`
- `src/utils/index.ts` - `isValidEmail`
- `src/utils/validation.ts` - Comprehensive Zod schemas

**Description:**
Multiple validation approaches exist. `validation.ts` is the most comprehensive.

**Status:** Resolved. Consolidated into `src/utils/validation.ts`. Added simple boolean helpers that use the Zod schemas.

## Proposed Consolidation Plan

### Phase 1: Non-Breaking Changes

1. Create `src/utils/deprecated.ts` with deprecation notices
2. Add JSDoc `@deprecated` tags to duplicate functions
3. Update internal code to use preferred implementations

### Phase 2: Consolidation

1. Create focused utility modules:
   - `src/utils/date.ts`
   - `src/utils/array.ts`
   - `src/utils/string.ts`
   - `src/utils/function.ts` (debounce, throttle, etc.)
   - `src/utils/url.ts`
   - `src/utils/validation.ts`
2. Update `helpers.ts` and `index.ts` to re-export from these modules

### Phase 3: Cleanup

1. Remove deprecated re-exports after a release cycle
2. Update documentation
3. Add linting rules to prevent future duplication

## Impact Assessment

| Area              | Duplicate Count | Effort | Priority |
| ----------------- | --------------- | ------ | -------- |
| Debounce/Throttle | 0               | Done   | Resolved |
| Date Functions    | 0               | Done   | Resolved |
| Array Utilities   | 0               | Done   | Resolved |
| String Utilities  | 0               | Done   | Resolved |
| URL Utilities     | 0               | Done   | Resolved |
| Validation        | 0               | Done   | Resolved |

## Notes

- All duplicates currently work correctly
- No bugs have been reported due to these duplicates
- The main concern is maintainability and confusion for developers
- Consider this during the next major refactoring sprint

---

_Last Updated: 2025_
_Status: Tracking_

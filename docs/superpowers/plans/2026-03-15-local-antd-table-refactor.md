# Local Antd Table Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor each existing business table component to use local controlled Ant Design `Table` patterns while preserving current in-memory data behavior.

**Architecture:** Keep each table component independent. Move search and pagination state into `BusinessTable`, `DeployPlansTable`, `CIConfigsTable`, `CDConfigsTable`, and `InstancesTable`, and remove the shared `DetailTablePanel` shell from active usage. Preserve lightweight shared helpers in `table-standards.tsx` for truncation, alignment, and common table styles.

**Tech Stack:** React 18, TypeScript, Ant Design Table/Input, Vitest, Testing Library

---

## Chunk 1: Business List Table

### Task 1: Refactor `BusinessTable` to own search and pagination

**Files:**
- Modify: `q-devops-platform/src/components/business/BusinessTable.tsx`
- Modify: `q-devops-platform/src/components/business/BusinessListPanel.tsx`
- Test: `q-devops-platform/src/components/business/table-standards.test.tsx`

- [ ] **Step 1: Write the failing tests**
  - Add assertions proving `BusinessTable` renders its own search input and Antd pagination.
  - Add assertions proving the table filters rows locally and resets pagination when the keyword changes.

- [ ] **Step 2: Run tests to verify they fail**
  - Run: `pnpm vitest run src/components/business/table-standards.test.tsx`
  - Expected: FAIL because `BusinessTable` does not yet own the search/pagination UI.

- [ ] **Step 3: Write minimal implementation**
  - Move keyword, pagination, and filtering logic from `BusinessListPanel` into `BusinessTable`.
  - Keep `BusinessListPanel` as layout-only wrapper that passes the full business list through.
  - Use controlled `Table.pagination` instead of the external `TablePagination` component.

- [ ] **Step 4: Run tests to verify they pass**
  - Run: `pnpm vitest run src/components/business/table-standards.test.tsx`
  - Expected: PASS

### Task 2: Keep business list page integration stable

**Files:**
- Modify: `q-devops-platform/src/components/business/BusinessListPanel.tsx`
- Test: existing business page/router tests if needed

- [ ] **Step 1: Verify integration expectations**
  - Ensure the business list page still renders one table and one search entry point.

- [ ] **Step 2: Adjust wrapper markup only if needed**
  - Remove obsolete pagination/search shell markup that duplicates the new `BusinessTable` behavior.

- [ ] **Step 3: Re-run focused tests**
  - Run: `pnpm vitest run src/components/business/table-standards.test.tsx src/app/router/router.test.tsx`
  - Expected: PASS

## Chunk 2: Detail Tables

### Task 3: Refactor `DeployPlansTable` to local controlled table

**Files:**
- Modify: `q-devops-platform/src/components/business/DeployPlansTable.tsx`
- Test: `q-devops-platform/src/components/business/table-standards.test.tsx`
- Test: `q-devops-platform/src/pages/business-detail/BusinessDetailPage.test.tsx`

- [ ] **Step 1: Write the failing tests**
  - Add assertions for local search input and Antd pagination inside `DeployPlansTable`.
  - Add assertions that searching filters local rows.

- [ ] **Step 2: Run tests to verify they fail**
  - Run: `pnpm vitest run src/components/business/table-standards.test.tsx src/pages/business-detail/BusinessDetailPage.test.tsx`
  - Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
  - Inline the old `DetailTablePanel` behaviors into `DeployPlansTable`.
  - Use controlled `Table.pagination` with local filtering and page reset on keyword changes.

- [ ] **Step 4: Run tests to verify they pass**
  - Run the same focused Vitest command.
  - Expected: PASS

### Task 4: Refactor `CIConfigsTable`, `CDConfigsTable`, and `InstancesTable`

**Files:**
- Modify: `q-devops-platform/src/components/business/ConfigTables.tsx`
- Test: `q-devops-platform/src/components/business/table-standards.test.tsx`
- Test: `q-devops-platform/src/pages/business-detail/BusinessDetailPage.test.tsx`

- [ ] **Step 1: Write the failing tests**
  - Add assertions proving each table owns its search entry point and local pagination behavior.

- [ ] **Step 2: Run tests to verify they fail**
  - Run: `pnpm vitest run src/components/business/table-standards.test.tsx src/pages/business-detail/BusinessDetailPage.test.tsx`
  - Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
  - Refactor each table component to render `Input + Table`.
  - Keep only shared column helpers in `table-standards.tsx`.

- [ ] **Step 4: Run tests to verify they pass**
  - Run the same focused Vitest command.
  - Expected: PASS

## Chunk 3: Cleanup

### Task 5: Remove obsolete shared table shell usage

**Files:**
- Modify or delete: `q-devops-platform/src/components/business/DetailTablePanel.tsx`
- Modify or delete: `q-devops-platform/src/components/layout/pagination/TablePagination.tsx`
- Modify: `q-devops-platform/src/components/business/table-standards.test.tsx`
- Modify: `q-devops-platform/src/components/layout/pagination/TablePagination.test.tsx`

- [ ] **Step 1: Remove dead references**
  - Delete or detach `DetailTablePanel` and `TablePagination` if they are no longer used anywhere.

- [ ] **Step 2: Update tests**
  - Replace tests that assert shared-shell behavior with assertions against the concrete table components.

- [ ] **Step 3: Run verification**
  - Run: `pnpm vitest run src/components/business/table-standards.test.tsx src/pages/business-detail/BusinessDetailPage.test.tsx src/components/layout/pagination/TablePagination.test.tsx`
  - Expected: PASS, or no test file remains for deleted modules.

## Chunk 4: Final Verification

### Task 6: Validate the full affected frontend surface

**Files:**
- No new source files expected

- [ ] **Step 1: Run focused verification**
  - Run: `pnpm vitest run src/components/business/table-standards.test.tsx src/pages/business-detail/BusinessDetailPage.test.tsx src/app/router/router.test.tsx`
  - Expected: PASS

- [ ] **Step 2: Run module-level quality gates if time permits**
  - Run: `make test`
  - Run: `make lint`
  - Expected: PASS

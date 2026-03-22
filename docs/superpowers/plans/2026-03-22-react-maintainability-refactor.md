# React Maintainability Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the frontend page and hook structure for maintainability and React best-practice alignment without changing product behavior.

**Architecture:** Keep route/page files focused on composition, extract overloaded business-detail state machines into dedicated hooks, and make async update ownership explicit so stale responses and duplicate fetch flows are easier to control. The implementation stays inside the current frontend module patterns and does not introduce a new state library or backend layering model.

**Tech Stack:** React 18, React Router 7, TypeScript, Ant Design, Vite

---

## Chunk 1: CICD Hook Cleanup

### Task 1: Stabilize paged option loading

**Files:**
- Modify: `q-devops-platform/src/pages/cicd/usePagedSelectOptions.ts`

- [ ] Refactor `usePagedSelectOptions` so reset and reload behavior are explicit and effect dependencies are stable.
- [ ] Keep the current API shape (`options`, `loading`, `search`, `loadMore`, `reset`) so callers do not need unrelated rewrites.
- [ ] Verify the hook no longer relies on unsafe effect patterns for basic reload behavior.

### Task 2: Simplify build workspace loading flow

**Files:**
- Modify: `q-devops-platform/src/pages/cicd/useBuildWorkspace.ts`

- [ ] Refactor build list loading to remove the unsafe `finally` return pattern and make replace vs append logic easier to follow.
- [ ] Consolidate request bookkeeping so load-more and refresh logic share the same internal flow.
- [ ] Keep the returned public API stable for `CicdPage`.

### Task 3: Clean up `CicdPage` effect boundaries

**Files:**
- Modify: `q-devops-platform/src/pages/cicd/CicdPage.tsx`

- [ ] Reduce effect dependency ambiguity around infinite scroll and modal sync logic.
- [ ] Keep the page focused on UI composition and local modal state only.
- [ ] Confirm the page still builds against the refactored hooks without behavior regressions.

## Chunk 2: Business Detail Page Decomposition

### Task 4: Extract instance management hook

**Files:**
- Create: `q-devops-platform/src/pages/business-detail/useBusinessInstancesTab.ts`
- Modify: `q-devops-platform/src/pages/business-detail/BusinessDetailPage.tsx`

- [ ] Move instance query state, metahub reload logic, and create/update/delete handlers into a focused hook.
- [ ] Preserve support for both mock/local and metahub-backed modes.
- [ ] Leave `BusinessDetailPage` responsible only for wiring the hook into UI components.

### Task 5: Extract CD config management hook

**Files:**
- Create: `q-devops-platform/src/pages/business-detail/useCDConfigTab.ts`
- Modify: `q-devops-platform/src/pages/business-detail/BusinessDetailPage.tsx`

- [ ] Move CD query state, drawer state, delete modal state, and CRUD handlers into a dedicated hook.
- [ ] Centralize refresh behavior so query changes and CRUD flows do not duplicate fetch logic.
- [ ] Preserve existing drawer/modal behavior.

### Task 6: Shrink `BusinessDetailPage` to composition logic

**Files:**
- Modify: `q-devops-platform/src/pages/business-detail/BusinessDetailPage.tsx`

- [ ] Remove state and handler logic that now belongs in extracted hooks.
- [ ] Keep routing, tab selection, and high-level composition in the page component.
- [ ] Re-check that the page still supports local mock fallback behavior.

## Chunk 3: Async Request Ownership Cleanup

### Task 7: Guard CI config detail/form flows against stale responses

**Files:**
- Modify: `q-devops-platform/src/pages/business-detail/useCIConfigTab.ts`

- [ ] Add request ownership guards so only the latest relevant async response updates detail/form state.
- [ ] Reduce repeated reset logic where practical without changing the outward API.

### Task 8: Guard deploy plan detail/form flows against stale responses

**Files:**
- Modify: `q-devops-platform/src/pages/business-detail/useDeployPlanTab.ts`

- [ ] Prevent slow detail/edit requests from overwriting newer user intent.
- [ ] Keep option loading and list loading behavior intact while making the async flow easier to reason about.

## Chunk 4: Verification

### Task 9: Verify build and inspect lint state

**Files:**
- Modify: `q-devops-platform/src/pages/cicd/*`
- Modify: `q-devops-platform/src/pages/business-detail/*`

- [ ] Run `make build` in `q-devops-platform` and confirm it passes.
- [ ] Run `make lint` and record whether any remaining failures are pre-existing versus introduced by this refactor.
- [ ] Summarize residual risks if lint still reports historical issues.

# React Maintainability Refactor Design

## Goal

Improve the frontend code quality of `q-devops-platform` with a React best-practices focus on readability, componentization, and maintainable async logic, without changing user-visible behavior or introducing a new data-layer architecture.

## Scope

This refactor only targets:

- `src/pages/cicd/*`
- `src/pages/business-detail/*`
- related local hooks that currently carry long handlers, repeated state transitions, and stale async update risks

This refactor explicitly does not target:

- route-level lazy loading
- bundle-size optimization
- backend layering or API redesign
- feature additions or UI redesign

## Problems To Address

### 1. CICD async flow is hard to reason about

`CicdPage`, `useBuildWorkspace`, and `usePagedSelectOptions` currently rely on a mix of refs, unstable callbacks, and effect-driven loaders. The logic works, but the ownership of state and side effects is hard to follow, and the current lint output already shows dependency issues.

### 2. Business detail page is overloaded

`BusinessDetailPage` owns route state, tab state, CD config CRUD, instance CRUD, local mock fallbacks, metahub reload logic, and multiple modal/drawer states. The page is carrying too many responsibilities and is becoming difficult to change safely.

### 3. Async request ownership is inconsistent

Some detail/edit flows can be overwritten by slow responses from earlier requests. The code also mixes effect-triggered reloads with handler-triggered reloads, which creates duplicated fetch paths and muddles state transitions.

## Design

### A. Keep page components focused on composition

`CicdPage` and `BusinessDetailPage` should primarily assemble UI pieces and connect them to focused hooks. The hooks may still be stateful, but their responsibilities must be narrower and their async behavior explicit.

### B. Move repeated domain-specific state machines into hooks

For the business detail page, extract instance management and CD config management into dedicated hooks. The page will keep route/tab concerns, while each hook will own:

- query state
- loading state
- CRUD handlers
- reconciliation after create/update/delete

### C. Make async updates request-aware

Wherever a detail panel or form can trigger overlapping requests, guard state updates so only the latest in-scope request can update the UI. This avoids stale responses overwriting the currently active entity.

### D. Reduce duplicate fetch entry points

Prefer a single fetch path per concern. If a handler needs immediate refresh semantics, it should either:

- update the query state and let the effect reload, or
- call a shared reload function intentionally used by both effects and handlers

The goal is to stop scattering fetch behavior across both effects and event handlers in ad hoc ways.

## Expected Outcome

- Fewer overlong handlers in page files
- Clearer ownership boundaries between page composition and data/state logic
- More stable effect dependencies and reduced lint friction
- Lower risk of stale async responses corrupting drawer/form state
- Easier future component extraction without needing a larger architectural rewrite

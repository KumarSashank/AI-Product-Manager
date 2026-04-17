# Product, Public SaaS, and Research Audit

> Audit date: 2026-04-16
>
> Scope: product differentiation, public SaaS readiness, account isolation, usability, user flow, and research defensibility.

## Executive Summary

AI Product Manager already has a meaningful core idea:

- it is not just a meeting summarizer
- it tries to preserve project memory across meetings
- it tracks accountability, deadlines, blockers, and unresolved questions
- it includes a longitudinal benchmark harness instead of only subjective demo claims

That is the strongest part of the product and the clearest source of uniqueness.

The product is **promising and differentiated in concept**, but it is **not yet safe to present as a true public SaaS product** without fixing tenancy and access control in the backend.

### Bottom-line assessment

- `USP strength`: strong
- `Research potential`: strong
- `Current public SaaS readiness`: weak
- `Current demo readiness`: good if positioned honestly
- `Most urgent gap`: backend account and workspace isolation

## What Is Actually Unique Here

The product is most compelling when it is described as:

`A stateful AI Product Manager that remembers project commitments across recurring meetings and turns transcripts into accountable execution memory.`

That is more specific and more defensible than:

- AI meeting notes
- AI transcription tool
- MoM generator

### Strong uniqueness claims already supported by the repo

1. `Longitudinal project memory`
   The system is designed to process meetings sequentially and carry open items, unresolved questions, and readiness concerns forward across time.

2. `Accountability-aware synthesis`
   The product does not only summarize discussion. It explicitly models owners, due dates, missing updates, and stale blockers.

3. `Ablation-based evaluation`
   The benchmark harness compares a stateful system against a transcript-only baseline. That is a stronger research story than saying "the output looks good."

4. `Execution-oriented product framing`
   The system is closer to product operations and delivery tracking than a generic note-taking assistant.

## Current Research Story

The current research angle is not weak. It is just not framed sharply enough yet.

### Stronger thesis statement

`Project execution quality improves when meeting intelligence is stateful, accountability-aware, and evaluated longitudinally rather than as isolated single-meeting summarization.`

### Evidence already present in the codebase

- longitudinal benchmark harness: [benchmark/README.md](../benchmark/README.md)
- evaluation rubric: [docs/EVAL_RUBRIC.md](./EVAL_RUBRIC.md)
- project-memory context builder: [packages/ai-backend/src/services/productManager.service.ts](../packages/ai-backend/src/services/productManager.service.ts)
- deterministic accountability layer: [packages/ai-backend/src/lib/productManager.ts](../packages/ai-backend/src/lib/productManager.ts)

### What would make the research story much stronger

1. More benchmark scenarios across different project types
2. Gold labels for lifecycle transitions
3. Evidence traces for why an item was carried forward, resolved, or flagged overdue
4. Human evaluation by PM or engineering reviewers
5. Clear comparison against:
   - transcript-only baseline
   - single-meeting summarization baseline
   - optionally human-written meeting notes

## Public SaaS Audit

## Verdict

`Not ready for public multi-user usage yet.`

The biggest issue is that the current backend does not enforce real account or workspace isolation.

## Critical Findings

### 1. Backend auth middleware exists but is not actually registered

There is an auth middleware implementation:

- [packages/ai-backend/src/middleware/auth.middleware.ts](../packages/ai-backend/src/middleware/auth.middleware.ts)

But route registration does not attach it:

- [packages/ai-backend/src/routes/index.ts](../packages/ai-backend/src/routes/index.ts)

This means authenticated UI behavior exists, but protected backend route enforcement is effectively missing.

### 2. New users are assigned to one shared default organization

Signup currently defaults every new user to the same development organization:

- [packages/ai-backend/src/services/auth.service.ts](../packages/ai-backend/src/services/auth.service.ts)
- [packages/ai-backend/src/db/bootstrap.ts](../packages/ai-backend/src/db/bootstrap.ts)

This is acceptable for local development, but not for a real SaaS product.

### 3. Projects are not filtered by the signed-in user or workspace

Project list and create routes use all projects or the shared default org:

- [packages/ai-backend/src/routes/projects.ts](../packages/ai-backend/src/routes/projects.ts)

Examples:

- listing returns all projects
- project creation uses `DEFAULT_DEV_ORG_ID`
- route logic does not scope data through `request.user.organizationId`

### 4. Extension project list is also global

The extension route exposes project choices without workspace scoping:

- [packages/ai-backend/src/routes/extension.ts](../packages/ai-backend/src/routes/extension.ts)

For a public product, this is a privacy and tenancy problem.

### 5. Meeting APIs are organization-parameter based, not user-enforced

Meeting listing relies on passing an organization id in the URL:

- [packages/ai-backend/src/routes/meetings.ts](../packages/ai-backend/src/routes/meetings.ts)

But the route is not tied to the signed-in user’s organization in a trustworthy way.

## SaaS Readiness Scorecard

### 1. Multi-tenancy

- `Current`: weak
- `Target`: every read/write must be scoped to authenticated workspace membership

### 2. Authentication

- `Current`: partial
- `Good`: cookies, signin, signup, logout, `/auth/me`
- `Missing`: actual protected API enforcement across the app

### 3. Authorization

- `Current`: weak
- `Missing`: route-level ownership checks, organization scoping, collaborator permissions, admin/member distinction in product behavior

### 4. Workspace model

- `Current`: partial in schema, weak in execution
- `Good`: organizations, teams, projects exist in schema
- `Missing`: real workspace onboarding and organization creation flow

### 5. Public reliability

- `Current`: medium for transcript-upload demo path, weak for capture paths
- `Good`: transcript upload is the most reliable path today
- `In progress`: extension speaker-attributed capture
- `Preview only`: bot joining

## Usability Audit

## What already works well

1. The product direction is easy to explain once the user sees a project page
2. Transcript upload is a strong primary workflow
3. Project-level item workspace is much stronger than a plain MoM viewer
4. Landing page now communicates a clearer SaaS narrative
5. The UI is materially better than a hackathon-style internal tool

## What still creates friction

### 1. The product promise is broader than the safest workflow

The landing page and app suggest multiple capture methods, but the truly dependable workflow is still transcript upload.

That is okay, but the product should deliberately funnel new users toward the path that works best.

### 2. Signup does not feel like workspace creation

The UI says `Create your workspace account`, but the backend currently creates a user inside a shared default organization instead of creating a real new workspace.

That creates a trust gap.

### 3. The dashboard entry point is still project-centric, not outcome-centric

For public users, a better first-run experience would likely be:

1. create workspace
2. create first project
3. choose capture method
4. upload transcript or connect extension
5. review MoM and items
6. update status and continue next meeting

### 4. Some routes are still development-shaped rather than product-shaped

Examples:

- explicit organization ids in routes
- development organization fallback
- preview-stage capture methods exposed alongside the most reliable workflow

## Current User Flow Audit

## Best current flow

1. Sign up
2. Land in projects
3. Create project
4. Upload transcript
5. Review generated MoM and extracted items
6. Update item statuses in the workspace
7. Re-upload or add future meeting transcripts to preserve continuity

This is the workflow that should be used in any serious demo today.

## Weak flow for public users

1. Sign up
2. Expect isolated personal workspace
3. Interact with globally shared data model underneath

This is the single largest mismatch between product appearance and system behavior.

## Product Positioning Audit

## What the product should not be pitched as

- AI meeting notes app
- note summarizer
- transcription viewer

Those categories are crowded and easy to dismiss.

## What the product should be pitched as

`AI Product Manager for recurring delivery execution`

Or:

`Execution memory for product and engineering teams`

Or:

`A longitudinal meeting intelligence system that preserves accountability across time`

These make the project:

- narrower
- more credible
- more researchable
- more defensible

## Public Demo Positioning

For a live showcase, the safest and strongest message is:

### Stable today

- transcript upload
- project memory across meetings
- PM-style MoM generation
- owner-aware item extraction
- accountability tracking in the project workspace
- benchmark-backed comparison against transcript-only baseline

### In progress

- Chrome extension speaker-attributed transcript extraction
- production-grade multi-speaker caption reliability

### Preview only

- bot-based Google Meet joining

This makes the product look intentional, not unfinished.

## What Must Change Before Calling It Public SaaS

## Priority 0: tenancy and access control

This is the highest-priority product issue.

### Required fixes

1. Register auth middleware globally
2. Scope every protected route to `request.user`
3. Stop using `DEFAULT_DEV_ORG_ID` for real signup flows
4. Create a real workspace/organization on signup
5. Filter projects, meetings, items, MoMs, and extension routes by workspace membership
6. Reintroduce or complete collaborator / team membership logic

Without this, the product is not truly multi-user or public-safe.

## Priority 1: onboarding and first-use experience

### Recommended changes

1. Signup should create a workspace, not just a user
2. First login should route to a guided empty state:
   - create project
   - choose transcript upload first
   - explain what happens next
3. Strongly recommend transcript upload as the default onboarding path

## Priority 2: research proof and differentiation

### Recommended changes

1. Add more scenarios
2. Add one deeper research dashboard or report
3. Show evidence trace for each carried-forward item
4. Add one visual that proves:
   - what was introduced
   - what stayed open
   - what was resolved
   - what became overdue

That would make the system feel much more novel and defensible.

## Priority 3: public-product polish

### Recommended changes

1. Workspace settings
2. Invite collaborator flow
3. Usage states and processing states across capture methods
4. Better error handling and retry guidance
5. Public-facing docs for:
   - security model
   - supported capture methods
   - product limitations

## Recommended Narrative For Pitch, Demo, and Report

Use a three-part narrative:

### 1. Problem

Teams hold recurring meetings, but normal AI note tools forget prior commitments, blur ownership, and fail to help teams execute better over time.

### 2. System insight

Meeting intelligence should be stateful.
It should remember prior commitments, unresolved questions, deadlines, blockers, and ownership structure.

### 3. Contribution

AI Product Manager combines:

- transcript parsing
- project memory
- accountability-aware extraction
- longitudinal evaluation

to move from note generation toward execution support.

## Recommended Roadmap

## Phase 1: Make it real SaaS

1. Enforce auth middleware
2. Create real workspace-on-signup flow
3. Scope all queries by workspace membership
4. Add collaborator permissions

## Phase 2: Make it obviously useful

1. Improve first-run onboarding
2. Add evidence trail for every item and transition
3. Add project health and accountability dashboard
4. Make transcript upload and recurring project review frictionless

## Phase 3: Make it obviously research-grade

1. Expand benchmark scenarios
2. Add gold labels and transition scoring
3. Run human evaluation
4. Publish comparison tables and ablations

## Final Verdict

This project is **not ordinary**. The core idea is better than a generic meeting assistant, and the benchmark structure already points in a research direction that many student projects do not reach.

The main thing holding it back is not lack of uniqueness.

The main thing holding it back is that the system still behaves like an advanced prototype where the product surface has evolved faster than the backend tenancy model.

### Strongest honest statement today

`This is a differentiated AI Product Manager prototype with a credible longitudinal execution-memory thesis, a meaningful benchmark harness, and a strong path to becoming a real public SaaS product once workspace isolation and permissions are enforced end to end.`

### What to do next

If the goal is to make people say "this is more than a class project," the next build priority should be:

1. real account/workspace isolation
2. evidence-backed project-memory UX
3. stronger research evaluation outputs

That combination is the path from "good demo" to "serious product and research contribution."

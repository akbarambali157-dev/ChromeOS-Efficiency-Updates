# Product Roadmap — ChromeOS Efficiency Updates

**Current stable baseline:** 5.7.0 (merged 19 November 2026)  
**Architecture baseline:** Manifest V3, minimum Chrome 103, plain HTML/CSS/JavaScript, no build step or third-party runtime dependency  
**Hardware target:** low-memory Chromebook (approximately 2 GB RAM)  
**Planning rule:** roadmap milestones are gated by architecture contracts, tests, CI and target-device QA. One-hour user QA windows apply between task handoffs; no automatic next task starts without the required review/approval.

## Product direction

Build one coherent, local-first AI productivity environment from independently lazy-loaded workspaces. The system should combine creative references and experiments, AI teams and agents, research notebooks, personal knowledge, learning tools and developer workflows through shared services—not by merging all features into one large application.

Inspirations are patterns, not instructions to clone products:
- **Obsidian / Second Brain:** linked notes, backlinks, tags and personal knowledge.
- **NotebookLM:** source-grounded notebooks, evidence-linked answers and citations.
- **Anki:** active recall and spaced repetition.
- **Graphify-style workflows:** typed relationships and derived knowledge graphs.
- **Agent/skill systems:** bounded tools, explicit capabilities, resumable task stages and approval gates.
- **JEV:** unresolved reference; do not infer product requirements until the intended project/product is identified.

## Current foundation

### 5.6.0 — Creative Library
Merged foundation for local references, metadata, collections and style profiles using IndexedDB. Binary blobs are separate from metadata. Provider-bound text analysis is user-initiated and bounded; image/video/PDF binaries are not uploaded by this feature.

### 5.7.0 — Recreation Lab
Merged 19 November 2026. Adds a lazy-loaded experiment workspace sharing the Creative Library database, bounded experiments and scorecards, explicit per-run provider confirmation, local persistence and privacy/migration/scoring tests. Original binary assets remain local. This is not image understanding, exact visual recreation or model training.

## Architecture-first framework

Before feature implementation, the cross-workspace framework is documented in **ROADMAP-ARCHITECTURE-FRAMEWORK.md**. It defines:
- workspace ownership and shared service boundaries;
- versioned knowledge-item and provenance envelopes;
- Knowledge Service search/retrieval contracts;
- inspectable, consent-gated provider context packets;
- provider gateway and task orchestration contracts;
- storage/migration, privacy, security and resource budgets;
- verification matrix and release gates.

This framework phase is documentation and contract design only. No new feature implementation, framework migration, permission or dependency is included.

## Planned releases

### 5.8.0 — Video Studio Evolution
**Goal:** connect existing creative references to the current video production workflow without rewriting Video Studio.

Scope:
- link Creative Library references to storyboards and scenes by stable IDs;
- improve script-to-scene breakdown, shot presets, scene descriptions, transitions and production briefs;
- preserve the existing storyboard, scene management, Writers' Room, local persistence, preview and WebM export;
- maintain bounded preview/export and incremental source handling;
- keep remote processing opt-in and clearly disclosed.

Acceptance:
- old projects open and remain editable;
- save/reload, storyboard export, preview and WebM export regression tests pass;
- no full source-video decode into memory;
- Chrome 103 compatibility and low-memory device QA recorded.

### 5.9.0 — Shared Knowledge Foundation
**Goal:** connect Creative Library, Recreation Lab, AI Team and Video Studio through one reusable, user-controlled knowledge layer.

Scope:
- versioned knowledge records for notes, references, project decisions, findings and experiments;
- provenance, source references, verification status, visibility and typed relationships;
- local search/retrieval with bounded results and snippets;
- explicit context packets so AI Team can retrieve relevant knowledge instead of requiring repeated manual explanations;
- user review for AI-proposed summaries, links, tags and knowledge updates;
- no automatic model training.

Acceptance:
- Creative Library and Recreation Lab records can be retrieved through documented APIs without exposing raw IndexedDB internals;
- AI Team uses relevant, permission-eligible knowledge with source attribution;
- provider transfer requires consent and sends only selected bounded context;
- schema migration, deletion, export/import, privacy and cross-workspace regression tests pass.

### 6.0.0 — Agent Orchestrator and Unified AI Core
**Goal:** make multi-step AI work reliable, observable and recoverable.

Scope:
- researcher, planner, creator, analyst and reviewer task contracts;
- bounded stage graphs, dependencies, progress, cancellation, checkpoints and resumability;
- provider capability detection, routing, response normalization, context budgeting, continuation, usage and diagnostics behind a shared Provider Gateway;
- visible provider identity and fallback behavior;
- approval checkpoints for consequential actions.

Acceptance:
- failed or incomplete stages are never reported as successful;
- cancellation and recovery tests pass;
- retries are bounded and non-idempotent actions are not replayed blindly;
- existing provider integrations continue to work during incremental migration.

### 6.1.0 — Project Memory, Research Notebooks and Personal Wiki
**Goal:** make useful knowledge persist and remain traceable across sessions and projects.

Scope:
- project-scoped decisions, constraints, summaries and searchable history;
- notebook-style source collections, selected excerpts, questions and evidence-linked answers;
- plain-text-first personal wiki with backlinks, tags and typed relations;
- derived, bounded knowledge graph views;
- user-controlled memory visibility and retention.

Acceptance:
- generated claims link to source passages where available and identify evidence gaps where not;
- full history and full documents are never sent by default;
- corrections, source changes, export/import and deletion preserve provenance;
- inferred graph links remain labelled as suggestions until accepted.

### 6.2.0 — Learning System and Autonomous Developer Workspace
**Goal:** support structured learning and safer multi-file development workflows.

Scope:
- Anki-style flashcards, active recall and deterministic spaced-repetition scheduling;
- source-linked, user-reviewed generated cards;
- repository exploration, scoped multi-file plans, reviewed diffs, supported tests and regression reports;
- approval-bound commit/PR preparation and rollback/history.

Acceptance:
- scheduling algorithm has deterministic unit tests and exportable local state;
- developer proposals bind to repository, branch, base commit and file snapshots;
- changed snapshots invalidate prior approvals;
- no automatic merge, destructive operation, secret access or deployment without explicit authorization.

### 7.0.0 — Unified Productivity Environment
**Goal:** integrate research, creative production, development, tasks, notes, reminders, learning and export in a modular dashboard.

Scope:
- shared navigation and cross-workspace search;
- workspace registration metadata and lifecycle hooks;
- views that link to owning records rather than duplicate them;
- lazy-loaded modules, user-triggered bounded tasks and accessible responsive UI.

Acceptance:
- existing workspaces remain independently usable;
- no monolithic rewrite or always-on agent loop;
- performance, memory, accessibility and compatibility budgets remain within agreed limits.

## Global release gates

Every milestone must:
1. audit the current main branch and identify affected interfaces;
2. preserve Manifest V3, Chrome 103 and the low-memory Chromebook target;
3. avoid new frameworks, dependencies and permissions unless separately justified and approved;
4. define schema versions, migration, rollback and retention before storage changes;
5. bound file sizes, extracted text, context, output, concurrency, retries and rendered lists;
6. require explicit consent for provider-bound private data;
7. include syntax, unit, contract, storage, privacy and regression tests;
8. pass GitHub Actions CI on the actual PR head;
9. report mocked tests, live-provider tests and Chromebook QA separately;
10. keep the PR open if required checks or manual device tests remain unverified;
11. use one-hour QA intervals for user test/feedback handoffs, and wait for explicit approval before starting the next gated task.

## Current status and next action

- 5.7.0 is merged into main.
- The framework documentation is being prepared on a dedicated branch.
- 5.8.0 implementation should begin only after the framework documentation PR passes validation and is reviewed.
- Later milestone features are planned, not implemented.

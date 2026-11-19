# Roadmap Architecture Framework

**Status:** design contract only; no feature implementation is authorized by this document.
**Baseline:** version 5.7.0; Manifest V3; minimum Chrome 103.
**Runtime:** plain HTML, CSS and JavaScript; no build step or third-party runtime dependency.
**Target:** low-memory Chromebook, approximately 2 GB RAM.

## 1. Purpose and non-goals

This document defines shared contracts for future Video Studio, AI Team, Creative Library, Recreation Lab, research, memory, learning and developer workflows. Its purpose is to make these workspaces interoperable without tightly coupling them.

This is an architecture framework, not a rewrite plan. Existing working modules remain authoritative until a specific release migrates a clearly identified responsibility. No framework migration, model training, always-on agent loop or wholesale replacement of existing workspaces is implied.

## 2. Non-negotiable principles

1. **Local-first:** notes, references, project memory, experiments, flashcards and workflow state remain on-device by default.
2. **Explicit transfer:** only minimum selected context is sent to a provider after clear consent naming the provider, purpose and data categories.
3. **Provenance:** every knowledge item records its origin, creation/update time, source lineage and verification state.
4. **Small modules:** workspaces own their UI and domain logic; shared services expose narrow documented APIs.
5. **Lazy loading:** a workspace and heavier dependencies load only when opened or required.
6. **Bounded work:** cap input sizes, result counts, concurrency, retries, history, rendered rows and memory use.
7. **Resumable and cancellable:** long workflows persist stage state and stop cleanly on cancellation, timeout, provider failure or navigation.
8. **Human approval:** file writes, repository changes, external publication, destructive actions and sensitive data transfers require review.
9. **Graceful degradation:** provider, quota, network and storage failures produce actionable diagnostics and preserve recoverable work.
10. **No model-training claims:** stored records improve retrieval and task context; they do not update a provider model's weights.

## 3. Layered architecture

### A. Workspace presentation layer

Owns navigation, workspace-specific rendering, user input, accessibility and view lifecycle. It includes existing Chat, AI Team, Video Studio, Creative Library, Recreation Lab and GitHub/developer experiences, plus planned Research Notebooks, Personal Wiki, Learning and productivity views.

Workspaces must not directly read another workspace's private storage schema. They use documented shared service APIs.

### B. Shared application services

| Service | Responsibility | Boundary |
| --- | --- | --- |
| Provider Gateway | Provider capability metadata, routing, normalization, continuation, cancellation, diagnostics and usage | Never hide provider identity or silently broaden context |
| Context Builder | Select, rank, deduplicate and budget task context | Never attach all history or library content by default |
| Knowledge Service | Search and retrieve approved notes, references, decisions, experiments and source extracts | Never present unverified generated content as fact |
| Provenance Service | Source identity, origin, timestamps, citations, version and verification | Never invent citations or erase lineage |
| Task Orchestrator | Stage dependencies, progress, retries, checkpoints and cancellation | Never mark incomplete work successful |
| Consent Gate | Explain data categories, destination, provider and purpose | Never bundle unrelated data or obscure consent |
| Storage Adapters | Versioned persistence and migrations | Never expose raw database handles to workspace UI |
| Diagnostics | Structured error codes, stage IDs, safe metadata and recovery guidance | Never log credentials or private source contents by default |
| Export/Import | Validated portable formats with limits and schema versions | Never import untrusted data without validation |

### C. Persistence domains

Use existing Chrome storage and IndexedDB patterns. Prefer domain-owned stores or namespaced records; do not create a catch-all unbounded store.

Logical domains:
- **Creative:** asset metadata, collections, style profiles and experiment records; binary blobs remain separate.
- **Knowledge:** notes, pages, links, tags, source records, claims and derived indexes.
- **Research:** notebooks, source metadata, extracted passages, questions and answer records.
- **Projects:** requirements, decisions, summaries, milestones and activity references.
- **Learning:** decks, cards, review history and scheduler state.
- **Tasks:** orchestrator runs, stage checkpoints, approvals and cancellation state.
- **Developer:** repository snapshots, proposed edits, validation results and approval records.

These are logical boundaries, not an instruction to create all stores immediately. Each release must justify schema, quota, migration and cleanup before implementation.

## 4. Shared data and API contracts

### 4.1 Knowledge item envelope

Shared records use a versioned envelope containing:
- stable opaque ID and integer schema version;
- kind: note, reference, source, excerpt, decision, experiment, finding, flashcard or workflow artifact;
- bounded title and bounded text content, or a typed pointer to local content;
- origin: user, imported, provider-generated or workspace-generated;
- source references and timestamps;
- verification: unreviewed, user-confirmed, source-supported, tested or rejected;
- visibility: private-local, project-shared or explicitly approved for provider use;
- bounded normalized tags and typed relations such as derived-from, supports, contradicts, references or supersedes.

Do not copy binary files into this envelope. Store a local asset ID and retrieve a blob only for an explicitly supported local operation.

### 4.2 Knowledge Service

Expose narrow operations conceptually equivalent to search, get, list-related, save, update and archive. Validate ownership, shape, text size and schema version. Search returns snippets and provenance first; full content loads only when required. No workspace receives unrestricted database access.

### 4.3 Provider context packet

A provider-bound packet contains task purpose, requested output, selected project constraints, selected knowledge snippets with source IDs/citations, selected reference metadata, context budget/truncation summary and a consent record identifying provider, destination and data categories.

The packet must be inspectable before transfer when private or external data is involved. Relevance is not permission: visibility and consent rules are checked separately.

### 4.4 Agent and skill manifest

A skill is a versioned manifest, not arbitrary remote executable code. It declares name/version, input/output schema, required capabilities, permitted tools, network/data disclosures, resource budget, timeout, side-effect classification, approval checkpoints, tests and compatibility range.

Agents propose actions through an allow-listed tool registry. Each tool validates arguments, bounds output, declares side effects and supports cancellation. Skills do not gain ambient access to credentials or arbitrary extension APIs.

## 5. Framework for each roadmap area

### 5.1 Video Studio Evolution

- Preserve existing storyboard, scenes, Writers' Room, local persistence, preview and WebM export.
- Add adapters from Creative Library references to storyboard/scene records; link by IDs and metadata, do not duplicate binary assets.
- Script-to-scene and shot suggestions are reviewable proposals with source/reference links.
- Keep preview/export bounded by duration, frame rate, dimensions and memory.
- Never decode an entire source video into memory. Selected-frame or remote-processing paths need separate capability support and explicit consent.
- Regression coverage: open old projects, edit scenes, autosave/reload, storyboard export, preview and WebM export.

### 5.2 Shared Knowledge Foundation and Personal Wiki

- Separate project memory from general personal notes and creative references.
- Store decisions, constraints, summaries, tasks and links as versioned knowledge items with provenance and visibility.
- Retrieval is selective and task-scoped; never inject full history by default.
- Support correction, archive, export, import, retention limits and conflict handling.
- Graph edges are typed and derived from explicit links or reviewable suggestions; inferred links are never presented as confirmed facts.
- Generated content remains labelled until confirmed or supported by sources.
- Obsidian/Second Brain/Graphify-inspired capabilities should be implemented as notes, backlinks, tags, typed relations and bounded derived graph views—not as a separate competing database.

### 5.3 Research Notebooks / Notebook-style workflows

- A notebook groups sources, source metadata, user questions, extracted passages, generated answers and citations.
- Every answer claim links to source passage IDs; where evidence is absent, identify the gap rather than fabricate citations.
- Source import is user-selected and local. Supported formats, parsing limits, page/character limits and quotas are explicit.
- Provider requests include selected excerpts and metadata after consent; full documents are not sent by default.
- Preserve source identity/version so changed sources can qualify or invalidate prior answers.

### 5.4 AI Agent Orchestrator

- Represent a run as a bounded directed acyclic stage graph with stable run/stage IDs.
- Each stage defines input/output schema, dependencies, timeout, retry budget, cancellation state, progress and diagnostics.
- Persist checkpoints around external calls; partial outputs have explicit incomplete status.
- Enforce concurrency and total-run budgets suitable for low-memory devices.
- Approval gates precede file writes, external publication, destructive operations and sensitive provider transfers.
- Resume only from validated checkpoints; do not replay non-idempotent side effects without checking recorded outcome.

### 5.5 Unified AI Core

- Consolidate incrementally behind the Provider Gateway; retain working provider adapters during migration.
- Normalize text, structured output, streaming, usage, stop reason, token-limit/truncation, timeout and provider errors.
- Centralize continuation, bounded retry, cancellation, context budgeting and diagnostic codes.
- Capability detection is explicit and cached conservatively; unsupported features are disabled with explanation.
- Provider fallback is visible and cannot bypass consent or broaden the context packet.
- Tests cover empty/malformed/partial output, token-limit continuation, cancellation, rate limits and provider response shapes.

### 5.6 Advanced Project Memory

- Persist editable project decisions, requirements, summaries and searchable history using the shared knowledge envelope.
- Keep project memory distinct from personal notes and workspace settings.
- Retrieval is task-scoped; users choose what may enter provider requests.
- Include conflict handling, version history, archive and export/import.
- Do not claim the model itself has learned or changed.

### 5.7 Learning / Anki-style workflows

- Cards have stable IDs, prompt/answer, source links, tags and versioned scheduling state.
- Scheduling logic is isolated and deterministic, with tests for due dates, intervals, resets and timezone boundaries.
- Reviews are user-initiated; no background polling is needed.
- Progress is local and exportable. AI-generated cards require review before joining a deck.
- Daily queues and review rendering are bounded.

### 5.8 Personal Wiki and Graphify-style workflows

- Plain-text-first notes, locally persisted; links/backlinks are indexed incrementally.
- Graph view is derived and bounded; large libraries do not load every node/edge at once.
- Search, tags, backlinks and relations work without graph visualization.
- AI-generated links, summaries and tags are proposals with provenance and user acceptance.
- JEV remains an unresolved reference; do not infer requirements until the intended product is identified.

### 5.9 Autonomous Developer Workspace

- Extend the existing reviewed-edit model; never bypass it.
- Pipeline: repository inspection → scoped plan → proposed patch → diff review → tests → regression summary → explicit approval → commit/PR preparation.
- Bind each proposal to repository, branch, base commit and file snapshot; invalidate approval when any changes.
- Distinguish static checks, unit tests, CI, live-provider tests and target-device QA.
- No automatic merge, destructive git operation, secret access or production deployment without explicit authorization.
- Preserve rollback/history and report partial failures.

### 5.10 Unified Productivity Environment

- Dashboard is a navigation/orchestration surface, not a monolithic rewrite.
- Workspaces register metadata and lifecycle hooks; modules remain lazy-loaded.
- Shared tasks, notes, reminders, research and project views link to owning records instead of duplicating them.
- Cross-workspace search respects visibility and permission boundaries.
- Avoid always-on agents and recurring polling; use user-triggered or explicitly scheduled bounded jobs.
- Preserve keyboard/touch behavior, reduced motion, accessibility and responsive layouts.

## 6. Privacy, security and untrusted data

- Consent names provider/model where known, purpose, destination and exact data categories.
- Default to metadata/snippets rather than full source contents.
- Credentials remain in credential storage and never enter exports, logs, knowledge items or context packets.
- Imported content is untrusted data, never executable instructions; it cannot redefine tool permissions.
- Render untrusted text with text nodes/textContent; do not render untrusted HTML.
- Validate messages among extension pages, sandboxed mini-apps and service worker using source/origin, nonce, app identity and allow-listed schemas.
- Bound records, file sizes, extraction, graph traversal, context, output, concurrency and retention.
- Define deletion/export semantics for derived records and source lineage.
- Storage quota errors must not automatically delete existing data.

## 7. Versioning and migration

1. Every persisted domain has a schema version and documented owner.
2. Migrations are additive where possible and transactional.
3. Preserve existing stores, keys and records; never reuse a schema version for a different shape.
4. Migrations are idempotent or have a durable completion marker.
5. Validate before commit and retain a recovery path for failure.
6. Test fresh install, previous-version upgrade, oldest-supported upgrade, interrupted migration and malformed records.
7. Do not bump manifest version until release gates pass.

## 8. Performance and compatibility budgets

- Keep Manifest V3 and Chrome 103 minimum unless a separately approved compatibility change is required.
- No new framework, build step, runtime dependency, extension permission or host permission by default.
- Lazy-load workspaces and defer non-critical work until interaction/idle time.
- Paginate or virtualize large lists; cap graph nodes and edges.
- Use IndexedDB for structured collections and binary blobs; do not put large payloads in chrome.storage.local.
- Avoid duplicate copies of source text and binary data.
- Bound provider calls, retries, concurrent stages, extracted text and rendered output.
- Measure target-device CPU, memory, startup and interaction; unit tests do not prove device performance.

## 9. Required verification and release gates

| Gate | Required evidence |
| --- | --- |
| Static integrity | JavaScript syntax, manifest JSON, HTML/CSS checks |
| Unit tests | Pure algorithms, validation, scheduling and transforms |
| Contract tests | Workspace APIs, provider adapters, tool schemas and context packets |
| Storage tests | Fresh schema, upgrade, recovery, limits and corrupt data |
| Privacy tests | Consent, data minimization, no binary leakage and secret redaction |
| Regression tests | Chat, AI Team, Creative Library, Recreation Lab, Video Studio and navigation |
| CI | Successful GitHub Actions run for the actual PR head |
| Provider tests | Mocked versus live-provider results labelled separately |
| Device QA | Actual ChromeOS 103 / low-memory Chromebook report |
| Review | Diff, migration plan, rollback plan and known limitations |

A passing unit test is not proof of provider behavior or Chromebook performance. CI and manual device QA must be reported separately.

## 10. Delivery sequence

1. **Framework baseline (this phase):** agree shared contracts, ownership, boundaries, budgets and test matrix. Documentation only.
2. **5.8 Video Studio Evolution:** apply reference adapters and production workflow contracts without unrelated workspace changes.
3. **5.9 Shared Knowledge Foundation:** implement versioned knowledge records, provenance, search/retrieval and explicit context packets; connect Creative Library, Recreation Lab and AI Team.
4. **6.0 Agent Orchestrator and Unified AI Core:** stage graph, provider gateway, cancellation, resumability, diagnostics and visible routing.
5. **6.1 Project Memory, Research Notebooks and Personal Wiki:** build on shared knowledge and source provenance.
6. **6.2 Learning System and Autonomous Developer Workspace:** deterministic learning records and approval-bound repository workflows.
7. **7.0 Unified Productivity Environment:** integrate workspaces through metadata and shared services; do not merge internal implementations.

The order may be adjusted after framework review, but later milestones must not introduce a parallel knowledge store, provider gateway, consent mechanism or task runner without documenting why reuse is unsuitable.

## 11. Framework completion criteria

- This document and the release roadmap agree on scope and sequence.
- ARCHITECTURE.md links to this framework and states the 5.7.0 baseline.
- Workspace ownership and API boundaries are documented.
- Schemas, migration rules, privacy rules and resource budgets are defined.
- Test and QA matrix is included in milestone acceptance criteria.
- Unresolved references, including JEV, are marked explicitly.
- A documentation-only PR passes repository validation.

No feature implementation is included in this phase.

# Creative Library 5.6.0 and the next roadmap

## 5.6.0 candidate

Adds a lazy-loaded local reference workspace for PNG/JPEG/WebP images, MP4/WebM video, TXT/Markdown text and PDFs. Asset metadata, collections and style profiles live in IndexedDB; binary Blobs use a separate store. Users can search/filter, add descriptions/tags, create collections and reusable prompt profiles, and associate references with existing projects. Only the selected asset is previewed. Video previews request metadata only. Text analysis sends at most 12,000 characters and requires a per-action confirmation. Images, videos and PDFs are not uploaded; PDF extraction and multimodal analysis are not included because the existing provider bridge is text-only. The feature does not train model weights.

Limits: 500 metadata records, 8 files per import batch, 15 MiB per image, 50 MiB per video, 2 MiB per text file and 20 MiB per PDF. No new extension permission, dependency, build step or background polling.

## 5.7.0 — Recreation Lab

Use selected references and style profiles for structured experiments, user-defined comparison criteria, saved experiments and side-by-side result notes. Visual extraction or image upload must wait for a provider capability contract and explicit per-action consent. Do not claim model training.

## 5.8.0 — Video Studio Evolution

Connect library references to storyboards, script-to-scene breakdown, shot presets, scene descriptions, transitions and production briefs. Preserve existing animatic and Writers' Room recovery. Never decode an entire source video locally; process metadata and selected frames incrementally or use an explicitly approved remote capability.

## 5.9.0 — AI Agent Orchestrator

Add explicit researcher, planner, creator, analyst and reviewer task contracts, dependencies, progress, cancellation, resumable stages and approval checkpoints. Never report success for failed or incomplete stages.

## 6.0.0 — Unified AI Core

Incrementally consolidate provider capability detection, routing, context compression, continuation, cancellation, diagnostics and usage tracking. Reuse working code; make fallback visible and respect provider permissions.

## 6.1.0 — Advanced Project Memory

Add editable project-scoped decisions, requirements, summaries and searchable history. Let users choose what enters a request; do not send full history by default.

## 6.2.0 — Autonomous Developer Workspace

Extend reviewed file edits with repository exploration, multi-file plans, supported tests, regression review, history and commit/PR preparation. Require approval before risky writes.

## 7.0.0 — Unified Productivity Environment

Unify research, creative production, development, tasks, notes, reminders and export in a modular dashboard. Lazy-load modules and avoid persistent polling.

## Release gates

Audit main before each milestone; preserve MV3/Chrome 103/2 GB constraints; bound file, metadata, context and rendered-list sizes; use IndexedDB for binaries; require explicit consent for provider transfers; run syntax/unit/contract/regression tests and CI; review the actual diff; record target-device performance and manual QA separately; leave PRs open when required checks or device tests remain unverified.
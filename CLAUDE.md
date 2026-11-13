# Architecture rules

- Read ARCHITECTURE.md before changing source files. Preserve the documented page/module boundaries, storage ownership, message contracts, Manifest V3 and minimum Chrome 103 compatibility.
- Keep truly shared helpers in common.js or the existing shared module that owns the behaviour. Do not merge page-local helpers merely because their names match; check semantics and execution context first.
- Preserve existing storage keys and formats unless a deliberate migration is part of the release. Keep credentials out of backups and logs.
- Do not add dependencies, frameworks, permissions, recurring background work or build steps without a demonstrated need.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

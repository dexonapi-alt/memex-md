# Changelog

All notable changes to `memex-md` are documented here. This project follows [Semantic Versioning](https://semver.org/) and the format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

Nothing yet.

## [0.5.1] — 2026-04-20

### Added

- **`/memex:apply-plan <filename-or-slug>`** — executes a plan previously written by `/memex:plan`, step by step: reads the plan + knowledge-base context, confirms before acting, walks through `## Implementation order`, stops on first failure, updates the plan's `Status` to `implemented (<date>)` on success, appends a `## Completion notes` section describing any deviations, and captures any new patterns/gotchas/decisions discovered during execution back into `.claude/knowledge/`. Closes the loop: `/memex:plan` → review → `/memex:apply-plan` → learnings back into KB.

### Changed

- `/memex:plan`'s final message now points at `/memex:apply-plan` as the natural next step (previously it said the command was "coming in a future release").
- `init` output now reports 4 slash commands installed (was 3).
- CLAUDE.md block's slash-command list now includes `/memex:apply-plan`.

## [0.5.0] — 2026-04-20

The "slash commands" release. Adds a `/memex:*` namespace inside Claude Code so the knowledge base, plans, and preferences get a first-class entry point shared across the team.

### Added

- **`/memex:preference "<text>"`** (slash command) — classifies the preference as project-level or user-level, then routes: project → CLAUDE.md `## Preferences` section; user → Claude's auto-memory. Scaffolded by `init` at `.claude/commands/memex/preference.md`.
- **`/memex:fix "<description>"`** (slash command) — captures a just-resolved bug as a `gotchas.md` entry with Symptom / Root cause / Fix / Prevention. Scaffolded at `.claude/commands/memex/fix.md`.
- **`/memex:plan "<task>"`** (slash command) — reads knowledge base + scans codebase, then writes a full design plan to `.claude/plans/<date>-<slug>.md` (Goal / Context / Affected files / Migrations / Hooks / Dependencies / Risks / Implementation order / Verification) and updates a plans index. Scaffolded at `.claude/commands/memex/plan.md`.
- **`memex-md preference "<text>"`** (CLI) — underlying command that appends a bullet to `CLAUDE.md`'s `## Preferences` section. Idempotent: won't duplicate an existing bullet. Creates the section if missing. Alias: `memex-md pref`.
- **`.claude/plans/` directory with `INDEX.md` seed** — new home for design artifacts created by `/memex:plan`. Git-tracked like the rest of memex-md.
- **"Re-read rule" in `CLAUDE.md` block** — explicit instruction telling Claude that after ANY `/memex:*` command or `memex-md` CLI invocation, the disk state has changed, and Claude must re-read the affected INDEX.md / scope / plan file before its next substantive response. Closes the "Claude forgets what was just written" gap.
- **Slash-command reference in the CLAUDE.md block** — points Claude at `/memex:preference`, `/memex:fix`, `/memex:plan` with short descriptions.
- 5 new tests in `test/preference.test.js` (CLI correctness, idempotency, multi-entry, empty input, `pref` alias).
- 4 new tests in `test/slash-commands.test.js` (slash command files installed, plans INDEX seeded, init output, CLAUDE.md block content).

### Changed

- **`init` now scaffolds** `.claude/commands/memex/` and `.claude/plans/` in addition to everything prior releases installed.
- **CLAUDE.md block rewritten** — merges the existing memory-routing rule with the new re-read rule, consult checklist (knowledge INDEX → plans INDEX → preferences), slash command reference, and CLI reference. `--force` on `init` updates the block in place.

## [0.4.0] — 2026-04-20

The "never miss a moment" release. Turns knowledge capture from a discipline problem into a reflex.

### Added

- **Stop hook for auto-drafting** — new `--auto` flag on `init` registers a Claude Code `Stop` hook that fires at the end of every response. The hook invokes `memex-md draft --working --auto` which:
  - Reads the working tree diff silently.
  - Asks Claude (`claude -p`) whether any knowledge entries are warranted.
  - If Claude returns `NO_ENTRIES_NEEDED`: silent no-op.
  - If Claude proposes entries: writes them to `.claude/knowledge/<scope>.md` and prints one stderr line — *"wrote N entries — review with `git diff .claude/knowledge/`"*.
  - Never aborts the Stop hook chain: all failures (missing binary, git errors, Claude timeout) degrade to silent returns.
  - You review entries via `git diff` and commit or `git checkout --` to discard.
- **`--auto` flag on `draft`** — makes draft non-fatal, non-interactive, and silent on no-op. Implies `--write`. Designed for hook use but usable standalone.

### Usage

Enable Stop-hook auto-draft on a new or existing repo:

\`\`\`
npx memex-md init --auto --force
\`\`\`

Disable later by removing the `Stop` entry from `.claude/settings.json`.

## [0.3.2] — 2026-04-20

### Fixed

- **Repo-level facts no longer drift into Claude's machine-local auto-memory.** Live testing showed Claude's auto-memory was capturing repo-level preferences (*"Our repo uses functional components"*) to `~/.claude/projects/.../memory/` — per-machine, not git-tracked, invisible to teammates. Root cause: the `CLAUDE.md` block pointed Claude at `.claude/knowledge/` but didn't claim territorial authority over repo-level facts, so Claude's built-in auto-memory classifier fired first.
  - `CLAUDE.md` block (managed by `init`) now opens with a **"Memory routing rule — READ FIRST"** section: a table mapping fact types to stores, an explicit *"DO NOT use auto-memory for repo-level facts"* rule, and an instruction telling Claude to verbalize the choice (*"Saving this to .claude/knowledge/patterns.md"* vs *"Saving this to machine memory"*).
  - The `knowledge-update` skill gets the same routing rule up top, with assertive language: *"If unsure, default to `.claude/knowledge/`."*

### Added

- **`memex-md promote` command** — migrate repo-level entries already captured in machine memory (`~/.claude/projects/<slug>/memory/`) into `.claude/knowledge/`. Interactive by default with [k/x/d/p/g/a/l] prompts; `--list` audits without prompts, `--dry-run` previews without writing, `--all` classifies automatically by frontmatter type (project→decisions, feedback→patterns, reference→architecture, user→keep). Deletes promoted source files and prunes their `MEMORY.md` index entries.
- 4 new tests in `test/promote.test.js` covering the no-memory, `--list`, `--all --dry-run`, and `--all` paths.

## [0.3.1] — 2026-04-20

### Fixed

- **`init` now bootstraps `CLAUDE.md`** — previously the knowledge base was invisible to Claude at session start because Claude Code only auto-loads `CLAUDE.md`, not arbitrary files under `.claude/knowledge/`. `init` now creates or appends a fenced block (between `<!-- memex-md:start -->` and `<!-- memex-md:end -->`) in the repo's `CLAUDE.md` that points Claude at the knowledge base and documents the update workflow. The block is idempotent — re-running `init` won't duplicate it. `--force` replaces the block in place when its content drifts.

### Added

- 4 new tests (`test/claude-md.test.js`) covering all four bootstrap paths: create, append to existing, idempotent re-run, `--force` block replacement.

## [0.3.0] — 2026-04-20

The "team discipline" release. Project was renamed from `claude-memex` to `memex-md` (the `claude-memex` npm name was already taken by an unrelated MCP-based memory tool).

### Added

- **`draft` command** — reads a git diff (`--staged`, `--working`, `--commit <sha>`, or last commit by default) and asks Claude (`claude -p`) to propose knowledge-base entries. `--write` appends the proposals directly to the matching scope files.
- **`ask` command** — loads every `.md` under `.claude/knowledge/` and asks Claude a question scoped strictly to the knowledge base, with source citations. Semantic retrieval without embeddings.
- **`ask --scope <s,s>`** — narrows which scope files are loaded, for knowledge bases that outgrow the default 120 KB context budget.
- **`stale` command + `SessionStart` hook** — flags entries older than N days (default 180). The `--brief` mode powers a `SessionStart` hook that prints one line at every session start when stale entries exist, and is silent otherwise.
- **`check` command** — diffs a git range (`--base origin/main...HEAD`) or staged changes (`--staged`), fails in `--strict` mode (or when `CI=true`) if sensitive files changed without a `.claude/knowledge/` update. Default sensitive patterns cover migrations, auth code, schema files, env files, Docker, and GitHub workflows.
- **`graph` command** — walks `**Supersedes:**` and `**Related:**` links between entries, prints an ASCII tree grouped by scope or a Mermaid `graph TD` block (`--mermaid`).
- **Pre-commit hook template** — `init` now scaffolds `.claude/hooks/pre-commit` (a portable shell script that runs `check --staged` as a non-blocking reminder). Activate per clone via `git config core.hooksPath .claude/hooks`.
- **PR template in user repos** — `init` scaffolds `.github/PULL_REQUEST_TEMPLATE.md` with a knowledge-update checklist.
- **`Supersedes:` / `Related:` convention** — optional bullets on any entry to link to other entry IDs. Documented in the `decisions.md` template and the `knowledge-update` skill.
- **Node `--test` suite** — 29 tests across 8 suites covering `init`, `add`, `list`, `search`, `validate`, `stale`, `check`, and `graph`. No new runtime deps. Run with `npm test`.
- **GitHub Actions CI** — matrix of Ubuntu / macOS / Windows × Node 18 / 20 / 22 on every push/PR to `main`.
- **Repository health** — `LICENSE` (MIT, Dexon Cabreros), `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1 adaptation), `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/` (bug report, feature request, config redirecting blank issues to README/CONTRIBUTING), `.github/PULL_REQUEST_TEMPLATE.md` for contributions to `memex-md` itself.
- **Translations** — full README translations in Spanish, Brazilian Portuguese, and Simplified Chinese. Stubs for Korean, Japanese, Russian, and Traditional Chinese (translator PRs welcome).
- **`CLAUDE_MEMEX_CLAUDE_BIN` env var** — override the `claude` binary path (for `draft` and `ask`).

### Changed

- **Package name** — `claude-memex` → `memex-md` (the old name was taken). See commit `d490397`.
- **CLI binary** — `claude-kb` → `claude-memex` → `memex-md`.
- **Init output** — now lists both hooks registered (PostToolUse + SessionStart), the scaffolded pre-commit hook, and the PR template, plus prints the one-liner to activate `core.hooksPath`.
- **`prepublishOnly`** — now runs `npm run build && npm test` to block publishes that break the build or tests.

## [0.2.0] — pre-rename

(Preserved here only for reference; shipped under the old name `claude-memex`.)

- First public automation additions (`draft`, `ask`, `stale`, `check`) landed under the previous name. See git history between `fa376ce` and `03d2f11`.

## [0.1.0] — initial release

- Core CLI: `init`, `add`, `list`, `search`, `validate`, `prune`.
- Scopes: `architecture`, `decisions`, `patterns`, `gotchas`, `glossary`.
- Scaffolded `.claude/knowledge/` + `knowledge-update` skill + post-edit hook.
- Zero runtime dependencies.

[Unreleased]: https://github.com/dexonapi-alt/memex-md/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/dexonapi-alt/memex-md/releases/tag/v0.5.1
[0.5.0]: https://github.com/dexonapi-alt/memex-md/releases/tag/v0.5.0
[0.4.0]: https://github.com/dexonapi-alt/memex-md/releases/tag/v0.4.0
[0.3.2]: https://github.com/dexonapi-alt/memex-md/releases/tag/v0.3.2
[0.3.1]: https://github.com/dexonapi-alt/memex-md/releases/tag/v0.3.1
[0.3.0]: https://github.com/dexonapi-alt/memex-md/releases/tag/v0.3.0
[0.2.0]: https://github.com/dexonapi-alt/memex-md/releases/tag/v0.2.0
[0.1.0]: https://github.com/dexonapi-alt/memex-md/releases/tag/v0.1.0

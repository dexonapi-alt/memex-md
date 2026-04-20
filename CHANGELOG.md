# Changelog

All notable changes to `memex-md` are documented here. This project follows [Semantic Versioning](https://semver.org/) and the format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

Nothing yet.

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

[Unreleased]: https://github.com/dexonapi-alt/claude-memex/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/dexonapi-alt/claude-memex/releases/tag/v0.3.0
[0.2.0]: https://github.com/dexonapi-alt/claude-memex/releases/tag/v0.2.0
[0.1.0]: https://github.com/dexonapi-alt/claude-memex/releases/tag/v0.1.0

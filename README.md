# memex-md

> **Give Claude Code a memory that lives in your repo — not your home folder.**

**English** | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

<p align="center">
  <img src="./assets/memex-md-banner.png" alt="memex-md — your knowledge has been retained. Now Claude Code already knows it next time." />
</p>

### 🛠 Built with

[![CI](https://github.com/dexonapi-alt/memex-md/actions/workflows/ci.yml/badge.svg)](https://github.com/dexonapi-alt/memex-md/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square&logo=npm&logoColor=white)
![Zero deps](https://img.shields.io/badge/runtime_deps-0-success?style=flat-square)
![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
<!-- ![npm version](https://img.shields.io/npm/v/memex-md?style=flat-square) — uncomment after publishing -->

---

## 🤔 The problem

Every time you start a new Claude Code session, Claude forgets most of what it learned before. You end up re-explaining the same things:

- ❌ *"We use SQLite locally because Postgres was too heavy on dev laptops."*
- ❌ *"Don't touch `auth/legacy.ts` — it's still used by the mobile app."*
- ❌ *"Last time you fixed this bug, the root cause was the cache, not the API."*

Claude **does** have a memory feature — but it's stored in your home folder (`~/.claude/...`). It doesn't travel with the repo. Teammates, other machines, and CI all start cold.

## ✨ The fix

`memex-md` gives your repo its own memory. One command sets up a folder where Claude writes down what it learns — and reads back at the start of every session:

```bash
npx memex-md init
```

That creates:

```
.claude/
  knowledge/
    architecture.md     ← what the project looks like
    decisions.md        ← why we chose X over Y
    patterns.md         ← code patterns we reuse
    gotchas.md          ← footguns, past bugs
    glossary.md         ← our jargon
  skills/
    knowledge-update/   ← tells Claude when to update the above
  settings.json         ← a gentle reminder hook after edits
CLAUDE.md               ← auto-bootstrapped with a block that points
                          Claude at .claude/knowledge/ every session
```

Commit the folder and `CLAUDE.md`. Claude reads the knowledge base every session.

<!-- 📸 DEMO GIF: terminal recording of `init` + a session using the knowledge. Drop at ./docs/demo.gif -->
<!-- ![demo](./docs/demo.gif) -->

## 🚀 Quick start

```bash
# In any repo where you use Claude Code:
npm install --save-dev memex-md
npx memex-md init

# Commit the new .claude/ folder
git add .claude && git commit -m "Add memex-md"

# Add your first knowledge entry
npx memex-md add decisions "chose SQLite over Postgres for local dev"
```

Open `.claude/knowledge/decisions.md`, fill in the details, and commit. Next time you start Claude, that decision is already in context.

## 🧰 Commands

**Core**

| Command | What it does |
|---|---|
| `memex-md init [--auto]` | Set up `.claude/knowledge/`, skill, hooks, CLAUDE.md. `--auto` also registers a Stop hook for auto-drafting after each Claude response |
| `memex-md add <scope> "<title>"` | Append a new entry to a scope |
| `memex-md list [scope]` | Show what's in your knowledge base |
| `memex-md search <query>` | Grep across all entries |
| `memex-md validate` | Check everything is in order |
| `memex-md prune [--days N]` | Flag old entries (default: >180 days) |
| `memex-md preference "<text>"` | Append a project-level preference to CLAUDE.md's `## Preferences` section |

**Claude-powered (requires Claude Code CLI on PATH)**

| Command | What it does |
|---|---|
| `memex-md draft [--staged\|--working\|--commit <sha>] [--write]` | Ask Claude to propose knowledge entries from a git diff |
| `memex-md ask [--scope <s,s>] "<question>"` | Ask Claude a question answered strictly from your knowledge base (`--scope` narrows which files are loaded) |

**Automation**

| Command | What it does |
|---|---|
| `memex-md stale [--days N] [--brief]` | List stale entries (powers the SessionStart hook) |
| `memex-md check [--base <ref>\|--staged] [--patterns <glob,glob>] [--strict]` | CI / pre-commit check: fail if sensitive files changed without a knowledge update |
| `memex-md graph [--mermaid]` | Show supersedes/related relationships between entries |
| `memex-md promote [--list\|--dry-run\|--all]` | Migrate repo-level facts accidentally stored in machine memory into `.claude/knowledge/` |

## 🤖 Automation, explained

Memory that relies on discipline is memory that decays. `memex-md` closes the gap four different ways — so you never have to remember to maintain it:

### `draft` — propose entries from a diff
```bash
# From your last commit
npx memex-md draft

# From staged changes, and write the proposed entries into the files
npx memex-md draft --staged --write
```
Reads the diff, asks Claude to identify anything worth recording (new decisions, patterns, gotchas), and either prints the proposals or appends them directly to the right scope file. Turns *"I should remember this"* into a one-command reflex.

### `ask` — semantic search without embeddings
```bash
npx memex-md ask "why did we pick SQLite locally?"

# For larger knowledge bases, narrow to specific scopes:
npx memex-md ask --scope decisions,gotchas "why did we pick SQLite locally?"
```
Loads every `.md` in `.claude/knowledge/` (or only the scopes you name) and asks Claude — scoped strictly to the knowledge base, with source citations. No vector DB, no index to maintain. Claude does the semantic matching.

`--scope` is how the tool scales: when your knowledge base grows past a few hundred entries, load only the scopes a question actually needs.

### SessionStart hook — stale-check on every session
Registered automatically by `init`. On every Claude Code session start, prints one line flagging entries older than 180 days:
```
[memex-md] 3 knowledge entries older than 180 days — review for staleness: decisions.md:"Chose SQLite...", gotchas.md:"..."
```
Quiet when nothing is stale. Gives you a nudge, not a wall of text.

### `check` — CI-style validation
```bash
# In GitHub Actions or pre-push hook:
npx memex-md check --base origin/main...HEAD --strict

# Or against staged changes (for pre-commit use):
npx memex-md check --staged
```
Fails the check when someone lands a migration / auth / schema / config change without updating the knowledge base. Pattern list is overridable via `--patterns`. Exits `1` when `--strict` is set or when `CI=true`.

### Stop hook — auto-draft after every Claude response (opt-in via `--auto`)

Run `memex-md init --auto` (or `--auto --force` on an existing install) to register a `Stop` hook in `.claude/settings.json`. At the end of every Claude response, the hook runs `memex-md draft --working --auto`, which:

1. Reads the uncommitted working diff (silently — no noise if empty).
2. Asks Claude (`claude -p`) whether any knowledge entries are warranted.
3. If Claude returns `NO_ENTRIES_NEEDED`: silent no-op.
4. If Claude proposes entries: writes them to `.claude/knowledge/<scope>.md` and prints one stderr line: *"wrote N entries — review with `git diff .claude/knowledge/`"*.
5. **Never aborts the hook chain**: missing `claude` binary, git errors, timeouts all degrade to silent returns so the Claude Code session loop is never broken.

You review entries via `git diff .claude/knowledge/` and `git commit` (accept) or `git checkout --` (discard). Turn off by removing the `Stop` entry from `.claude/settings.json`.

### Pre-commit hook + PR template (installed by `init`)
`init` also scaffolds:

- `.claude/hooks/pre-commit` — a tiny shell script that runs `check --staged` and prints a reminder when sensitive files change without a knowledge update. **Does not block commits** — enforcement belongs in CI. Activate per clone:
  ```bash
  git config core.hooksPath .claude/hooks
  ```
- `.github/PULL_REQUEST_TEMPLATE.md` — a checklist prompting contributors to record decisions / patterns / gotchas introduced by the PR (or explicitly mark N/A). GitHub auto-applies it to new PRs.

Both are regular files in your repo — review and customise them like any other template.

### `graph` — supersedes & related links between entries
Entries can reference each other with two optional bullets:

```md
## Moved to Postgres for local dev

- **Added:** 2026-07-15
- **Supersedes:** `chose-sqlite-over-postgres-for-local-dev`
- **Related:** `dev-environment-parity`
- Migration scripts require Postgres features. Local SQLite is no longer worth
  the parity gap.
```

`memex-md graph` walks those links and prints an ASCII view of the chains — who supersedes whom, who relates to whom, and any dangling references (ids that don't resolve). Pass `--mermaid` to emit a `graph TD` block you can paste into a GitHub Markdown comment and have it render.

This gives you a lightweight intelligence layer without pulling in a graph DB: plain Markdown conventions, walked at query time.

## 💬 Slash commands inside Claude Code

`init` scaffolds three commands under `.claude/commands/memex/` that map to memex-md actions. Anything prefixed with `/memex:` touches the repo (knowledge base, plans, preferences) — never Claude's machine-local auto-memory.

| Slash command | What it does |
|---|---|
| `/memex:preference "<text>"` | Classifies the preference (project-level → CLAUDE.md, user-level → auto-memory) and saves. |
| `/memex:fix "<description>"` | Reads the current git diff, drafts a `gotchas.md` entry with Symptom / Root cause / Fix / Prevention, appends to `.claude/knowledge/gotchas.md`, and reads it back. |
| `/memex:plan "<task>"` | Reads the knowledge base, scans the codebase, writes a full design plan to `.claude/plans/<date>-<slug>.md` (Goal / Context / Affected files / Migrations / Hooks / Dependencies / Risks / Implementation order), and updates a plans index. |

**Durability for teams:** these commands live in the repo (`.claude/commands/memex/*.md`), so every teammate who clones the repo gets the same shortcuts on first session.

**Re-read rule:** after any `/memex:*` command runs, Claude is instructed (via the `CLAUDE.md` block) to re-read the updated `INDEX.md` and scope/plan file before its next substantive response. The disk is the source of truth, not what Claude remembers writing.

## 🗂 Scopes

Each scope is one Markdown file. You don't need all of them — use whichever fits what you just learned.

| Scope | Use it when... |
|---|---|
| 🏗 **architecture** | You added or changed a service, module, or data flow |
| 🎯 **decisions** | You picked X over Y for a non-obvious reason |
| 🔁 **patterns** | You noticed the same shape of code 3+ times |
| ⚠️ **gotchas** | You fixed a bug with a weird root cause |
| 📖 **glossary** | You used a term only your team would know |

<!-- 📸 SCREENSHOT: the .claude/ folder open in an editor -->

## 🧠 Why this exists (the longer version)

Claude Code already has three ways to remember things. Each one has a real limitation:

| Memory type | Where it lives | What it loses |
|---|---|---|
| 💬 **Chat history** (`claude --continue`) | `~/.claude/projects/<slug>/` | It's just your past conversation. Old details fade as new messages push them out of context. |
| 🧩 **Auto-memory** | `~/.claude/projects/<slug>/memory/` | Lives on **one machine**. Teammates, CI, and your other laptop start with nothing. Not reviewable in PRs. |
| 📄 **`CLAUDE.md`** | In your repo | Travels with the code ✅ — but it's a single file built for stable rules, not a growing archive of dozens of decisions, patterns, and gotchas. |

`memex-md` fills the gap: an **in-repo**, **scoped**, **self-updating** knowledge base. Git-tracked. PR-reviewable. The same on every machine.

### What actually changes

| Before | After |
|---|---|
| *"Why don't we use Postgres locally?"* | It's in `decisions.md`. Claude already knows. |
| The same tricky bug gets fixed twice | It's in `gotchas.md` with the root cause. |
| New teammate takes a week to ramp up | They `git clone`; Claude already knows the conventions. |
| Your second laptop feels like a stranger | The repo is the source of truth, on every machine. |
| After a big refactor, Claude slowly re-learns the shape | `architecture.md` was updated *during* the refactor. |

### Why this makes Claude Code faster

- **Less re-exploration.** Claude spends fewer tool calls re-reading files it already learned.
- **Smaller effective context.** A focused 200-line `architecture.md` beats 4,000 lines of stale chat history.
- **Survives forgetting.** Files on disk are loaded fresh every session — they don't get compacted away.
- **Reviewable.** Bad entries get caught in PR review, not after they derail a future session.

## 🛑 When *not* to use this

- You're writing a throwaway script or a one-off spike — `CLAUDE.md` alone is enough.
- Your whole codebase fits comfortably in Claude's context every time.
- You don't use Claude Code across multiple sessions or machines.

Otherwise: this probably pays for itself within the first week.

## 📦 Requirements

- **Node.js** 18 or newer
- **Claude Code** — [install it here](https://claude.com/claude-code)
- `draft` and `ask` require the `claude` CLI on your `PATH` (or set `CLAUDE_MEMEX_CLAUDE_BIN`)
- `check` requires `git` and is intended to run inside a git repo (including CI)

## 🤝 Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, PR guidelines, translation workflow, and how to report bugs. Participation in this project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md).

TL;DR:

1. Keep each PR focused on one feature or fix.
2. Run `npm run build` before pushing.
3. If your change introduces a new pattern or decision, add an entry to your own `.claude/knowledge/` — we eat our own dogfood.

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<sub>Named after the **memex** — Vannevar Bush's 1945 idea of a personal device that would store all your books, records, and communications so they could be instantly recalled. This is your project's memex.</sub>

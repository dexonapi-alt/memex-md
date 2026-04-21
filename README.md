# memex-md

> **One person plans. The team executes. Everyone learns. All in git.**

**English** | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

<p align="center">
  <img src="./assets/memex-md-banner.png" alt="memex-md — your knowledge has been retained. Now Claude Code already knows it next time." />
</p>

[![CI](https://github.com/dexonapi-alt/memex-md/actions/workflows/ci.yml/badge.svg)](https://github.com/dexonapi-alt/memex-md/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square&logo=npm&logoColor=white)
![Zero deps](https://img.shields.io/badge/runtime_deps-0-success?style=flat-square)
![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

---

## 🤝 How it works

Meet **Alice** (architect), **Bob** and **Carol** (team), and **Dave** (joins next quarter).

### Monday — Alice plans

```
Alice:  /memex:plan "migrate auth from JWT to session cookies" --for bob
```

Claude reads the repo's knowledge base, scans the auth middleware, and writes `.claude/plans/2026-04-20-migrate-auth.md` — affected files, migrations, risks, a 7-step implementation order, verification steps. Assigned to `@bob`.

Alice reviews the plan, tweaks step 3, opens a PR *"Plan: migrate auth to session cookies"*. The team reviews in GitHub, merges to main. The merged plan file is the approval — no extra ceremony needed.

### Tuesday — Bob implements

```
Bob:  /memex:apply-plan 2026-04-20-migrate-auth
```

Claude re-reads the plan and the knowledge base, confirms with Bob *("7 steps, touches auth middleware + 4 route handlers, proceed?")*, flips the status to `in-progress`, and walks each step — writing code, verifying after each change. Mid-execution it hits an edge case: the rate limiter runs before JWT validation. Bob approves a plan amendment; Claude continues.

On completion:
- Plan's `Status:` → `implemented (2026-04-21)`
- New gotcha captured in `.claude/knowledge/gotchas.md` about the JWT timing
- Plan `git mv`'d to `.claude/plans/applied/` — history preserved, active list stays clean
- Bob reviews via `git diff`, commits, pushes

### Wednesday — Carol catches a bug

QA finds that session cookies expire 30 minutes early under load.

```
Carol:  /memex:fix "session cookie expires 30 min early under load"
```

Claude reads the diff of her fix, drafts a structured gotcha (symptom / root cause / fix / prevention), saves it to `gotchas.md`. The symptom becomes searchable for the whole team forever.

### Next quarter — Dave's first day

```
Dave:  claude
```

Claude auto-loads `.claude/knowledge/` at session start. Dave asks *"why did we migrate auth?"* — Claude cites `decisions.md`, explains the trade-offs. He asks *"what are the gotchas?"* — Claude lists them. He knows the domain jargon, the repo conventions, and the patterns in use.

**Dave is productive on day one. No catch-up meeting, no "ask Alice next time she's online", no re-explaining. The knowledge is already in Claude's context because the team put it in the repo.**

---

## 🧠 The idea

Claude Code has memory — but it lives in your home folder and doesn't travel with the repo. Your teammate's Claude never learned about the SQLite decision. Your CI runner has no context at all. The plan you kicked around in chat last Thursday is gone.

**memex-md fixes this by making the knowledge a first-class part of the repo.** Plans, decisions, patterns, gotchas, and domain terms live as Markdown files under `.claude/` — reviewable in PRs, tracked by git, loaded into every Claude session, on every machine, for every teammate.

Eight slash commands are the daily interface. They don't ask you to be disciplined — they *do the capture for you*. Type `/memex:fix`, Claude reads your diff and writes the gotcha. Type `/memex:plan`, Claude scans the repo and writes the plan file. The path of least resistance happens to be the path that documents your work.

---

## 🚀 Install (2 minutes, one-time)

```bash
# In any repo where your team uses Claude Code:
npm install --save-dev memex-md
npx memex-md init

git add .claude/ .github/ CLAUDE.md
git commit -m "Add memex-md"
```

**Exit and restart Claude Code** so the slash commands load. Type `/memex:` — autocomplete shows all eight. You're done with setup. Everything from here happens through slash commands during normal work.

---

## ✍️ The eight commands

**Capture — record something you learned**

| You type | memex-md writes to |
|---|---|
| `/memex:fix "<description>"` | `gotchas.md` — symptom / root cause / fix / prevention |
| `/memex:decide "<text>"` | `decisions.md` — context / decision / why / trade-offs |
| `/memex:pattern "<text>"` | `patterns.md` — where used (3+ confirmed) / shape / when NOT to use |
| `/memex:arch "<text>"` | `architecture.md` — shape (diagram) / boundary |
| `/memex:term "<term>: <def>"` | `glossary.md` — definition / used in |
| `/memex:preference "<text>"` | `CLAUDE.md` (project) or auto-memory (user), routes based on classification |

**Plans — design before, execute later, archive after**

Status flows automatically through **draft → in-progress → implemented**. PR review on the plan file *is* the approval — no extra command to type.

| You type | memex-md does |
|---|---|
| `/memex:plan [--for <user>] "<task>"` | Writes `.claude/plans/<date>-<slug>.md` as `draft`. `--for` marks the intended assignee. |
| `/memex:apply-plan <slug>` | Executes the plan: flips `draft → in-progress` on start, `in-progress → implemented (<date>)` on success. Captures new learnings into `.claude/knowledge/`, then `git mv`s the plan to `.claude/plans/applied/`. |

Anything prefixed with `/memex:` lands in git, is reviewable in PRs, and is re-read by Claude at the start of every session. **The disk is the source of truth.** Claude is instructed (via the `CLAUDE.md` block `init` installs) to re-read the affected file after every `/memex:*` command so the fresh state is always in its context.

---

## 📂 What `init` installs

```
.claude/
  knowledge/                       ← team-shared institutional memory
    INDEX.md
    architecture.md  decisions.md  patterns.md
    gotchas.md       glossary.md
  plans/                           ← design artifacts
    INDEX.md
    applied/                       ← plans that have been executed
  commands/memex/                  ← the 8 slash commands above
    preference.md  fix.md  decide.md  pattern.md
    arch.md        term.md plan.md   apply-plan.md
  skills/knowledge-update/         ← tells Claude when to update the KB
  hooks/pre-commit                 ← nudge on sensitive file changes
  settings.json                    ← PostToolUse + SessionStart hooks
CLAUDE.md                          ← bootstrapped so Claude auto-loads everything
.github/PULL_REQUEST_TEMPLATE.md   ← PR checklist for KB updates
```

Commit it all. That's the handoff surface for your team.

## 🧰 Under the hood — the CLI

The slash commands cover the daily interface. The `memex-md` CLI backs them and exposes a few extra power-user tools for scripting, CI, and one-off maintenance.

**Setup**

| Command | What it does |
|---|---|
| `memex-md init [--auto] [--force]` | Set up `.claude/` + `CLAUDE.md` + `.github/PULL_REQUEST_TEMPLATE.md`. `--auto` also registers a `Stop` hook for auto-drafting after each Claude response. `--force` refreshes templates over an existing install. |

**Authored entries**

| Command | What it does |
|---|---|
| `memex-md preference "<text>"` | Append a project-level preference to CLAUDE.md's `## Preferences`. Powers `/memex:preference`. |
| `memex-md add <scope> "<title>"` | Create an entry skeleton in a scope file (manual fill-in). |

**Query & audit**

| Command | What it does |
|---|---|
| `memex-md list [scope]` | Show entries per scope. |
| `memex-md search <query>` | Grep across all knowledge files. |
| `memex-md ask [--scope <s,s>] "<question>"` | Ask Claude a question answered strictly from the knowledge base, with source citations. |
| `memex-md graph [--mermaid]` | Show supersedes / related relationships. ASCII tree or Mermaid diagram. |
| `memex-md validate` | Structural check of the knowledge base. |
| `memex-md stale [--days N] [--brief]` | List entries older than N days (default 180). Powers the `SessionStart` hook. |
| `memex-md prune [--days N]` | Alias of `stale`. |

**Claude-driven capture**

| Command | What it does |
|---|---|
| `memex-md draft [--staged\|--working\|--commit <sha>] [--write] [--auto]` | Ask Claude to propose knowledge entries from a git diff. `--write` applies them; `--auto` is the non-fatal mode used by the `Stop` hook. |
| `memex-md promote [--list\|--dry-run\|--all]` | Migrate repo-level facts already captured in Claude's machine memory into `.claude/knowledge/`. |

**CI / enforcement**

| Command | What it does |
|---|---|
| `memex-md check [--base <ref>\|--staged] [--patterns <glob,glob>] [--strict]` | Fail if sensitive files changed without a knowledge update. Use in GitHub Actions or as a pre-commit hook. |

## 🤖 Automation, explained

Memory that relies on discipline is memory that decays. `memex-md` closes the gap from several angles — so you never have to remember to maintain it:

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

## 🧭 The `/memex:` contract (how slash commands stay reliable)

The eight commands at the top of this README are more than shortcuts. They enforce three guarantees the tool cannot deliver any other way:

### 1. Everything under `/memex:` lands in git
Claude's default auto-memory (`~/.claude/...`) is per-user, per-machine, per-OS-install. Your teammate, your other laptop, and CI all start cold. Every `/memex:*` command writes to a file inside the repo (`CLAUDE.md`, `.claude/knowledge/*`, `.claude/plans/*`) — so the knowledge ships with the code.

### 2. Claude re-reads fresh state after every command
memex-md's `CLAUDE.md` block includes an explicit *re-read rule*: after any `/memex:*` slash command or `memex-md` CLI invocation, the disk state has changed, and Claude must re-read the affected `INDEX.md` + scope/plan file before its next substantive response. **The disk is the source of truth** — not what Claude remembers writing a moment ago.

### 3. Durability for teams
Slash command templates live at `.claude/commands/memex/*.md` in your repo. Every teammate who clones gets the same eight commands on their first Claude Code session. No shared config server, no per-user setup, no "did you install the extension?" — it's code, not configuration.

### The routing rule
memex-md's `CLAUDE.md` block also instructs Claude: **if the preference is about the user (shell habit, editor, timezone), it goes to auto-memory; if it's about the project (convention, decision, pattern, gotcha, domain term), it goes in git via memex-md.** The `/memex:preference` command applies this rule automatically. If you invoke it with a clearly-personal preference, Claude will flag it and offer to save to auto-memory instead.

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

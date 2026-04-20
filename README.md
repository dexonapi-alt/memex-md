# claude-memex

> **Give Claude Code a memory that lives in your repo — not your home folder.**

**English** | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

<p align="center">
  <img src="./assets/claude-memex-banner.png" alt="claude-memex — your knowledge has been retained. Now Claude Code already knows it next time." />
</p>

### 🛠 Built with

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square&logo=npm&logoColor=white)
![Zero deps](https://img.shields.io/badge/runtime_deps-0-success?style=flat-square)
![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
<!-- ![npm version](https://img.shields.io/npm/v/claude-memex?style=flat-square) — uncomment after publishing -->

---

## 🤔 The problem

Every time you start a new Claude Code session, Claude forgets most of what it learned before. You end up re-explaining the same things:

- ❌ *"We use SQLite locally because Postgres was too heavy on dev laptops."*
- ❌ *"Don't touch `auth/legacy.ts` — it's still used by the mobile app."*
- ❌ *"Last time you fixed this bug, the root cause was the cache, not the API."*

Claude **does** have a memory feature — but it's stored in your home folder (`~/.claude/...`). It doesn't travel with the repo. Teammates, other machines, and CI all start cold.

## ✨ The fix

`claude-memex` gives your repo its own memory. One command sets up a folder where Claude writes down what it learns — and reads back at the start of every session:

```bash
npx claude-memex init
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
```

Commit the folder. Claude reads it every session. That's it.

<!-- 📸 DEMO GIF: terminal recording of `init` + a session using the knowledge. Drop at ./docs/demo.gif -->
<!-- ![demo](./docs/demo.gif) -->

## 🚀 Quick start

```bash
# In any repo where you use Claude Code:
npm install --save-dev claude-memex
npx claude-memex init

# Commit the new .claude/ folder
git add .claude && git commit -m "Add claude-memex"

# Add your first knowledge entry
npx claude-memex add decisions "chose SQLite over Postgres for local dev"
```

Open `.claude/knowledge/decisions.md`, fill in the details, and commit. Next time you start Claude, that decision is already in context.

## 🧰 Commands

**Core**

| Command | What it does |
|---|---|
| `claude-memex init` | Set up `.claude/knowledge/`, the skill, and the hooks |
| `claude-memex add <scope> "<title>"` | Append a new entry to a scope |
| `claude-memex list [scope]` | Show what's in your knowledge base |
| `claude-memex search <query>` | Grep across all entries |
| `claude-memex validate` | Check everything is in order |
| `claude-memex prune [--days N]` | Flag old entries (default: >180 days) |

**Claude-powered (requires Claude Code CLI on PATH)**

| Command | What it does |
|---|---|
| `claude-memex draft [--staged\|--working\|--commit <sha>] [--write]` | Ask Claude to propose knowledge entries from a git diff |
| `claude-memex ask "<question>"` | Ask Claude a question answered strictly from your knowledge base |

**Automation**

| Command | What it does |
|---|---|
| `claude-memex stale [--days N] [--brief]` | List stale entries (powers the SessionStart hook) |
| `claude-memex check [--base <ref>] [--patterns <glob,glob>] [--strict]` | CI check: fail if sensitive files changed without a knowledge update |

## 🤖 Automation, explained

Memory that relies on discipline is memory that decays. `claude-memex` closes the gap four different ways — so you never have to remember to maintain it:

### `draft` — propose entries from a diff
```bash
# From your last commit
npx claude-memex draft

# From staged changes, and write the proposed entries into the files
npx claude-memex draft --staged --write
```
Reads the diff, asks Claude to identify anything worth recording (new decisions, patterns, gotchas), and either prints the proposals or appends them directly to the right scope file. Turns *"I should remember this"* into a one-command reflex.

### `ask` — semantic search without embeddings
```bash
npx claude-memex ask "why did we pick SQLite locally?"
```
Loads every `.md` in `.claude/knowledge/` and asks Claude — scoped strictly to the knowledge base, with source citations. No vector DB, no index to maintain. Claude does the semantic matching.

### SessionStart hook — stale-check on every session
Registered automatically by `init`. On every Claude Code session start, prints one line flagging entries older than 180 days:
```
[claude-memex] 3 knowledge entries older than 180 days — review for staleness: decisions.md:"Chose SQLite...", gotchas.md:"..."
```
Quiet when nothing is stale. Gives you a nudge, not a wall of text.

### `check` — CI-style validation
```bash
# In GitHub Actions or pre-push hook:
npx claude-memex check --base origin/main...HEAD --strict
```
Fails the check when someone lands a migration / auth / schema / config change without updating the knowledge base. Pattern list is overridable via `--patterns`. Exits `1` when `--strict` is set or when `CI=true`.

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

`claude-memex` fills the gap: an **in-repo**, **scoped**, **self-updating** knowledge base. Git-tracked. PR-reviewable. The same on every machine.

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

PRs welcome. Please:

1. Keep each PR focused on one feature or fix.
2. Run `npm run build` before pushing.
3. If your change introduces a new pattern or decision, add an entry to your own `.claude/knowledge/` — we use this on ourselves.

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<sub>Named after the **memex** — Vannevar Bush's 1945 idea of a personal device that would store all your books, records, and communications so they could be instantly recalled. This is your project's memex.</sub>

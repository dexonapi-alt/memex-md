# claude-memex

> **Give Claude Code a memory that lives in your repo — not your home folder.**

<!-- 📸 BANNER: drop a 1200x400 image at ./docs/banner.png and uncomment the line below -->
<!-- ![claude-memex banner](./docs/banner.png) -->

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#-license)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](#-requirements)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-compatible-orange.svg)](https://claude.com/claude-code)
<!-- [![npm version](https://img.shields.io/npm/v/claude-memex.svg)](https://www.npmjs.com/package/claude-memex) — uncomment after publishing -->

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

| Command | What it does |
|---|---|
| `claude-memex init` | Set up `.claude/knowledge/`, the skill, and the hook |
| `claude-memex add <scope> "<title>"` | Append a new entry to a scope |
| `claude-memex list [scope]` | Show what's in your knowledge base |
| `claude-memex search <query>` | Grep across all entries |
| `claude-memex validate` | Check everything is in order |
| `claude-memex prune [--days N]` | Flag old entries (default: >180 days) |

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

## 🤝 Contributing

PRs welcome. Please:

1. Keep each PR focused on one feature or fix.
2. Run `npm run build` before pushing.
3. If your change introduces a new pattern or decision, add an entry to your own `.claude/knowledge/` — we use this on ourselves.

## 📄 License

MIT.

---

<sub>Named after the **memex** — Vannevar Bush's 1945 idea of a personal device that would store all your books, records, and communications so they could be instantly recalled. This is your project's memex.</sub>

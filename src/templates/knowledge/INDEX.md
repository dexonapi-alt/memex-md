# Project Knowledge Base

Managed by `memex-md`. These files are loaded into Claude Code context alongside `CLAUDE.md`. Keep them focused and current — they are institutional memory for this repo.

## Scopes

- [architecture.md](architecture.md) — system shape, services, data flow, boundaries
- [decisions.md](decisions.md) — ADR-style: chose X over Y and why
- [patterns.md](patterns.md) — reusable patterns used in this codebase
- [gotchas.md](gotchas.md) — footguns, past incidents, non-obvious constraints
- [glossary.md](glossary.md) — domain terms and their meanings

## When to update

Update whenever work reveals a non-obvious fact that the next contributor (human or Claude) should know. The `knowledge-update` skill in `.claude/skills/` describes exact triggers.

## How to update

- Run `memex-md add <scope> "<title>"` to append a skeleton entry.
- Edit `.md` files directly for longer prose.
- Run `memex-md validate` before committing.
- Run `memex-md prune` occasionally to flag stale entries.

## What NOT to write here

- Ephemeral task state (use a todo list).
- Anything already in `CLAUDE.md`.
- Commentary that is obvious from reading the code.
- Secrets, tokens, or PII.

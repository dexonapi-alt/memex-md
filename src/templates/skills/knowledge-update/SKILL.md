---
name: knowledge-update
description: Maintains the in-repo knowledge base at .claude/knowledge/. Invoke whenever work reveals a non-obvious architectural shape, decision, reusable pattern, gotcha, or domain term that the next contributor (human or Claude) should know. Triggers naturally after debugging, refactors, introducing a new service, or resolving an incident.
---

# knowledge-update

Keep `.claude/knowledge/` current as work progresses. This directory is the project's institutional memory and survives across Claude Code sessions via git.

## Scopes

| File | What belongs here |
|---|---|
| `architecture.md` | New service, module, data flow change, boundary move |
| `decisions.md` | Chose X over Y for a non-obvious reason (ADR-style) |
| `patterns.md` | Pattern observed 3+ times in the codebase |
| `gotchas.md` | Bug rooted in an obscure constraint; incident postmortems |
| `glossary.md` | Domain term introduced or redefined |

## Triggers (when to update)

Update after completing work when any of the following are true:

1. You made a judgment call the next contributor would second-guess → `decisions.md`
2. You fixed a bug whose root cause was non-obvious → `gotchas.md`
3. You introduced or discovered a repeating code pattern → `patterns.md`
4. You added, removed, or restructured a service or module → `architecture.md`
5. You used a term whose meaning is project-specific → `glossary.md`

Do NOT update for:

- Routine refactors or style fixes
- Anything already captured in `CLAUDE.md`
- Ephemeral task state (use TodoWrite / TaskCreate)
- Changes self-evident from the code

## How to update

Two options:

### Option A — CLI

```
memex-md add <scope> "<short title>"
```

This appends a skeleton entry with today's date. Then edit the entry inline.

### Option B — Direct edit

Append a `## <title>` block to the relevant file. Each entry should include `- **Added:** YYYY-MM-DD` so `memex-md prune` can flag stale entries later.

## Linking entries

When a new decision replaces an older one (e.g. we moved from SQLite to Postgres in prod), add to the new entry:

    - **Supersedes:** `<old-entry-id>`

Keep the old entry in place — history matters. Use `memex-md graph` to see supersedes chains.

For non-replacing cross-references, use `**Related:** <entry-id>, <entry-id>` instead.

## Entry quality bar

- Lead with the fact/rule/decision, not the story
- Keep entries under 10 lines
- Include *why*, not just *what* (the why is what survives refactors)
- Link to file paths with `file:line` when pointing at code
- If an entry becomes wrong, update it in place; move obsolete decisions to an "Archived" section rather than deleting

## Before ending a session

Ask: "Did anything I learned today belong in `.claude/knowledge/`?" If yes, add it before the session ends — the next session will not remember the context.

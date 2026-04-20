---
description: Record a preference — project-level (CLAUDE.md) or user-level (machine memory)
---

The user wants to save a preference: $ARGUMENTS

## Step 1 — Classify

Decide where this belongs:

- **PROJECT-LEVEL** — specific to this repo, applies to anyone working on it: code style, naming conventions, architectural rules, commit format, testing practices, UI patterns specific to this app.
- **USER-LEVEL** — personal across all your projects: shell preference (e.g. `;` over `&&`), editor habit, timezone, working hours, personal coding style that applies everywhere.

If ambiguous, ask the user which one.

## Step 2 — If PROJECT-LEVEL

Run in your Bash tool:

    npx memex-md preference "$ARGUMENTS"

Then read `CLAUDE.md` back so you have the current state in context. Confirm to the user: *"Saved to CLAUDE.md (project-level) under `## Preferences`."*

## Step 3 — If USER-LEVEL

Save it to your auto-memory through your normal mechanism. Confirm to the user: *"Saved to machine memory (user-level, specific to your machine — not shared with teammates)."*

## Rules

- **Do NOT save the same preference to both stores.** Pick one.
- **Always state where it landed** in your confirmation. The user needs to know.
- **Never silently upgrade** a user-level preference to a project rule (or vice versa) — ask first.

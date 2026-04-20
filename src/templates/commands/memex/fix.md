---
description: Capture a just-resolved bug or issue as a gotcha entry in the knowledge base
---

The user just resolved a problem: $ARGUMENTS

## Step 1 — Understand the fix

Run `git diff HEAD` in your Bash tool to see what was changed to fix this. If the fix has already been committed, look at the most recent commit (`git log -1 -p`).

## Step 2 — Check for duplicates

Read `.claude/knowledge/gotchas.md`. If a similar entry already exists, update it rather than creating a new one.

## Step 3 — Draft the entry

Compute today's date (YYYY-MM-DD) and a kebab-case slug from a short title derived from $ARGUMENTS. Draft a block in this exact shape:

    ## <short title>

    - **Added:** <YYYY-MM-DD>
    - **ID:** <slug>
    - **Symptom:** <observable behaviour — what the user saw>
    - **Root cause:** <the underlying reason, not the surface symptom>
    - **Fix:** <what actually resolved it, with file paths when useful>
    - **Prevention:** <how to avoid recurrence, or a test that would catch it>

## Step 4 — Persist

Append the block to `.claude/knowledge/gotchas.md` using your Edit tool.

Then update `.claude/knowledge/INDEX.md` if it enumerates gotchas.

## Step 5 — Verify

Read back `.claude/knowledge/gotchas.md` to confirm the entry is persisted. The on-disk state becomes the canonical source — don't rely on your in-response memory of what you wrote.

## Step 6 — Confirm to the user

Tell the user: *"Added gotcha: `<title>` — see `.claude/knowledge/gotchas.md`."*

## Rules

- This is ALWAYS a repo-level entry. Never save to auto-memory.
- If the problem is actually a reusable solution (not a bug), put it in `.claude/knowledge/patterns.md` instead. Ask the user if unsure.
- Lead each field with the fact. Stories go at the bottom if at all.

---
description: Execute a plan previously written by /memex:plan, step by step, updating state as you go
---

The user wants to apply a plan: $ARGUMENTS

## Step 1 — Locate the plan

If `$ARGUMENTS` looks like a filename ending in `.md`, the plan lives at `.claude/plans/$ARGUMENTS`.

If `$ARGUMENTS` is a slug, date, or partial match:

1. Read `.claude/plans/INDEX.md` (if missing, there are no plans — tell the user to run `/memex:plan` first).
2. Find the plan whose filename or title matches `$ARGUMENTS`.
3. If multiple candidates match, list them and ask the user to pick.
4. If no match, tell the user and stop.

Read the full plan file into context. Also read `.claude/knowledge/INDEX.md` and any scope files cited in the plan's *Context from knowledge base* section.

## Step 2 — Confirm before executing

Briefly restate to the user:

> *"Ready to apply plan **<title>** (`<filename>`). Steps: N. Risks: <summary>. Proceed?"*

If the user declines or wants changes, STOP. Do not modify any files.

## Step 3 — Execute each step in order

For each item under the plan's `## Implementation order` section:

1. **State the step out loud** so the user can follow along: *"Step K/N: <description>"*.
2. **Execute** using your Edit / Write / Bash / Grep tools.
3. **Verify** the change: read back modified files, run the build (if a build command is documented in the plan's Dependencies or Verification), check any outputs.
4. **On failure**: STOP. Report which step failed, what the error was, and what state the repo is in. Do NOT continue to later steps.

Do NOT improvise beyond what the plan specifies. If a step is ambiguous, ask the user before proceeding.

## Step 4 — Update the plan file

When all steps complete successfully, use your Edit tool on the plan file:

- Change `- **Status:** draft` to `- **Status:** implemented (<YYYY-MM-DD>)`.
- Append (at the end of the file) a `## Completion notes` section describing any deviations from the original plan, surprises encountered, or follow-ups not in scope.

## Step 5 — Capture new knowledge (if warranted)

If the implementation revealed a fact worth preserving for future work:

- A reusable pattern (3+ uses will recur) → append an entry to `.claude/knowledge/patterns.md`.
- A surprising root cause or constraint → append an entry to `.claude/knowledge/gotchas.md`.
- A non-obvious decision made during execution → append to `.claude/knowledge/decisions.md`.

Cite the plan in the entry's metadata: `- **Source:** plan `<filename>``.

Do NOT manufacture entries for routine execution. *Zero entries is the correct output most of the time.*

## Step 6 — Summarize to the user

Tell the user:

- Which files were changed (bullet list).
- Which verification step(s) confirm correctness (tests passing, build OK, manual check described).
- Any knowledge-base entries added.
- Any follow-ups deliberately left out of scope.

End with: *"Review the diff with `git diff` and commit when ready. Plan file updated to `Status: implemented`."*

## Rules

- **The plan is authoritative.** Don't re-think what was decided in `/memex:plan`.
- **No silent skipping of steps.** If a step is impossible or redundant, STOP and ask the user whether to amend the plan or abandon the apply.
- **Every change goes through git.** Don't bypass normal review — the user approves by committing.
- **Never save to auto-memory.** Any knowledge captured during execution goes to `.claude/knowledge/`, not home-folder memory.

---
description: Mark a plan as approved (draft → approved), typically after PR review merges the plan file
---

The user wants to approve a plan: $ARGUMENTS

## Step 1 — Locate the plan

Parse `$ARGUMENTS` as a plan slug or filename.

1. Read `.claude/plans/INDEX.md`.
2. Find the matching plan under `## Plans` (active).
3. If multiple candidates match, list them and ask the user to choose.
4. If no match, or the match is already under `## Applied`, tell the user and stop.

Read the full plan file into context.

## Step 2 — Check current status

Look at the plan file's `Status` field:

- `draft` → proceed to Step 3.
- `approved (<date>)` → tell the user *"Already approved on \<date\>."* Stop.
- `in-progress` → warn: *"Work has already started. Approval typically precedes execution; are you sure you want to retroactively mark this as approved?"* Proceed only if the user confirms.
- `implemented (<date>)` → tell the user *"This plan is already implemented. Approval doesn't apply to completed plans."* Stop.

## Step 3 — Flip status

Use your Edit tool on the plan file:

- Change `- **Status:** draft` to `- **Status:** approved (<YYYY-MM-DD>)`.

## Step 4 — Update the INDEX

Edit `.claude/plans/INDEX.md`:

- Find the plan's line under `## Plans`.
- Change the inline status annotation from `*(draft)*` to `*(approved <YYYY-MM-DD>)*`.

If the INDEX uses a different status-annotation convention, match it.

## Step 5 — Verify

Read back both the plan file and `INDEX.md` to confirm the status updates landed.

## Step 6 — Confirm to the user

Tell the user: *"Plan \<slug\> approved on \<date\>. Any team member can now run `/memex:apply-plan \<slug\>` to execute it."*

If the plan has an `Assignee:` field, mention: *"Assigned to @\<username\> — they're the intended executor but anyone can pick it up."*

## Rules

- Approval is a process / social step — the tool just records it.
- Only approve plans in `draft` status by default. Other statuses require explicit user confirmation (or get rejected).
- Never modify the body of the plan during approval. Approval doesn't edit content; it records that the current content has been accepted.

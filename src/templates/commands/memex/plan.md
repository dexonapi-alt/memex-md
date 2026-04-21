---
description: Create a detailed plan file under .claude/plans/ using knowledge base context
---

The user wants a plan for: $ARGUMENTS

## Step 0 — Parse flags

Scan `$ARGUMENTS` for optional flags and extract them before treating the rest as the plan task:

- `--for <github-username>` — marks the plan as assigned. Remember the username (without the leading `@` if present) for Steps 4 and 5.

Whatever remains after flag extraction is the plan task.

## Step 1 — Load context from the knowledge base

Read the scope files that might be relevant:

- `.claude/knowledge/architecture.md` — system shape
- `.claude/knowledge/decisions.md` — why we chose what we chose
- `.claude/knowledge/patterns.md` — reusable patterns
- `.claude/knowledge/gotchas.md` — known footguns
- `.claude/knowledge/glossary.md` — domain terms

Also read `.claude/plans/INDEX.md` (if present) to see prior plans.

## Step 2 — Scan the codebase

Use Grep / Glob to identify files that this change would touch. Read any non-obvious ones to verify impact.

## Step 3 — Compute the plan file path

- `DATE = <today, YYYY-MM-DD>`
- `SLUG = <kebab-case slug from $ARGUMENTS, max 60 chars>`
- `PLAN_PATH = .claude/plans/${DATE}-${SLUG}.md`

Ensure `.claude/plans/` exists (create with `mkdir -p .claude/plans` if needed).

## Step 4 — Write the plan

Create `${PLAN_PATH}` with this exact structure:

    # <plan title>

    - **Created:** <YYYY-MM-DD>
    - **Status:** draft
    - **Assignee:** @<github-username>  (only if --for was provided; otherwise omit this line)
    - **Scope:** <one sentence on what this covers>

    ## Goal

    <one or two sentences on what the user asked for>

    ## Context from knowledge base

    <bullet list citing `file.md: ## Entry title` for every relevant existing entry>

    ## Affected files

    <bulleted list: `path/to/file.ts` — short note on what changes>

    ## Migrations / data

    <DB schema changes, data migrations, seed changes — or `N/A`>

    ## Hooks / skills / settings to update

    <any `.claude/hooks/`, `.claude/skills/`, `.claude/settings.json`, or CI config — or `N/A`>

    ## Dependencies

    <new packages, env vars, external services, secrets — or `N/A`>

    ## Risks & mitigations

    <bullet list: `risk` → `mitigation`>

    ## Implementation order

    1. ...
    2. ...
    3. ...

    ## Verification

    <how we confirm the implementation is correct: tests, manual check, metrics>

## Step 5 — Update the plans index

Ensure `.claude/plans/INDEX.md` exists. If not, create it with:

    # Plans

    Managed by `memex-md`. Each plan is a design artifact written before implementation. Plans travel with the repo so the team shares context.

    ## Plans

Then append (or insert at the top of the `## Plans` list):

    - [<DATE>-<SLUG>.md](<DATE>-<SLUG>.md) — <short description of goal>  *(draft)*  [— assigned: @<username>]

The parenthetical `*(draft)*` carries the current status so the INDEX reflects state without re-reading each plan file. Include the `— assigned: @<username>` suffix only if `--for` was provided.

## Step 6 — Verify

Read back both `${PLAN_PATH}` and `.claude/plans/INDEX.md` so the on-disk state is in your context. This is important: any future `/memex:apply-plan` or implementation pass should start from what is ON DISK, not from this response.

## Step 7 — Confirm to the user

Tell the user: *"Plan saved to `${PLAN_PATH}` (status: draft). Review and refine. Next: merge the plan file via PR, run `/memex:approve-plan ${DATE}-${SLUG}` to mark it approved, then anyone can run `/memex:apply-plan ${DATE}-${SLUG}` to execute it."*

If `--for <username>` was provided, also say: *"Assigned to @<username>."*

## Rules

- Write the FULL plan to disk, not just a summary in your response.
- Do NOT implement the plan in this turn. Planning and implementation are separate.
- Cite knowledge base entries explicitly in the Context section — don't paraphrase them into oblivion.

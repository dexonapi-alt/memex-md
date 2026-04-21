# Plans

Managed by `memex-md`. Each plan is a design artifact written **before** implementation — affected files, migrations, hooks touched, risks, and an ordered implementation sequence. Plans travel with the repo so the team shares context.

Create plans via the `/memex:plan "<task>" [--for <github-username>]` slash command inside Claude Code. Plans live at `.claude/plans/<YYYY-MM-DD>-<slug>.md`.

## Lifecycle

Every plan flows through three states, all managed automatically:

1. **draft** — just created by `/memex:plan`. Review it, refine it, open a PR if you're on a team. The PR merge *is* the approval.
2. **in-progress** — `/memex:apply-plan` has started walking the steps. Set automatically when execution begins.
3. **implemented** — all steps completed, plan archived to `.claude/plans/applied/`. Set automatically on successful completion.

Line format in this index includes the current status and optional assignee:

    - [<file>](<file>) — <description>  *(status)*  [— assigned: @username]

## Plans

<!-- Active plans. `/memex:plan` prepends new entries; /memex:apply-plan updates the status annotation in place when it starts (in-progress). -->

## Applied

<!-- Completed plans. `/memex:apply-plan` moves the plan file to .claude/plans/applied/ (via git mv to preserve history) and moves its INDEX entry here on completion. Format: - [applied/<file>](applied/<file>) — <description> *(implemented <date>)*. -->

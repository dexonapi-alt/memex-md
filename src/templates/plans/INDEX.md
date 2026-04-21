# Plans

Managed by `memex-md`. Each plan is a design artifact written **before** implementation — affected files, migrations, hooks touched, risks, and an ordered implementation sequence. Plans travel with the repo so the team shares context.

Create plans via the `/memex:plan "<task>"` slash command inside Claude Code. Plans live at `.claude/plans/<YYYY-MM-DD>-<slug>.md`.

## Lifecycle

Every plan flows through these states:

1. **draft** — just created by `/memex:plan`. Not yet reviewed.
2. **approved** — accepted by the team (usually via PR review). Set by `/memex:approve-plan <slug>`.
3. **in-progress** — `/memex:apply-plan` has started walking the steps.
4. **implemented** — all steps completed, plan archived to `.claude/plans/applied/`.

Line format in this index includes the current status and optional assignee:

    - [<file>](<file>) — <description>  *(status)*  [— assigned: @username]

## Plans

<!-- Active plans. `/memex:plan` prepends new entries; /memex:approve-plan and /memex:apply-plan update their status annotations in place. -->

## Applied

<!-- Completed plans. `/memex:apply-plan` moves the plan file to .claude/plans/applied/ (via git mv to preserve history) and moves its INDEX entry here on completion. Format: - [applied/<file>](applied/<file>) — <description> *(implemented <date>)*. -->

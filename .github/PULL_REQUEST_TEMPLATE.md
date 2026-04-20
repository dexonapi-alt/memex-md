<!--
  This is the PR template for contributions to memex-md itself.
  The template that init installs into USER repos lives at
  src/templates/github/PULL_REQUEST_TEMPLATE.md — don't confuse them.
-->

## What does this PR do?

<!-- One or two sentences. -->

## Why?

<!-- The problem, incident, or user pain that motivated this change. -->

## Changes

<!-- Bulleted list of the notable changes. Skip obvious refactors. -->

-

## How to test

```bash
# Commands a reviewer can run to verify the change.
```

## Checklist

- [ ] `npm run build` passes locally
- [ ] New behaviour is exercised end-to-end (not just unit-tested)
- [ ] README updated if this change is user-visible (new command, flag, or behaviour)
- [ ] If this introduces a new pattern, decision, or gotcha, an entry is added under `.claude/knowledge/` in this PR (we eat our own dogfood)
- [ ] If this supersedes an earlier decision, the new entry links it via `**Supersedes:** <old-entry-id>`
- [ ] No new runtime dependencies (or added dependency is justified in the PR description)
- [ ] No breaking changes (or migration notes included under "Changes")

## Translation drift

- [ ] English-only change — translator follow-up PRs welcome
- [ ] All translations updated
- [ ] N/A (no user-facing string changes)

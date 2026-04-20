# Decisions

ADR-style log. Each entry records a non-obvious choice and the reason.

Format for each entry:

- **Added:** YYYY-MM-DD
- **Status:** proposed | accepted | superseded
- **Context:** what forced the choice
- **Decision:** what we picked
- **Why:** the rationale (this is the load-bearing part)
- **Trade-offs:** what we lose
- **Supersedes:** `<old-entry-id>` (optional — when this replaces an earlier decision)
- **Related:** `<entry-id>, <entry-id>` (optional — cross-references)

When an entry is superseded, keep the original in place and add a new entry
pointing at it with `**Supersedes:**`. Use `memex-md graph` to see the
chains.

<!-- Append entries below. Each starts with `## <title>`. -->

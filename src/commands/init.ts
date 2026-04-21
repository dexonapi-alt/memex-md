import * as fs from "node:fs";
import * as path from "node:path";
import {
  claudeDir,
  commandsDir,
  knowledgeDir,
  plansDir,
  repoRoot,
  settingsPath,
  skillDir,
  templatesRoot,
} from "../lib/paths";
import { copyDir, readJson, writeJson } from "../lib/fs-utils";

interface HookEntry {
  matcher?: string;
  hooks: Array<{ type: string; command: string }>;
}

interface Settings {
  hooks?: {
    PostToolUse?: HookEntry[];
    SessionStart?: HookEntry[];
    Stop?: HookEntry[];
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

const POST_EDIT_HOOK_ID = "memex-md-knowledge-update";

const POST_EDIT_COMMAND =
  "node -e \"console.log('[knowledge-update] " +
  POST_EDIT_HOOK_ID +
  ": consider updating .claude/knowledge/ if this change introduces a decision, pattern, or gotcha.')\"";

const SESSION_START_COMMAND = "npx --no-install memex-md stale --brief";

const STOP_HOOK_COMMAND =
  "npx --no-install memex-md draft --working --auto";

const CLAUDE_MD_START = "<!-- memex-md:start -->";
const CLAUDE_MD_END = "<!-- memex-md:end -->";

const CLAUDE_MD_BLOCK = `${CLAUDE_MD_START}
## Project knowledge base (memex-md)

This repo uses [memex-md](https://github.com/dexonapi-alt/memex-md) to persist
project knowledge in git.

### Memory routing rule — READ FIRST

Before you use your auto-memory tool (which writes to \`~/.claude/projects/.../memory/\`
on the local machine), classify the fact:

| Fact type | Where to save |
|---|---|
| **About this repo** (conventions, decisions, patterns, gotchas, domain terms, team-style rules) | \`.claude/knowledge/<scope>.md\` — edit the file directly. DO NOT use auto-memory. |
| **About the user across all projects** (shell preference, editor, timezone, working style) | Auto-memory is correct. |

**If unsure, default to \`.claude/knowledge/\`.** Auto-memory is per-machine and
doesn't travel with the repo; the knowledge base is git-tracked, PR-reviewable,
and shared with teammates.

**Always state out loud where you're saving.** For example:

> *"Saving this to \`.claude/knowledge/patterns.md\` (repo-level rule)."*
>
> *"Saving this to machine memory (user-level preference)."*

Never hide which system fired. If you realize mid-flight that you put a fact in
the wrong place, say so and move it.

### What to consult

Before answering questions or making non-trivial changes:

1. Read \`.claude/knowledge/INDEX.md\` first. Then open the relevant scope file(s):
   - \`.claude/knowledge/architecture.md\` — system shape, services, data flow
   - \`.claude/knowledge/decisions.md\` — non-obvious choices and their rationale
   - \`.claude/knowledge/patterns.md\` — reusable code patterns
   - \`.claude/knowledge/gotchas.md\` — past bugs and non-obvious constraints
   - \`.claude/knowledge/glossary.md\` — project-specific terminology
2. Read \`.claude/plans/INDEX.md\` to see what plans exist. If the user's request matches an existing plan, open and follow it.
3. Honour any rules in the \`## Preferences\` section of this file.

### Re-read rule (IMPORTANT)

After ANY \`/memex:*\` slash command runs, or after \`memex-md\` CLI is invoked (\`add\`, \`preference\`, \`draft --write\`, \`promote\`), the repo state on disk has changed. **Re-read the affected \`INDEX.md\` and scope/plan file before your next substantive response** so the fresh content is in your context. Never rely solely on what you remember writing — the disk is the source of truth.

### Slash commands (inside Claude Code)

Capture:

- \`/memex:preference "<text>"\` — classify and save a preference (project-level → CLAUDE.md; user-level → auto-memory).
- \`/memex:fix "<description>"\` — capture a just-resolved bug as a \`gotchas.md\` entry (symptom / root cause / fix / prevention).
- \`/memex:decide "<text>"\` — record a non-obvious decision in \`decisions.md\` (context / decision / why / trade-offs).
- \`/memex:pattern "<text>"\` — record a reusable code pattern in \`patterns.md\` (confirms 3+ uses first).
- \`/memex:arch "<text>"\` — record a system-shape fact in \`architecture.md\` (prefers diagram + boundary over prose).
- \`/memex:term "<term>: <definition>"\` — record a domain term in \`glossary.md\`.

Plans (lifecycle: draft → approved → in-progress → implemented):

- \`/memex:plan [--for <github-username>] "<task>"\` — write a design plan under \`.claude/plans/<date>-<slug>.md\` with affected files, migrations, hooks, risks, and an ordered implementation plan. Optionally assigns to a teammate. Starts as \`draft\`.
- \`/memex:approve-plan <filename-or-slug>\` — flip \`draft\` → \`approved (<date>)\` after PR review or team sign-off. Any team member can then execute.
- \`/memex:apply-plan <filename-or-slug>\` — execute the plan step by step: marks \`in-progress\` on start, \`implemented (<date>)\` on success, captures new learnings back into \`.claude/knowledge/\`, then \`git mv\` the plan to \`.claude/plans/applied/\`.

Anything prefixed with \`/memex:\` touches the knowledge base, plans, or preferences — never your auto-memory.

### CLI (outside Claude Code or via the Bash tool)

\`\`\`
npx memex-md add <scope> "<title>"     # new knowledge entry
npx memex-md preference "<text>"       # project-level preference in CLAUDE.md
npx memex-md draft --staged --write    # auto-draft from diff
npx memex-md promote                   # migrate auto-memory -> KB
\`\`\`

See \`.claude/skills/knowledge-update/SKILL.md\` for full triggers and conventions.
${CLAUDE_MD_END}`;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function installClaudeMd(
  force: boolean
): "created" | "appended" | "updated" | "present" {
  const p = path.join(repoRoot(), "CLAUDE.md");

  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, `# ${path.basename(repoRoot())}\n\n${CLAUDE_MD_BLOCK}\n`);
    return "created";
  }

  const current = fs.readFileSync(p, "utf8");
  const hasBlock =
    current.includes(CLAUDE_MD_START) && current.includes(CLAUDE_MD_END);

  if (hasBlock && !force) return "present";

  if (hasBlock && force) {
    const pattern = new RegExp(
      `${escapeRegex(CLAUDE_MD_START)}[\\s\\S]*?${escapeRegex(CLAUDE_MD_END)}`
    );
    fs.writeFileSync(p, current.replace(pattern, CLAUDE_MD_BLOCK));
    return "updated";
  }

  const separator = current.endsWith("\n") ? "\n" : "\n\n";
  fs.writeFileSync(p, current + separator + CLAUDE_MD_BLOCK + "\n");
  return "appended";
}

export async function init(args: string[]): Promise<void> {
  const force = args.includes("--force");
  const auto = args.includes("--auto");

  fs.mkdirSync(claudeDir(), { recursive: true });

  if (fs.existsSync(knowledgeDir()) && !force) {
    console.error(
      ".claude/knowledge/ already exists. Use --force to overwrite template files (existing content is preserved only for files not in templates)."
    );
    process.exit(1);
  }

  const templates = templatesRoot();
  if (!fs.existsSync(templates)) {
    console.error(
      "Template files missing from package install. Reinstall memex-md."
    );
    process.exit(1);
  }

  copyDir(path.join(templates, "knowledge"), knowledgeDir());
  copyDir(path.join(templates, "skills", "knowledge-update"), skillDir());
  copyDir(path.join(templates, "commands", "memex"), commandsDir());
  installPlansSeed(templates, force);

  const hookInstalled = installPreCommitHook(templates, force);
  const prTemplateInstalled = installPrTemplate(templates, force);
  const claudeMdStatus = installClaudeMd(force);

  mergeHooks(auto);

  const claudeMdLabel = {
    created: "created",
    appended: "appended block",
    updated: "updated block (--force)",
    present: "already has block (skipped)",
  }[claudeMdStatus];

  console.log("Initialized memex-md:");
  console.log("  .claude/knowledge/                scaffolded");
  console.log("  .claude/skills/knowledge-update/  installed");
  console.log("  .claude/commands/memex/           installed (9 slash commands)");
  console.log("  .claude/plans/                    scaffolded");
  console.log(
    `  .claude/hooks/pre-commit          ${hookInstalled ? "installed" : "skipped (exists)"}`
  );
  console.log(
    `  .github/PULL_REQUEST_TEMPLATE.md  ${prTemplateInstalled ? "installed" : "skipped (exists)"}`
  );
  console.log(`  CLAUDE.md                         ${claudeMdLabel}`);
  console.log("  .claude/settings.json             hooks registered:");
  console.log("    - PostToolUse  (knowledge-update reminder)");
  console.log("    - SessionStart (stale-entry flag)");
  if (auto) {
    console.log("    - Stop         (auto-draft on every response)");
  }
  console.log("");
  console.log("Next:");
  console.log("  1. git add .claude/ .github/ CLAUDE.md && commit");
  console.log("  2. Edit .claude/knowledge/INDEX.md to taste");
  console.log('  3. Try: memex-md add decisions "your first decision"');
  if (hookInstalled) {
    console.log(
      "  4. (Optional) Activate the pre-commit hook: git config core.hooksPath .claude/hooks"
    );
  }
  if (!auto) {
    console.log(
      "  5. (Optional) Enable auto-draft on every Claude turn: re-run with --auto --force"
    );
  }
}

function installPreCommitHook(templates: string, force: boolean): boolean {
  const dest = path.join(claudeDir(), "hooks", "pre-commit");
  if (fs.existsSync(dest) && !force) return false;

  const src = path.join(templates, "hooks", "pre-commit");
  if (!fs.existsSync(src)) return false;

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  try {
    fs.chmodSync(dest, 0o755);
  } catch {
    // Windows chmod may fail; hook still runs via sh/Git Bash.
  }
  return true;
}

function installPlansSeed(templates: string, force: boolean): void {
  const dest = path.join(plansDir(), "INDEX.md");
  if (fs.existsSync(dest) && !force) return;
  const src = path.join(templates, "plans", "INDEX.md");
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function installPrTemplate(templates: string, force: boolean): boolean {
  const dest = path.join(repoRoot(), ".github", "PULL_REQUEST_TEMPLATE.md");
  if (fs.existsSync(dest) && !force) return false;

  const src = path.join(templates, "github", "PULL_REQUEST_TEMPLATE.md");
  if (!fs.existsSync(src)) return false;

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

function mergeHooks(auto: boolean): void {
  const p = settingsPath();
  const existing = readJson<Settings>(p) ?? {};
  existing.hooks ??= {};

  existing.hooks.PostToolUse ??= [];
  if (
    !existing.hooks.PostToolUse.some((h) =>
      JSON.stringify(h).includes(POST_EDIT_HOOK_ID)
    )
  ) {
    existing.hooks.PostToolUse.push({
      matcher: "Edit|Write|MultiEdit",
      hooks: [{ type: "command", command: POST_EDIT_COMMAND }],
    });
  }

  existing.hooks.SessionStart ??= [];
  if (
    !existing.hooks.SessionStart.some((h) =>
      JSON.stringify(h).includes("memex-md stale")
    )
  ) {
    existing.hooks.SessionStart.push({
      hooks: [{ type: "command", command: SESSION_START_COMMAND }],
    });
  }

  if (auto) {
    existing.hooks.Stop ??= [];
    if (
      !existing.hooks.Stop.some((h) =>
        JSON.stringify(h).includes("memex-md draft")
      )
    ) {
      existing.hooks.Stop.push({
        hooks: [{ type: "command", command: STOP_HOOK_COMMAND }],
      });
    }
  }

  writeJson(p, existing);
}

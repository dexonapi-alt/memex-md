import * as fs from "node:fs";
import * as path from "node:path";
import {
  claudeDir,
  knowledgeDir,
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

### Scopes

Before answering questions or making non-trivial changes, consult
\`.claude/knowledge/\`:

- \`architecture.md\` — system shape, services, data flow
- \`decisions.md\` — non-obvious choices and their rationale
- \`patterns.md\` — reusable code patterns in this codebase
- \`gotchas.md\` — past bugs and non-obvious constraints
- \`glossary.md\` — project-specific terminology

### How to update

When work reveals a new decision, pattern, or gotcha, record it:

\`\`\`
npx memex-md add <scope> "<title>"
\`\`\`

Or let Claude draft entries from a diff:

\`\`\`
npx memex-md draft --staged --write
\`\`\`

See \`.claude/skills/knowledge-update/SKILL.md\` for full triggers and conventions.
Run \`npx memex-md promote\` to move any repo-level facts already stored in
machine memory into \`.claude/knowledge/\`.
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

  const hookInstalled = installPreCommitHook(templates, force);
  const prTemplateInstalled = installPrTemplate(templates, force);
  const claudeMdStatus = installClaudeMd(force);

  mergeHooks();

  const claudeMdLabel = {
    created: "created",
    appended: "appended block",
    updated: "updated block (--force)",
    present: "already has block (skipped)",
  }[claudeMdStatus];

  console.log("Initialized memex-md:");
  console.log("  .claude/knowledge/                scaffolded");
  console.log("  .claude/skills/knowledge-update/  installed");
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

function installPrTemplate(templates: string, force: boolean): boolean {
  const dest = path.join(repoRoot(), ".github", "PULL_REQUEST_TEMPLATE.md");
  if (fs.existsSync(dest) && !force) return false;

  const src = path.join(templates, "github", "PULL_REQUEST_TEMPLATE.md");
  if (!fs.existsSync(src)) return false;

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

function mergeHooks(): void {
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

  writeJson(p, existing);
}

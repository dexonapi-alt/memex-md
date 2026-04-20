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

  mergeHooks();

  console.log("Initialized memex-md:");
  console.log("  .claude/knowledge/                scaffolded");
  console.log("  .claude/skills/knowledge-update/  installed");
  console.log(
    `  .claude/hooks/pre-commit          ${hookInstalled ? "installed" : "skipped (exists)"}`
  );
  console.log(
    `  .github/PULL_REQUEST_TEMPLATE.md  ${prTemplateInstalled ? "installed" : "skipped (exists)"}`
  );
  console.log("  .claude/settings.json             hooks registered:");
  console.log("    - PostToolUse  (knowledge-update reminder)");
  console.log("    - SessionStart (stale-entry flag)");
  console.log("");
  console.log("Next:");
  console.log("  1. git add .claude/ .github/ && commit");
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

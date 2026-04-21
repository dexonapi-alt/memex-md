import { init } from "./commands/init";
import { add } from "./commands/add";
import { list } from "./commands/list";
import { search } from "./commands/search";
import { validate } from "./commands/validate";
import { prune } from "./commands/prune";
import { draft } from "./commands/draft";
import { ask } from "./commands/ask";
import { stale } from "./commands/stale";
import { check } from "./commands/check";
import { graph } from "./commands/graph";
import { promote } from "./commands/promote";
import { preference } from "./commands/preference";

const VERSION = "0.6.2";

const HELP = `memex-md ${VERSION} — in-repo knowledge base for Claude Code

Usage:
  memex-md <command> [args]

Core commands:
  init [--force] [--auto]          Scaffold .claude/knowledge/ + skill + hooks
                                   --auto also registers a Stop hook that runs
                                   \`draft --working --auto\` after every
                                   Claude response (Claude decides if entries
                                   are warranted; writes silently on approval)
  add <scope> "<title>"            Append a new entry to a scope
  list [scope]                     List entries (optionally one scope)
  search <query>                   Grep across all knowledge files
  validate                         Check knowledge base integrity
  prune [--days N]                 Flag entries untouched for N days (default 180)
  preference "<text>"              Append a project-level preference bullet to
                                   CLAUDE.md's "## Preferences" section.
                                   Powers the /memex:preference slash command.

Claude-powered commands:
  draft [--staged|--working|--commit <sha>] [--write] [--auto]
                                   Propose knowledge entries from a git diff.
                                   --auto: silent no-op mode for Stop hook
                                   (implies --write; never aborts)
  ask [--scope <s,s>] "<question>" Answer a question using the knowledge base
                                   (--scope narrows which files are loaded:
                                   architecture, decisions, patterns, gotchas,
                                   glossary — comma-separated)

Automation:
  stale [--days N] [--brief]       List stale entries (used by SessionStart hook)
  check [--base <ref>|--staged] [--patterns <glob,glob>] [--strict]
                                   CI / pre-commit: fail if sensitive files
                                   changed without a knowledge update
  graph [--mermaid]                Show supersedes/related relationships
                                   between entries (ASCII by default, Mermaid
                                   with --mermaid for GitHub rendering)
  promote [--list|--dry-run|--all] Migrate repo-level facts accidentally stored
                                   in Claude's machine memory
                                   (~/.claude/projects/.../memory/) into
                                   .claude/knowledge/. Interactive by default.

Misc:
  help                             Show this message
  version                          Print version

Scopes:
  architecture, decisions, patterns, gotchas, glossary

Examples:
  memex-md init
  memex-md add decisions "chose SQLite over Postgres for local dev"
  memex-md draft --staged --write
  memex-md ask "why did we pick SQLite locally?"
  memex-md check --base origin/main...HEAD --strict

Environment:
  CLAUDE_MEMEX_CLAUDE_BIN          Path to the claude binary (default: claude
                                   on *nix, claude.cmd on Windows)
`;

async function main(): Promise<void> {
  const [, , command, ...rest] = process.argv;

  switch (command) {
    case "init":
      await init(rest);
      break;
    case "add":
      await add(rest);
      break;
    case "list":
      await list(rest);
      break;
    case "search":
      await search(rest);
      break;
    case "validate":
      await validate(rest);
      break;
    case "prune":
      await prune(rest);
      break;
    case "draft":
      await draft(rest);
      break;
    case "ask":
      await ask(rest);
      break;
    case "stale":
    case "stale-check":
      await stale(rest);
      break;
    case "check":
      await check(rest);
      break;
    case "graph":
      await graph(rest);
      break;
    case "promote":
      await promote(rest);
      break;
    case "preference":
    case "pref":
      await preference(rest);
      break;
    case "version":
    case "--version":
    case "-v":
      console.log(VERSION);
      break;
    case undefined:
    case "help":
    case "--help":
    case "-h":
      console.log(HELP);
      break;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

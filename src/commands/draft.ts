import * as fs from "node:fs";
import * as path from "node:path";
import { runClaudePrompt } from "../lib/exec";
import {
  isGitRepo,
  diffWorking,
  diffStaged,
  diffLastCommit,
  diffCommit,
} from "../lib/git";
import {
  VALID_SCOPES,
  knowledgeDir,
  requireKnowledgeBase,
} from "../lib/paths";
import { today } from "../lib/fs-utils";

const MAX_DIFF_CHARS = 50_000;

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return (
    s.slice(0, n) +
    `\n\n[... truncated ${s.length - n} chars of diff]`
  );
}

function readIndex(): string {
  const p = path.join(knowledgeDir(), "INDEX.md");
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

function buildPrompt(diff: string, indexMd: string): string {
  return `You are helping maintain an in-repo knowledge base at .claude/knowledge/ for a software project.

A git diff is provided below. Read it and propose knowledge-base entries for any of these scopes, BUT ONLY when actually warranted. Prefer zero entries to forced entries.

Scopes:
- architecture: new service/module/data flow, or structural change worth recording
- decisions: a non-obvious choice (X over Y) worth recording the why for
- patterns: a reusable code shape likely to recur and worth naming
- gotchas: a bug root cause or footgun future contributors should avoid
- glossary: a domain term worth defining

Output format — emit each entry enclosed between exact markers like this:

<SCOPE:decisions>
## Short title
- **Added:** ${today()}
- Fact/rule/decision in 2-5 bullets with *why*.
</SCOPE>

<SCOPE:gotchas>
## Short title
- **Added:** ${today()}
- Symptom / root cause / fix.
</SCOPE>

Rules:
- Use today's date ${today()} on the **Added:** line.
- Lead each entry with the fact or rule, not the story.
- Keep entries to 3-8 bullets.
- If NO entries are warranted, output exactly the single line: NO_ENTRIES_NEEDED
- Do not output any preamble or explanation outside the <SCOPE:...> blocks.

Current knowledge base INDEX.md (for context on existing scopes and coverage):

${indexMd}

--- GIT DIFF ---

${diff}
--- END DIFF ---
`;
}

interface Parsed {
  scope: string;
  body: string;
}

function parseEntries(output: string): Parsed[] {
  const re = /<SCOPE:(\w+)>([\s\S]*?)<\/SCOPE>/g;
  const out: Parsed[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(output)) !== null) {
    out.push({ scope: m[1].trim(), body: m[2].trim() });
  }
  return out;
}

function applyEntries(entries: Parsed[]): void {
  for (const e of entries) {
    if (!(VALID_SCOPES as readonly string[]).includes(e.scope)) {
      console.error(`  skipped: unknown scope "${e.scope}"`);
      continue;
    }
    const file = path.join(knowledgeDir(), `${e.scope}.md`);
    if (!fs.existsSync(file)) {
      console.error(`  skipped: ${file} missing`);
      continue;
    }
    fs.appendFileSync(file, "\n\n" + e.body + "\n");
    const title = (e.body.match(/^##\s+(.+)$/m) ?? [])[1] ?? "(untitled)";
    console.error(`  appended to ${e.scope}.md: ${title}`);
  }
}

export async function draft(args: string[]): Promise<void> {
  requireKnowledgeBase();
  if (!isGitRepo()) {
    console.error("Not inside a git repository.");
    process.exit(1);
  }

  let diff = "";
  try {
    if (args.includes("--staged")) {
      diff = diffStaged();
    } else if (args.includes("--working")) {
      diff = diffWorking();
    } else {
      const idx = args.indexOf("--commit");
      if (idx >= 0 && args[idx + 1]) {
        diff = diffCommit(args[idx + 1]);
      } else {
        diff = diffLastCommit();
      }
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  if (!diff.trim()) {
    console.log("No diff found. Use --staged, --working, or --commit <sha>.");
    return;
  }

  const indexMd = readIndex();
  const prompt = buildPrompt(truncate(diff, MAX_DIFF_CHARS), indexMd);

  console.error("[memex-md] drafting entries with claude -p ...");
  console.error("");

  let output: string;
  try {
    output = await runClaudePrompt(prompt);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  console.error("");
  if (/^\s*NO_ENTRIES_NEEDED\s*$/m.test(output)) {
    console.error("[memex-md] No entries warranted for this diff.");
    return;
  }

  const parsed = parseEntries(output);
  if (parsed.length === 0) {
    console.error(
      "[memex-md] Claude did not emit any <SCOPE:...> entries. " +
        "Output was printed above; review and add manually if useful."
    );
    return;
  }

  if (args.includes("--write")) {
    console.error(`[memex-md] Writing ${parsed.length} entries:`);
    applyEntries(parsed);
  } else {
    console.error(
      `[memex-md] ${parsed.length} entries proposed above. ` +
        `Re-run with --write to append them to the knowledge base.`
    );
  }
}

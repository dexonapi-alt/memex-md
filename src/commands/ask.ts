import * as fs from "node:fs";
import * as path from "node:path";
import { runClaudePrompt } from "../lib/exec";
import {
  VALID_SCOPES,
  knowledgeDir,
  requireKnowledgeBase,
} from "../lib/paths";

const MAX_KB_CHARS = 120_000;

function readKnowledge(scopes?: string[]): { text: string; files: string[] } {
  const dir = knowledgeDir();
  const all = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const filter = scopes
    ? (f: string): boolean => {
        if (f === "INDEX.md") return true;
        const base = f.replace(/\.md$/, "");
        return scopes.includes(base);
      }
    : (): boolean => true;

  const parts: string[] = [];
  const loaded: string[] = [];
  let total = 0;

  for (const f of all) {
    if (!filter(f)) continue;
    const content = fs.readFileSync(path.join(dir, f), "utf8");
    const block = `\n===== ${f} =====\n${content}\n`;
    if (total + block.length > MAX_KB_CHARS) {
      parts.push(
        `\n[... remaining files omitted, knowledge base exceeds ${MAX_KB_CHARS} chars — use --scope to narrow]`
      );
      break;
    }
    parts.push(block);
    loaded.push(f);
    total += block.length;
  }
  return { text: parts.join(""), files: loaded };
}

function buildPrompt(question: string, kb: string): string {
  return `You are answering a question about a software project using ONLY the knowledge base files provided below. The files live at .claude/knowledge/ and are maintained by the claude-memex tool.

Rules:
- Cite the source file and entry title when you answer, e.g. "(decisions.md: Chose SQLite over Postgres)".
- If the knowledge base does not contain the answer, say so plainly. Do not speculate or pull from general knowledge.
- Keep the answer tight. No preamble, no summary, no restating the question.

=== KNOWLEDGE BASE ===
${kb}
=== END KNOWLEDGE BASE ===

QUESTION: ${question}
`;
}

function parseScopes(args: string[]): {
  scopes: string[] | null;
  rest: string[];
} {
  const idx = args.indexOf("--scope");
  if (idx < 0 || !args[idx + 1]) return { scopes: null, rest: args };
  const value = args[idx + 1];
  const scopes = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const rest = [...args.slice(0, idx), ...args.slice(idx + 2)];
  return { scopes, rest };
}

export async function ask(args: string[]): Promise<void> {
  requireKnowledgeBase();

  const { scopes, rest } = parseScopes(args);

  if (scopes) {
    const invalid = scopes.filter(
      (s) => !(VALID_SCOPES as readonly string[]).includes(s)
    );
    if (invalid.length > 0) {
      console.error(`Invalid scope(s): ${invalid.join(", ")}`);
      console.error(`Valid: ${VALID_SCOPES.join(", ")}`);
      process.exit(1);
    }
  }

  const question = rest.join(" ").trim();
  if (!question) {
    console.error('Usage: claude-memex ask [--scope <scope,scope>] "<question>"');
    process.exit(1);
  }

  const { text: kb, files } = readKnowledge(scopes ?? undefined);
  if (!kb.trim()) {
    console.error("Knowledge base is empty. Add entries with `claude-memex add`.");
    process.exit(1);
  }

  if (scopes) {
    console.error(
      `[claude-memex] asking against ${files.length} file(s): ${files.join(", ")}`
    );
  }

  const prompt = buildPrompt(question, kb);

  try {
    await runClaudePrompt(prompt);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
  console.log("");
}

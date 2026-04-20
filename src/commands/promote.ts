import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as readline from "node:readline/promises";
import {
  VALID_SCOPES,
  knowledgeDir,
  repoRoot,
  requireKnowledgeBase,
} from "../lib/paths";
import { slugify, today } from "../lib/fs-utils";

interface MemoryEntry {
  file: string;
  absPath: string;
  name: string;
  description: string;
  type: string;
  body: string;
}

function projectSlug(cwd: string): string {
  // Claude Code transforms the absolute project path into a slug by
  // replacing ':', '\', '/' with '-'. On Windows this turns
  // 'C:\Users\DevAPI\foo' into 'C--Users-DevAPI-foo'.
  return cwd.replace(/[:\\/]/g, "-");
}

function memoryDir(cwd: string): string {
  return path.join(
    os.homedir(),
    ".claude",
    "projects",
    projectSlug(cwd),
    "memory"
  );
}

function parseFrontmatter(content: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const fm: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return { frontmatter: fm, body: match[2].trim() };
}

function readMemoryEntries(memDir: string): MemoryEntry[] {
  const entries: MemoryEntry[] = [];
  const files = fs
    .readdirSync(memDir)
    .filter((f) => f.endsWith(".md") && f !== "MEMORY.md")
    .sort();

  for (const f of files) {
    const absPath = path.join(memDir, f);
    const content = fs.readFileSync(absPath, "utf8");
    const { frontmatter, body } = parseFrontmatter(content);
    entries.push({
      file: f,
      absPath,
      name: frontmatter.name ?? f.replace(/\.md$/, ""),
      description: frontmatter.description ?? "",
      type: frontmatter.type ?? "unknown",
      body,
    });
  }
  return entries;
}

function removeFromIndex(memDir: string, fileName: string): void {
  const indexPath = path.join(memDir, "MEMORY.md");
  if (!fs.existsSync(indexPath)) return;
  const lines = fs.readFileSync(indexPath, "utf8").split("\n");
  const filtered = lines.filter(
    (l) => !l.includes(`(${fileName})`) && !l.includes(`[${fileName}]`)
  );
  fs.writeFileSync(indexPath, filtered.join("\n"));
}

function appendToScope(scope: string, entry: MemoryEntry, title: string): void {
  const file = path.join(knowledgeDir(), `${scope}.md`);
  const id = slugify(title);
  const block = [
    "",
    `## ${title}`,
    "",
    `- **Added:** ${today()}`,
    `- **ID:** ${id}`,
    `- **Source:** promoted from machine memory (\`${entry.file}\`)`,
    "",
    entry.body,
    "",
  ].join("\n");
  fs.appendFileSync(file, block);
}

const SCOPE_KEYS: Record<string, string> = {
  d: "decisions",
  p: "patterns",
  g: "gotchas",
  a: "architecture",
  l: "glossary",
};

function formatEntry(e: MemoryEntry, i: number, total: number): string {
  const preview = e.body.split("\n").slice(0, 5).join("\n");
  return [
    `\n[${i + 1}/${total}] ${e.file}`,
    `  name:        ${e.name}`,
    `  description: ${e.description}`,
    `  type:        ${e.type}`,
    `  preview:`,
    preview
      .split("\n")
      .map((l) => `    ${l}`)
      .join("\n"),
  ].join("\n");
}

async function prompt(
  rl: readline.Interface,
  message: string
): Promise<string> {
  const answer = await rl.question(message);
  return answer.trim().toLowerCase();
}

export async function promote(args: string[]): Promise<void> {
  requireKnowledgeBase();

  const listOnly = args.includes("--list");
  const dryRun = args.includes("--dry-run");
  const all = args.includes("--all");

  const cwd = repoRoot();
  const memDir = memoryDir(cwd);

  if (!fs.existsSync(memDir)) {
    console.log(`No machine memory found for this project.`);
    console.log(`  Looked at: ${memDir}`);
    return;
  }

  const entries = readMemoryEntries(memDir);
  if (entries.length === 0) {
    console.log("No topic memories to promote.");
    return;
  }

  console.log(
    `Found ${entries.length} machine-memory entr${
      entries.length === 1 ? "y" : "ies"
    } for this project at:`
  );
  console.log(`  ${memDir}\n`);

  if (listOnly) {
    for (let i = 0; i < entries.length; i++) {
      console.log(formatEntry(entries[i], i, entries.length));
    }
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      console.log(formatEntry(e, i, entries.length));

      console.log(
        "\n  [k] keep as machine memory (default)   [x] delete machine memory"
      );
      console.log(
        "  [d] decisions   [p] patterns   [g] gotchas   [a] architecture   [l] glossary"
      );

      const defaultChoice = all ? classifyDefault(e) : "k";
      const raw = all
        ? defaultChoice
        : await prompt(rl, `  choice [${defaultChoice}]> `);
      const choice = raw || defaultChoice;

      if (choice === "k" || choice === "") {
        console.log("  → keeping in machine memory.");
        continue;
      }

      if (choice === "x") {
        if (dryRun) {
          console.log(`  → [dry-run] would delete ${e.absPath}`);
        } else {
          fs.unlinkSync(e.absPath);
          removeFromIndex(memDir, e.file);
          console.log(`  → deleted ${e.file}`);
        }
        continue;
      }

      const scope = SCOPE_KEYS[choice];
      if (!scope || !(VALID_SCOPES as readonly string[]).includes(scope)) {
        console.log(`  → unrecognised choice, skipping.`);
        continue;
      }

      const title = all
        ? e.name
        : (await prompt(
            rl,
            `  short title for the ${scope} entry [${e.name}]> `
          )) || e.name;

      if (dryRun) {
        console.log(
          `  → [dry-run] would append to .claude/knowledge/${scope}.md as "${title}"`
        );
        console.log(`     and delete ${e.file}`);
      } else {
        appendToScope(scope, e, title);
        fs.unlinkSync(e.absPath);
        removeFromIndex(memDir, e.file);
        console.log(
          `  → appended to .claude/knowledge/${scope}.md as "${title}"`
        );
        console.log(`     deleted ${e.file}`);
      }
    }
  } finally {
    rl.close();
  }

  console.log(
    "\nDone. Review .claude/knowledge/ changes with `git diff`, then commit."
  );
}

function classifyDefault(e: MemoryEntry): string {
  // --all mode: best-guess default based on frontmatter type
  switch (e.type) {
    case "project":
      return "d"; // decisions
    case "feedback":
      return "p"; // patterns
    case "reference":
      return "a"; // architecture
    case "user":
      return "k"; // keep — user-level
    default:
      return "k"; // safe default
  }
}

import * as fs from "node:fs";
import * as path from "node:path";
import { knowledgeDir, requireKnowledgeBase } from "../lib/paths";

export async function search(args: string[]): Promise<void> {
  requireKnowledgeBase();

  const query = args.join(" ").trim();
  if (!query) {
    console.error("Usage: memex-md search <query>");
    process.exit(1);
  }

  const needle = query.toLowerCase();
  const files = fs
    .readdirSync(knowledgeDir())
    .filter((f) => f.endsWith(".md"));

  let hits = 0;
  for (const f of files) {
    const content = fs.readFileSync(path.join(knowledgeDir(), f), "utf8");
    content.split("\n").forEach((line, i) => {
      if (line.toLowerCase().includes(needle)) {
        console.log(`${f}:${i + 1}: ${line.trim()}`);
        hits++;
      }
    });
  }

  console.log(`\n${hits} match${hits === 1 ? "" : "es"} for "${query}"`);
  if (hits === 0) process.exit(1);
}

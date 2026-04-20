import * as fs from "node:fs";
import * as path from "node:path";
import { knowledgeDir } from "../lib/paths";

interface StaleEntry {
  file: string;
  title: string;
  added: string;
  ageDays: number;
}

function findStale(days: number): StaleEntry[] {
  const dir = knowledgeDir();
  if (!fs.existsSync(dir)) return [];

  const cutoffMs = Date.now() - days * 86_400_000;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "INDEX.md");

  const out: StaleEntry[] = [];
  for (const f of files) {
    const content = fs.readFileSync(path.join(dir, f), "utf8");
    const blocks = content.split(/^## /m).slice(1);
    for (const block of blocks) {
      const title = block.split("\n", 1)[0].trim();
      const m = block.match(/\*\*Added:\*\*\s*(\d{4}-\d{2}-\d{2})/);
      if (!m) continue;
      const ts = Date.parse(m[1]);
      if (Number.isFinite(ts) && ts < cutoffMs) {
        const ageDays = Math.floor((Date.now() - ts) / 86_400_000);
        out.push({ file: f, title, added: m[1], ageDays });
      }
    }
  }
  return out;
}

export async function stale(args: string[]): Promise<void> {
  const daysIdx = args.indexOf("--days");
  const days =
    daysIdx >= 0 && args[daysIdx + 1] ? Number(args[daysIdx + 1]) : 180;
  if (!Number.isFinite(days) || days <= 0) {
    console.error("--days must be a positive number");
    process.exit(1);
  }

  const brief = args.includes("--brief");
  const entries = findStale(days);

  if (entries.length === 0) {
    if (!brief) console.log(`No entries older than ${days} days.`);
    return;
  }

  if (brief) {
    const sample = entries.slice(0, 3).map((e) => `${e.file}:"${e.title}"`);
    const more = entries.length > 3 ? ` (+${entries.length - 3} more)` : "";
    console.log(
      `[memex-md] ${entries.length} knowledge entr${
        entries.length === 1 ? "y" : "ies"
      } older than ${days} days — review for staleness: ${sample.join(", ")}${more}`
    );
    return;
  }

  console.log(`Entries older than ${days} days:`);
  for (const e of entries) {
    console.log(`  ${e.file}  [${e.added}, ${e.ageDays}d old]  ${e.title}`);
  }
}

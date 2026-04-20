import * as fs from "node:fs";
import * as path from "node:path";
import { repoRoot } from "../lib/paths";

const SECTION_HEADING = "## Preferences";

export async function preference(args: string[]): Promise<void> {
  const text = args
    .filter((a) => !a.startsWith("--"))
    .join(" ")
    .replace(/^["']|["']$/g, "")
    .trim();

  if (!text) {
    console.error('Usage: memex-md preference "<text>"');
    console.error('  Appends a bullet to the "## Preferences" section of CLAUDE.md.');
    process.exit(1);
  }

  const claudeMdPath = path.join(repoRoot(), "CLAUDE.md");
  if (!fs.existsSync(claudeMdPath)) {
    console.error("CLAUDE.md not found at repo root. Run `memex-md init` first.");
    process.exit(1);
  }

  const content = fs.readFileSync(claudeMdPath, "utf8");
  const bullet = `- ${text}`;

  if (content.includes(bullet)) {
    console.log(`Already recorded in CLAUDE.md: ${text}`);
    return;
  }

  const next = insertBullet(content, bullet);
  fs.writeFileSync(claudeMdPath, next);
  console.log("Added to CLAUDE.md:");
  console.log(`  ${bullet}`);
}

function insertBullet(content: string, bullet: string): string {
  const sectionIdx = content.indexOf(SECTION_HEADING);

  if (sectionIdx === -1) {
    const separator = content.endsWith("\n") ? "\n" : "\n\n";
    return content + `${separator}${SECTION_HEADING}\n\n${bullet}\n`;
  }

  // Find end of section: next "\n## " heading at the same level, or EOF.
  const afterHeading = content.indexOf("\n", sectionIdx) + 1;
  const nextHeadingIdx = content.indexOf("\n## ", afterHeading);
  const sectionEndIdx = nextHeadingIdx === -1 ? content.length : nextHeadingIdx;

  const before = content.slice(0, sectionEndIdx);
  const after = content.slice(sectionEndIdx);

  // Ensure a newline between existing section content and our bullet.
  const needsNewline = !before.endsWith("\n");
  const needsBlankLine = !before.endsWith("\n\n") && !before.endsWith("\n- ");

  let insert = "";
  if (needsNewline) insert += "\n";
  if (needsBlankLine && before.trim().endsWith(SECTION_HEADING)) {
    // Section is empty — add blank line before first bullet.
    insert += "\n";
  }
  insert += `${bullet}\n`;

  return before + insert + after;
}

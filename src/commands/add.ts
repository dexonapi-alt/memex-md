import * as fs from "node:fs";
import {
  VALID_SCOPES,
  isScope,
  knowledgeFile,
  requireKnowledgeBase,
} from "../lib/paths";
import { today, slugify } from "../lib/fs-utils";

export async function add(args: string[]): Promise<void> {
  requireKnowledgeBase();

  const [scope, ...titleParts] = args;
  const title = titleParts.join(" ").replace(/^["']|["']$/g, "").trim();

  if (!scope || !title) {
    console.error('Usage: memex-md add <scope> "<title>"');
    console.error(`Scopes: ${VALID_SCOPES.join(", ")}`);
    process.exit(1);
  }

  if (!isScope(scope)) {
    console.error(`Invalid scope: ${scope}`);
    console.error(`Valid: ${VALID_SCOPES.join(", ")}`);
    process.exit(1);
  }

  const file = knowledgeFile(scope);
  if (!fs.existsSync(file)) {
    console.error(`Missing ${file}. Run: memex-md init`);
    process.exit(1);
  }

  const id = slugify(title);
  const entry = [
    "",
    `## ${title}`,
    "",
    `- **Added:** ${today()}`,
    `- **ID:** ${id}`,
    "",
    "_TODO: describe the fact, rule, or decision. Keep it to 3-10 lines._",
    "",
  ].join("\n");

  fs.appendFileSync(file, entry);
  console.log(`Appended to .claude/knowledge/${scope}.md`);
  console.log(`  Title: ${title}`);
  console.log(`  ID:    ${id}`);
}
